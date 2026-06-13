import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { decrypt, encrypt } from '@/lib/encryption';
import { calculatePestOnlyEstimate, calculateSelfEstimateTotals, type EstimateMode } from '@/lib/selfEstimate';
import { getSupabaseAdminClient } from '@/lib/server/supabaseAdmin';

const SESSION_TTL_DAYS = 7;

type SelfEstimatePayload = {
  estimateMode?: EstimateMode;
  issues: string[];
  pyeong?: number | null;
  sash?: number | null;
  pestScreenCount?: number | null;
  phone: string;
  selectedAddress: string;
  detailAddress?: string;
  baseQuotes?: { fabric: number; mohair: number; side: number };
  pestBaseQuote?: {
    screenCount: number;
    visitFee: number;
    unitPrice: number;
    solutionCost: number;
    total: number;
  };
  dealerCode?: string;
  referralCode?: string;
  adCode?: string;
};

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function makeToken() {
  return crypto.randomBytes(24).toString('base64url');
}

function isValidPayload(value: unknown): value is SelfEstimatePayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Record<string, unknown>;

  const estimateMode = payload.estimateMode === 'pest_only' ? 'pest_only' : 'window_seal';
  const hasCommonFields =
    Array.isArray(payload.issues) &&
    payload.issues.every((issue) => typeof issue === 'string') &&
    typeof payload.phone === 'string' &&
    typeof payload.selectedAddress === 'string' &&
    (payload.detailAddress === undefined || typeof payload.detailAddress === 'string') &&
    (payload.dealerCode === undefined || typeof payload.dealerCode === 'string') &&
    (payload.referralCode === undefined || typeof payload.referralCode === 'string') &&
    (payload.adCode === undefined || typeof payload.adCode === 'string') &&
    (payload.baseQuotes === undefined ||
      (typeof payload.baseQuotes === 'object' && payload.baseQuotes !== null)) &&
    (payload.pestBaseQuote === undefined ||
      (typeof payload.pestBaseQuote === 'object' && payload.pestBaseQuote !== null));

  if (!hasCommonFields) return false;

  const issues = payload.issues as string[];

  if (estimateMode === 'pest_only') {
    return (
      issues.length === 1 &&
      issues[0] === 'bug' &&
      typeof payload.pestScreenCount === 'number' &&
      Number.isFinite(payload.pestScreenCount) &&
      payload.pestScreenCount > 0
    );
  }

  return (
    typeof payload.pyeong === 'number' &&
    Number.isFinite(payload.pyeong) &&
    payload.pyeong > 0 &&
    typeof payload.sash === 'number' &&
    Number.isFinite(payload.sash) &&
    payload.sash > 0
  );
}

function normalizeCode(value?: string) {
  const code = value?.trim();
  return code || null;
}

