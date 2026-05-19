import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { decrypt, encrypt } from '@/lib/encryption';
import {
  calculateSelfEstimateTotals,
  formatKoreanDateTime,
  formatKRW,
  PLAN_LABELS,
  PROTECTION_LABELS,
  type PlanKey,
  type ProtectionKey,
} from '@/lib/selfEstimate';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase 서버 키가 설정되지 않았습니다.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { token, detailAddress, memo, selectedPlan, protectionOption, includeRailMohair, pestSolution, pestScreenCount } =
      await request.json();

    if (!token || !detailAddress || !selectedPlan || !protectionOption) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const now = new Date().toISOString();
    const { data: session, error: sessionError } = await supabase
      .from('self_estimate_sessions')
      .select('customer_id, payload_encrypted, created_at')
      .eq('token_hash', hashToken(token))
      .gt('expires_at', now)
      .maybeSingle();

    if (sessionError || !session?.customer_id) {
      return NextResponse.json({ error: '유효한 견적 세션을 찾지 못했습니다.' }, { status: 404 });
    }

    const rawPayload = decrypt(session.payload_encrypted);
    const payload = rawPayload ? JSON.parse(rawPayload) : null;
    const selectedAddress = payload?.selectedAddress || '';
    const fullAddress = `${selectedAddress} ${detailAddress}`.trim();
    const plan = selectedPlan as PlanKey;
    const protection = protectionOption as ProtectionKey;
    const totals = calculateSelfEstimateTotals({
      pyeong: Number(payload?.pyeong) || 0,
      sash: Number(payload?.sash) || 0,
      protectionOption: protection,
      includeRailMohair: Boolean(includeRailMohair),
      pestSolution: Boolean(pestSolution),
      pestScreenCount: Number(pestScreenCount) || 1,
    });

    const summary = [
      `시공 방식: ${PLAN_LABELS[plan] || selectedPlan}`,
      `보양: ${PROTECTION_LABELS[protection] || protectionOption}`,
      `창틀 모헤어: ${includeRailMohair ? '교체' : '미교체'}`,
      `방충솔루션: ${pestSolution ? `추가(${pestScreenCount}개)` : '미추가'}`,
      `선택 견적: ${formatKRW(totals[plan])}`,
      memo ? `메모: ${memo}` : null,
    ]
      .filter(Boolean)
      .join(' / ');

    const { error: updateError } = await supabase
      .from('customers')
      .update({
        address: encrypt(fullAddress),
        extra_request: summary,
        consult_memo: memo || null,
        status: 'NEW',
      })
      .eq('id', session.customer_id);

    if (updateError) {
      console.error('상담 신청 고객 업데이트 오류:', updateError);
      return NextResponse.json({ error: '상담 신청 저장에 실패했습니다.' }, { status: 500 });
    }

    await supabase
      .from('self_estimate_sessions')
      .update({ consult_requested_at: now })
      .eq('token_hash', hashToken(token));

    const notifyResponse = await fetch(`${request.nextUrl.origin}/api/send-email/visit-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'consult',
        buttonClickedAt: session.created_at,
        submittedAt: now,
        phone: payload?.phone || '',
        address: fullAddress,
        issues: payload?.issues || [],
        pyeong: payload?.pyeong,
        sash: payload?.sash,
        selectedPlan: PLAN_LABELS[plan] || selectedPlan,
        protectionOption: PROTECTION_LABELS[protection] || protectionOption,
        includeRailMohair: includeRailMohair ? '교체' : '미교체',
        pestSolution: pestSolution ? `추가(${pestScreenCount}개)` : '미추가',
        selectedEstimate: formatKRW(totals[plan]),
        notes: memo || '',
        refCode: 'zapgoself',
        receivedAtLabel: formatKoreanDateTime(now),
      }),
    });

    if (!notifyResponse.ok) {
      console.error('상담 알림 발송 실패');
    }

    return NextResponse.json({ success: true, customerId: session.customer_id });
  } catch (error) {
    console.error('셀프견적 상담 신청 오류:', error);
    return NextResponse.json({ error: '상담 신청에 실패했습니다.' }, { status: 500 });
  }
}
