import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { decrypt, encrypt } from '@/lib/encryption';
import { getSupabaseAdminClient } from '@/lib/server/supabaseAdmin';
import { appendConsultRows } from '@/lib/server/googleSheets';
import {
  calculatePestOnlyEstimate,
  calculateSelfEstimateTotals,
  formatKoreanDateTime,
  formatKRW,
  PLAN_LABELS,
  translateIssues,
  type PlanKey,
  type ProtectionKey,
} from '@/lib/selfEstimate';

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { token, selectedAddress: submittedAddress, detailAddress, memo, selectedPlan, protectionOption, includeRailMohair, pestSolution, pestScreenCount, dealerCode, referralCode } =
      await request.json();

    if (!token) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const now = new Date().toISOString();
    const { data: session, error: sessionError } = await supabase
      .from('self_estimate_sessions')
      .select('id, customer_id, payload_encrypted, created_at')
      .eq('token_hash', hashToken(token))
      .gt('expires_at', now)
      .maybeSingle();

    if (sessionError || !session?.customer_id) {
      return NextResponse.json({ error: '유효한 견적 세션을 찾지 못했습니다.' }, { status: 404 });
    }

    const rawPayload = decrypt(session.payload_encrypted);
    const payload = rawPayload ? JSON.parse(rawPayload) : null;
    const estimateMode = payload?.estimateMode === 'pest_only' ? 'pest_only' : 'window_seal';
    if (estimateMode === 'window_seal' && !selectedPlan) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
    }

    const attributionCode =
      String(referralCode || payload?.referralCode || dealerCode || payload?.dealerCode || 'zapgoself').trim() ||
      'zapgoself';
    const selectedAddress = String(submittedAddress || payload?.selectedAddress || '').trim();
    if (!selectedAddress) {
      return NextResponse.json({ error: '주소가 필요합니다.' }, { status: 400 });
    }
    const fullAddress = `${selectedAddress} ${detailAddress || ''}`.trim();
    const plan = selectedPlan as PlanKey;
    const protection = (protectionOption || 'none') as ProtectionKey;
    const pestOnlyEstimate = calculatePestOnlyEstimate(Number(pestScreenCount || payload?.pestScreenCount) || 1);
    const totals = calculateSelfEstimateTotals({
      pyeong: Number(payload?.pyeong) || 0,
      sash: Number(payload?.sash) || 0,
      protectionOption: protection,
      includeRailMohair: Boolean(includeRailMohair),
      pestSolution: Boolean(pestSolution),
      pestScreenCount: Number(pestScreenCount) || 1,
    });

    const summary = estimateMode === 'pest_only'
      ? [
          `견적 유형: 방충솔루션 단독`,
          `방충망 수량: ${pestOnlyEstimate.screenCount}개`,
          `선택 견적: ${formatKRW(pestOnlyEstimate.total)}`,
          memo ? `메모: ${memo}` : null,
        ]
          .filter(Boolean)
          .join(' / ')
      : [
          `시공 방식: ${PLAN_LABELS[plan] || selectedPlan}`,
          `보양: 기본 보양 포함`,
          `창틀 모헤어: ${includeRailMohair ? '교체' : '미교체'}`,
          `방충솔루션: ${pestSolution ? `추가(${pestScreenCount}개)` : '미추가'}`,
          `선택 견적: ${formatKRW(totals[plan])}`,
          memo ? `메모: ${memo}` : null,
        ]
          .filter(Boolean)
          .join(' / ');

    const updatePayload = {
      address: encrypt(fullAddress),
      extra_request: summary,
      consult_memo: memo || null,
      status: 'CONSULT_PENDING',
      standard_status: 'CONSULT_PENDING',
      last_contacted_at: now,
    };

    let updateResult = await supabase
      .from('customers')
      .update(updatePayload)
      .eq('id', session.customer_id);

    if (updateResult.error && ['42703', 'PGRST204'].includes(updateResult.error.code || '')) {
      const { standard_status, last_contacted_at, ...legacyPayload } = updatePayload;
      updateResult = await supabase
        .from('customers')
        .update(legacyPayload)
        .eq('id', session.customer_id);
    }

    const updateError = updateResult.error;

    if (updateError) {
      console.error('상담 신청 고객 업데이트 오류:', updateError);
      return NextResponse.json({ error: '상담 신청 저장에 실패했습니다.' }, { status: 500 });
    }

    await supabase
      .from('self_estimate_sessions')
      .update({ consult_requested_at: now })
      .eq('token_hash', hashToken(token));

    await supabase.from('customer_status_events').insert({
      customer_id: session.customer_id,
      from_status: 'NEW',
      to_status: 'CONSULT_PENDING',
      changed_by_role: 'CUSTOMER',
      memo: '셀프견적 상담 신청',
    });

    const notifyResponse = await fetch(`${request.nextUrl.origin}/api/send-email/visit-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'consult',
        buttonClickedAt: session.created_at,
        submittedAt: now,
        phone: payload?.phone || '',
        address: fullAddress,
        estimateMode,
        issues: payload?.issues || [],
        pyeong: payload?.pyeong,
        sash: payload?.sash,
        pestScreenCount: estimateMode === 'pest_only' ? pestOnlyEstimate.screenCount : pestScreenCount,
        pestVisitFee: estimateMode === 'pest_only' ? formatKRW(pestOnlyEstimate.visitFee) : undefined,
        pestUnitPrice: estimateMode === 'pest_only' ? formatKRW(pestOnlyEstimate.unitPrice) : undefined,
        selectedPlan: estimateMode === 'pest_only' ? '방충솔루션 단독' : PLAN_LABELS[plan] || selectedPlan,
        protectionOption: estimateMode === 'pest_only' ? '해당 없음' : '기본 보양 포함',
        includeRailMohair: estimateMode === 'pest_only' ? '해당 없음' : includeRailMohair ? '교체' : '미교체',
        pestSolution: estimateMode === 'pest_only' ? `방충망 ${pestOnlyEstimate.screenCount}개` : pestSolution ? `추가(${pestScreenCount}개)` : '미추가',
        selectedEstimate: estimateMode === 'pest_only' ? formatKRW(pestOnlyEstimate.total) : formatKRW(totals[plan]),
        notes: memo || '',
        refCode: attributionCode,
        receivedAtLabel: formatKoreanDateTime(now),
      }),
    });

    if (!notifyResponse.ok) {
      console.error('상담 알림 발송 실패');
    }

    try {
      await appendConsultRows([
        [
          '상담접수',
          '',
          memo || '',
          '',
          '',
          formatKoreanDateTime(now),
          payload?.phone || '',
          fullAddress,
          translateIssues(payload?.issues || []),
          estimateMode === 'pest_only' ? '방충솔루션 단독' : '창문틈/모헤어 견적',
          estimateMode === 'pest_only' ? '방충솔루션 단독' : PLAN_LABELS[plan] || selectedPlan,
          estimateMode === 'pest_only' ? '해당 없음' : '기본 보양 포함',
          estimateMode === 'pest_only' ? '해당 없음' : includeRailMohair ? '교체' : '미교체',
          estimateMode === 'pest_only' ? `방충망 ${pestOnlyEstimate.screenCount}개` : pestSolution ? `추가(${pestScreenCount}개)` : '미추가',
          estimateMode === 'pest_only' ? formatKRW(pestOnlyEstimate.total) : formatKRW(totals[plan]),
          payload?.pyeong ? `${payload.pyeong}` : '',
          payload?.sash ? `${payload.sash}` : '',
          estimateMode === 'pest_only' ? `${pestOnlyEstimate.screenCount}` : pestScreenCount ? `${pestScreenCount}` : '',
          attributionCode,
          payload?.adCode || '',
          formatKoreanDateTime(session.created_at),
          formatKoreanDateTime(),
          session.id,
        ],
      ]);
    } catch (sheetError) {
      console.error('상담신청 구글시트 기록 실패:', sheetError);
    }

    return NextResponse.json({ success: true, customerId: session.customer_id });
  } catch (error) {
    console.error('셀프견적 상담 신청 오류:', error);
    return NextResponse.json({ error: '상담 신청에 실패했습니다.' }, { status: 500 });
  }
}