async function resolveAttribution(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  dealerCode: string | null,
  referralCode: string | null,
) {
  let agencyId: string | null = null;
  let referrerId: string | null = null;
  let agencyLookupError = false;
  let referrerLookupError = false;

  if (dealerCode) {
    const { data, error } = await supabase
      .from('agencies')
      .select('id')
      .or(`code.eq.${dealerCode},referral_code.eq.${dealerCode}`)
      .eq('status', 'ACTIVE')
      .maybeSingle();
    agencyLookupError = Boolean(error);
    agencyId = data?.id ?? null;
  }

  const effectiveReferralCode = referralCode || dealerCode;
  if (effectiveReferralCode) {
    const { data, error } = await supabase
      .from('referrers')
      .select('id, agency_id')
      .eq('code', effectiveReferralCode)
      .eq('status', 'ACTIVE')
      .maybeSingle();
    referrerLookupError = Boolean(error);
    referrerId = data?.id ?? null;
    agencyId = agencyId || data?.agency_id || null;
  }

  if (!agencyId && (dealerCode || referralCode)) {
    const lookupCode = dealerCode || referralCode;
    const { data } = await supabase
      .from('agencies')
      .select('id')
      .eq('referral_code', lookupCode)
      .eq('status', 'ACTIVE')
      .maybeSingle();
    agencyId = data?.id ?? null;
  }

  return { agencyId, referrerId, referrerLookupError, agencyLookupError };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!isValidPayload(body)) {
      return NextResponse.json({ error: '세션 데이터 형식이 올바르지 않습니다.' }, { status: 400 });
    }

    const token = makeToken();
    const estimateMode: EstimateMode = body.estimateMode === 'pest_only' ? 'pest_only' : 'window_seal';
    const baseQuotes =
      estimateMode === 'window_seal'
        ? body.baseQuotes || calculateSelfEstimateTotals({ pyeong: Number(body.pyeong) || 0, sash: Number(body.sash) || 0 })
        : undefined;
    const pestBaseQuote =
      estimateMode === 'pest_only'
        ? body.pestBaseQuote || calculatePestOnlyEstimate(Number(body.pestScreenCount) || 1)
        : undefined;
    const sessionPayload = { ...body, estimateMode, baseQuotes, pestBaseQuote };
    const payloadEncrypted = encrypt(JSON.stringify(sessionPayload));
    if (!payloadEncrypted) {
      return NextResponse.json({ error: '세션 저장에 실패했습니다.' }, { status: 500 });
    }

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const followupDueAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const supabase = getSupabaseAdminClient();
    const dealerCode = normalizeCode(body.dealerCode);
    const referralCode = normalizeCode(body.referralCode);
    const attributionCode = referralCode || dealerCode || 'zapgoself';
    const attribution = await resolveAttribution(supabase, dealerCode, referralCode);
    const sourcePath = request.headers.get('referer') || `/q/${dealerCode || ''}/${referralCode || ''}`;

    const customerInsert = {
        name: encrypt('미입력'),
        phone: encrypt(body.phone),
        address: encrypt(`${body.selectedAddress} ${body.detailAddress ?? ''}`.trim()),
        status: 'NEW',
        standard_status: 'NEW',
        problem_summary: body.issues.join(', '),
        extra_request: '맞춤 견적 링크 요청',
        consult_memo: null,
        ref_code: attributionCode,
        referral_code: attributionCode,
        agency_id: attribution.agencyId,
        referrer_id: attribution.referrerId,
        source_code: attributionCode,
        source_path: sourcePath,
        incentive_status: attribution.referrerId ? 'IN_PROGRESS' : 'NONE',
      };

    let customerResult = await supabase
      .from('customers')
      .insert(customerInsert)
      .select('id')
      .single();

    if (customerResult.error && ['42703', '42P01', 'PGRST204'].includes(customerResult.error.code || '')) {
      const { standard_status, referrer_id, source_code, source_path, incentive_status, ...legacyInsert } = customerInsert;
      customerResult = await supabase
        .from('customers')
        .insert(legacyInsert)
        .select('id')
        .single();
    }

    const { data: customer, error: customerError } = customerResult;

    if (customerError || !customer) {
      console.error('셀프견적 리드 저장 오류:', customerError);
      return NextResponse.json({ error: '리드 저장에 실패했습니다.' }, { status: 500 });
    }

    const { error } = await supabase.from('self_estimate_sessions').insert({
      token_hash: hashToken(token),
      customer_id: customer.id,
      payload_encrypted: payloadEncrypted,
      expires_at: expiresAt,
      followup_due_at: followupDueAt,
    });

    if (error) {
      console.error('셀프견적 세션 저장 오류:', error);
      await supabase.from('customers').delete().eq('id', customer.id);
      return NextResponse.json({ error: '세션 저장에 실패했습니다.' }, { status: 500 });
    }

    if (customer?.id && !attribution.referrerLookupError) {
      await supabase.from('referral_attributions').insert({
        customer_id: customer.id,
        agency_id: attribution.agencyId,
        referrer_id: attribution.referrerId,
        dealer_code: dealerCode,
        referral_code: referralCode || dealerCode,
        source_path: sourcePath,
        is_first_touch: true,
      });
    }

    return NextResponse.json({ token, expiresAt });
  } catch (error) {
    console.error('셀프견적 세션 생성 오류:', error);
    return NextResponse.json({ error: '세션 생성에 실패했습니다.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: '토큰이 필요합니다.' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('self_estimate_sessions')
      .select('payload_encrypted, expires_at')
      .eq('token_hash', hashToken(token))
      .gt('expires_at', now)
      .maybeSingle();

    if (error) {
      console.error('셀프견적 세션 조회 오류:', error);
      return NextResponse.json({ error: '세션 조회에 실패했습니다.' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: '만료되었거나 유효하지 않은 링크입니다.' }, { status: 404 });
    }

    const rawPayload = decrypt(data.payload_encrypted);
    const payload = rawPayload ? JSON.parse(rawPayload) : null;
    if (!isValidPayload(payload)) {
      return NextResponse.json({ error: '세션 데이터가 손상되었습니다.' }, { status: 500 });
    }

    await supabase
      .from('self_estimate_sessions')
      .update({ last_accessed_at: now })
      .eq('token_hash', hashToken(token));

    return NextResponse.json({ data: payload, expiresAt: data.expires_at });
  } catch (error) {
    console.error('셀프견적 세션 복원 오류:', error);
    return NextResponse.json({ error: '세션 복원에 실패했습니다.' }, { status: 500 });
  }
}
