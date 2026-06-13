import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/encryption';
import { appendConsultRows } from '@/lib/server/googleSheets';
import { getSupabaseAdminClient } from '@/lib/server/supabaseAdmin';
import { formatKoreanDateTime, translateIssues } from '@/lib/selfEstimate';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${cronSecret}`;
}

function getKstStartIso(value: string) {
  return new Date(`${value}T00:00:00+09:00`).toISOString();
}

function pickSummaryValue(summary: string, label: string) {
  const part = summary
    .split(' / ')
    .find((item) => item.trim().startsWith(`${label}:`));
  return part ? part.replace(`${label}:`, '').trim() : '';
}

function safeDecrypt(value?: string | null) {
  if (!value) return '';
  return decrypt(value) || value;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const since = request.nextUrl.searchParams.get('since') || '2026-05-25';
    const sinceIso = getKstStartIso(since);
    const supabase = getSupabaseAdminClient();

    const { data: sessions, error } = await supabase
      .from('self_estimate_sessions')
      .select('id, customer_id, created_at, consult_requested_at, payload_encrypted')
      .gte('consult_requested_at', sinceIso)
      .not('consult_requested_at', 'is', null)
      .order('consult_requested_at', { ascending: true });

    if (error) {
      console.error('상담신청 백필 세션 조회 오류:', error);
      return NextResponse.json({ error: '세션 조회 실패' }, { status: 500 });
    }

    const customerIds = Array.from(new Set((sessions || []).map((session) => session.customer_id).filter(Boolean)));
    const customersById = new Map<string, any>();

    if (customerIds.length > 0) {
      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select('id, phone, address, extra_request, consult_memo')
        .in('id', customerIds);

      if (customerError) {
        console.error('상담신청 백필 고객 조회 오류:', customerError);
        return NextResponse.json({ error: '고객 조회 실패' }, { status: 500 });
      }

      for (const customer of customers || []) customersById.set(customer.id, customer);
    }

    const rows: Array<Array<string | number>> = [];
    let skipped = 0;

    for (const session of sessions || []) {
      const customer = customersById.get(session.customer_id);
      let payload: any = null;
      try {
        const rawPayload = decrypt(session.payload_encrypted);
        payload = rawPayload ? JSON.parse(rawPayload) : null;
      } catch (payloadError) {
        console.warn('상담신청 백필 payload 복원 실패:', session.id, payloadError);
      }

      const summary = customer?.extra_request || '';
      const estimateMode = payload?.estimateMode === 'pest_only' || summary.includes('방충솔루션 단독') ? 'pest_only' : 'window_seal';
      const selectedPlan = estimateMode === 'pest_only'
        ? '방충솔루션 단독'
        : pickSummaryValue(summary, '시공 방식');
      const protectionOption = estimateMode === 'pest_only'
        ? '해당 없음'
        : pickSummaryValue(summary, '보양');
      const includeRailMohair = estimateMode === 'pest_only'
        ? '해당 없음'
        : pickSummaryValue(summary, '창틀 모헤어');
      const pestSolution = estimateMode === 'pest_only'
        ? pickSummaryValue(summary, '방충망 수량') || `방충망 ${payload?.pestScreenCount || ''}개`
        : pickSummaryValue(summary, '방충솔루션');
      const selectedEstimate = pickSummaryValue(summary, '선택 견적');
      const memo = customer?.consult_memo || pickSummaryValue(summary, '메모');
      const address = safeDecrypt(customer?.address) || `${payload?.selectedAddress || ''} ${payload?.detailAddress || ''}`.trim();
      const phone = safeDecrypt(customer?.phone) || payload?.phone || '';
      const refCode = payload?.referralCode || payload?.dealerCode || 'zapgoself';

      if (!session.id) {
        skipped += 1;
        continue;
      }

      rows.push([
        '상담접수',
        '',
        memo || '',
        '',
        '',
        session.consult_requested_at ? formatKoreanDateTime(session.consult_requested_at) : '',
        phone,
        address,
        translateIssues(payload?.issues || []),
        estimateMode === 'pest_only' ? '방충솔루션 단독' : '창문틈/모헤어 견적',
        selectedPlan,
        protectionOption,
        includeRailMohair,
        pestSolution,
        selectedEstimate,
        payload?.pyeong ? `${payload.pyeong}` : '',
        payload?.sash ? `${payload.sash}` : '',
        estimateMode === 'pest_only' ? `${payload?.pestScreenCount || pickSummaryValue(summary, '방충망 수량').replace(/[^0-9]/g, '')}` : '',
        refCode,
        payload?.adCode || '',
        formatKoreanDateTime(session.created_at),
        formatKoreanDateTime(),
        session.id,
      ]);
    }

    await appendConsultRows(rows);

    return NextResponse.json({ success: true, since, scanned: sessions?.length || 0, attempted: rows.length, skipped });
  } catch (error) {
    console.error('상담신청 백필 오류:', error);
    return NextResponse.json({ error: '상담신청 백필 실패' }, { status: 500 });
  }
}
