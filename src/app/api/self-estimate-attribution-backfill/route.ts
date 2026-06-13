import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/encryption';
import { backfillAttributionCodes } from '@/lib/server/googleSheets';
import { getSupabaseAdminClient } from '@/lib/server/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${cronSecret}`;
}

function resolvePayloadCodes(payloadEncrypted?: string | null) {
  if (!payloadEncrypted) return { dealerCode: '', adCode: '' };
  try {
    const raw = decrypt(payloadEncrypted);
    const payload = raw ? JSON.parse(raw) : null;
    return {
      dealerCode: payload?.referralCode || payload?.dealerCode || '',
      adCode: payload?.adCode || '',
    };
  } catch {
    return { dealerCode: '', adCode: '' };
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data: sessions, error } = await supabase
      .from('self_estimate_sessions')
      .select('id, customer_id, payload_encrypted')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('유입코드 백필 세션 조회 오류:', error);
      return NextResponse.json({ error: '세션 조회 실패' }, { status: 500 });
    }

    const customerIds = Array.from(new Set((sessions || []).map((session) => session.customer_id).filter(Boolean)));
    const customerCodeById = new Map<string, string>();

    if (customerIds.length > 0) {
      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select('id, ref_code, referral_code')
        .in('id', customerIds);

      if (customerError) {
        console.error('유입코드 백필 고객 조회 오류:', customerError);
        return NextResponse.json({ error: '고객 조회 실패' }, { status: 500 });
      }

      for (const customer of customers || []) {
        customerCodeById.set(customer.id, customer.ref_code || customer.referral_code || '');
      }
    }

    const codeBySessionId: Record<string, string> = {};
    const adCodeBySessionId: Record<string, string> = {};
    for (const session of sessions || []) {
      const payloadCodes = resolvePayloadCodes(session.payload_encrypted);
      const dealerCode = customerCodeById.get(session.customer_id) || payloadCodes.dealerCode || 'zapgoself';
      codeBySessionId[session.id] = dealerCode;
      if (payloadCodes.adCode) adCodeBySessionId[session.id] = payloadCodes.adCode;
    }

    const result = await backfillAttributionCodes(codeBySessionId, adCodeBySessionId);

    return NextResponse.json({
      success: true,
      sessions: Object.keys(codeBySessionId).length,
      adCodeSessions: Object.keys(adCodeBySessionId).length,
      ...result,
    });
  } catch (error) {
    console.error('유입코드 백필 오류:', error);
    return NextResponse.json({ error: '유입코드 백필 실패' }, { status: 500 });
  }
}
