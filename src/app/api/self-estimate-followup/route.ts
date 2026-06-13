import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { decrypt } from '@/lib/encryption';
import {
  calculatePestOnlyEstimate,
  calculateSelfEstimateTotals,
  formatKoreanDateTime,
  formatKRW,
  translateIssues,
} from '@/lib/selfEstimate';
import { appendFollowupRows, ensureFollowupSheet, getFollowupSheetUrl } from '@/lib/server/googleSheets';
import { getSupabaseAdminClient } from '@/lib/server/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const resend = new Resend(process.env.RESEND_API_KEY);

type SheetRowContext = {
  sessionId: string;
  createdAt: string;
  checkedAt: string;
  phone: string;
  address: string;
  issues: string[];
  pyeong?: number | null;
  sash?: number | null;
  pestScreenCount?: number | null;
  estimateMode: 'window_seal' | 'pest_only';
  estimateLabel: string;
  estimateAmount: string;
  refCode: string;
  adCode: string;
};

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${cronSecret}`;
}

function getKstStartOfTodayIso() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const today = formatter.format(new Date());
  return new Date(`${today}T00:00:00+09:00`).toISOString();
}

function compactCount(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'))
    .map(([label, count]) => `${label} ${count}건`)
    .join(', ') || '없음';
}

function buildSheetRow(item: SheetRowContext) {
  return [
    '연락필요',
    '',
    '',
    '',
    '',
    item.phone,
    item.address,
    translateIssues(item.issues),
    item.estimateLabel,
    item.estimateAmount,
    item.pyeong ? `${item.pyeong}` : '',
    item.sash ? `${item.sash}` : '',
    item.pestScreenCount ? `${item.pestScreenCount}` : '',
    item.refCode,
    item.adCode,
    formatKoreanDateTime(item.createdAt),
    formatKoreanDateTime(item.checkedAt),
    formatKoreanDateTime(),
    item.sessionId,
  ];
}

async function sendSummaryEmail(items: SheetRowContext[], invalidCount = 0) {
  const sheetUrl = getFollowupSheetUrl();
  const issueLabels = items.flatMap((item) => item.issues.length ? [translateIssues(item.issues)] : ['미입력']);
  const modeLabels = items.map((item) => (item.estimateMode === 'pest_only' ? '방충솔루션 단독' : '창문틈/모헤어 견적'));
  const refLabels = items.map((item) => item.refCode || 'zapgoself');
  const totalCount = items.length + invalidCount;

  const html = `
    <div style="font-family:Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;max-width:720px;margin:0 auto;padding:28px;color:#222;">
      <h1 style="font-size:26px;line-height:1.35;margin:0 0 14px;font-weight:800;">미상담 고객 리스트가 업데이트되었습니다</h1>
      <div style="height:3px;background:#b10000;margin:0 0 24px;"></div>
      <p style="font-size:16px;line-height:1.7;margin:0 0 18px;">오늘 구글시트에 새로 추가된 미상담 기록은 <b>${totalCount}건</b>입니다.</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #eeeeee;font-size:15px;margin-bottom:22px;">
        <tr><td style="padding:12px 14px;font-weight:700;width:160px;">연락 가능</td><td style="padding:12px 14px;">${items.length}건</td></tr>
        <tr style="background:#f7f7f7;"><td style="padding:12px 14px;font-weight:700;">복원 실패</td><td style="padding:12px 14px;">${invalidCount}건</td></tr>
        <tr style="background:#f7f7f7;"><td style="padding:12px 14px;font-weight:700;width:160px;">견적 유형</td><td style="padding:12px 14px;">${modeLabels.filter((v, i, arr) => arr.indexOf(v) === i).map((mode) => `${mode} ${modeLabels.filter((value) => value === mode).length}건`).join(', ')}</td></tr>
        <tr><td style="padding:12px 14px;font-weight:700;">문제 유형</td><td style="padding:12px 14px;">${compactCount(issueLabels)}</td></tr>
        <tr style="background:#f7f7f7;"><td style="padding:12px 14px;font-weight:700;">대리점 코드</td><td style="padding:12px 14px;">${compactCount(refLabels)}</td></tr>
      </table>
      <a href="${sheetUrl}" style="display:inline-block;background:#b10000;color:#fff;text-decoration:none;font-weight:700;padding:13px 18px;border-radius:8px;">구글시트에서 확인하기</a>
      <p style="margin-top:22px;color:#888;font-size:13px;line-height:1.6;">시트의 연락상태를 연락필요/연락완료/보류/제외로 관리하고, 상담메모와 담당자를 기재해 주세요.</p>
    </div>
  `;

  return resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'zapgoteam@gmail.com',
    subject: `[미상담고객] 오늘 구글시트 추가 ${totalCount}건`,
    html,
  });
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const cutoffIso = getKstStartOfTodayIso();
    const now = new Date().toISOString();
    const { data: sessions, error } = await supabase
      .from('self_estimate_sessions')
      .select('id, created_at, payload_encrypted')
      .lt('created_at', cutoffIso)
      .is('followup_sent_at', null)
      .is('consult_requested_at', null)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('미상담 세션 조회 오류:', error);
      return NextResponse.json({ error: '세션 조회 실패' }, { status: 500 });
    }

    const items: SheetRowContext[] = [];
    const invalidRows: string[][] = [];

    await ensureFollowupSheet();

    for (const session of sessions ?? []) {
      let payload: any = null;
      try {
        const rawPayload = decrypt(session.payload_encrypted);
        payload = rawPayload ? JSON.parse(rawPayload) : null;
      } catch (error) {
        console.warn('미상담 payload 복원 실패:', session.id, error);
      }

      if (!payload) {
        invalidRows.push([
          '복원실패',
          '',
          '암호화 키 불일치 또는 손상 데이터로 연락처 복원이 불가합니다.',
          '',
          '',
          '',
          '',
          '데이터 복원 실패',
          '복원실패',
          '',
          '',
          '',
          '',
          '',
          '',
          formatKoreanDateTime(session.created_at),
          formatKoreanDateTime(now),
          formatKoreanDateTime(),
          session.id,
        ]);
        continue;
      }

      const estimateMode = payload.estimateMode === 'pest_only' ? 'pest_only' : 'window_seal';
      const baseQuotes =
        estimateMode === 'window_seal'
          ? payload.baseQuotes || calculateSelfEstimateTotals({ pyeong: payload.pyeong, sash: payload.sash })
          : null;
      const pestOnlyEstimate =
        estimateMode === 'pest_only'
          ? payload.pestBaseQuote || calculatePestOnlyEstimate(Number(payload.pestScreenCount) || 1)
          : null;
      const estimateAmount =
        estimateMode === 'pest_only'
          ? formatKRW(pestOnlyEstimate?.total || 0)
          : [
              `패브릭 ${formatKRW(baseQuotes?.fabric || 0)}`,
              `일반 ${formatKRW(baseQuotes?.mohair || 0)}`,
              `측면 ${formatKRW(baseQuotes?.side || 0)}`,
            ].join(' / ');

      items.push({
        sessionId: session.id,
        createdAt: session.created_at,
        checkedAt: now,
        phone: payload.phone || '',
        address: `${payload.selectedAddress || ''} ${payload.detailAddress || ''}`.trim(),
        issues: payload.issues || [],
        pyeong: payload.pyeong,
        sash: payload.sash,
        pestScreenCount: estimateMode === 'pest_only' ? pestOnlyEstimate?.screenCount : payload.pestScreenCount,
        estimateMode,
        estimateLabel: estimateMode === 'pest_only' ? '방충솔루션 단독' : '창문틈/모헤어 견적',
        estimateAmount,
        refCode: payload.referralCode || payload.dealerCode || 'zapgoself',
        adCode: payload.adCode || '',
      });
    }

    const rows = [...items.map(buildSheetRow), ...invalidRows];

    if (rows.length === 0) {
      return NextResponse.json({ success: true, cutoffIso, scanned: sessions?.length ?? 0, appended: 0, invalid: 0 });
    }

    await appendFollowupRows(rows);

    const { error: summaryError } = await sendSummaryEmail(items, invalidRows.length);
    if (summaryError) {
      console.error('미상담 요약 메일 발송 실패:', summaryError);
      return NextResponse.json({ error: '요약 메일 발송 실패', appended: rows.length, invalid: invalidRows.length }, { status: 500 });
    }

    const ids = [
      ...items.map((item) => item.sessionId),
      ...invalidRows.map((row) => row[18]),
    ];
    const { error: updateError } = await supabase
      .from('self_estimate_sessions')
      .update({ followup_sent_at: now })
      .in('id', ids);

    if (updateError) {
      console.error('미상담 시트 기록 완료 상태 업데이트 실패:', updateError);
      return NextResponse.json({ error: '상태 업데이트 실패', appended: rows.length, invalid: invalidRows.length }, { status: 500 });
    }

    return NextResponse.json({ success: true, cutoffIso, scanned: sessions?.length ?? 0, appended: rows.length, contactable: items.length, invalid: invalidRows.length, sheetUrl: getFollowupSheetUrl() });
  } catch (error) {
    console.error('미상담 구글시트 기록 오류:', error);
    return NextResponse.json({ error: '미상담 구글시트 기록 실패' }, { status: 500 });
  }
}
