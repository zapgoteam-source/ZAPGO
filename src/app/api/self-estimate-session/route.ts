import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { decrypt, encrypt } from '@/lib/encryption';
import { calculateSelfEstimateTotals } from '@/lib/selfEstimate';

const SESSION_TTL_DAYS = 7;

type SelfEstimatePayload = {
  issues: string[];
  pyeong: number;
  sash: number;
  phone: string;
  selectedAddress: string;
  baseQuotes?: { fabric: number; mohair: number; side: number };
};

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

function makeToken() {
  return crypto.randomBytes(24).toString('base64url');
}

function isValidPayload(value: unknown): value is SelfEstimatePayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Record<string, unknown>;

  return (
    Array.isArray(payload.issues) &&
    payload.issues.every((issue) => typeof issue === 'string') &&
    typeof payload.pyeong === 'number' &&
    Number.isFinite(payload.pyeong) &&
    typeof payload.sash === 'number' &&
    Number.isFinite(payload.sash) &&
    typeof payload.phone === 'string' &&
    typeof payload.selectedAddress === 'string' &&
    (payload.baseQuotes === undefined ||
      (typeof payload.baseQuotes === 'object' && payload.baseQuotes !== null))
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!isValidPayload(body)) {
      return NextResponse.json({ error: '세션 데이터 형식이 올바르지 않습니다.' }, { status: 400 });
    }

    const token = makeToken();
    const baseQuotes =
      body.baseQuotes || calculateSelfEstimateTotals({ pyeong: body.pyeong, sash: body.sash });
    const sessionPayload = { ...body, baseQuotes };
    const payloadEncrypted = encrypt(JSON.stringify(sessionPayload));
    if (!payloadEncrypted) {
      return NextResponse.json({ error: '세션 저장에 실패했습니다.' }, { status: 500 });
    }

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const followupDueAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const supabase = getAdminClient();
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        name: encrypt('미입력'),
        phone: encrypt(body.phone),
        address: encrypt(body.selectedAddress),
        status: 'NEW',
        problem_summary: body.issues.join(', '),
        extra_request: '맞춤 견적 링크 요청',
        consult_memo: null,
        ref_code: 'zapgoself',
        referral_code: 'zapgoself',
        agency_id: null,
      })
      .select('id')
      .single();

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

    const supabase = getAdminClient();
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
