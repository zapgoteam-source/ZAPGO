import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/encryption';
import { calculateSelfEstimateTotals, formatKRW } from '@/lib/selfEstimate';

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

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getAdminClient();
    const now = new Date().toISOString();
    const { data: sessions, error } = await supabase
      .from('self_estimate_sessions')
      .select('id, created_at, payload_encrypted')
      .lte('followup_due_at', now)
      .is('followup_sent_at', null)
      .is('consult_requested_at', null)
      .limit(20);

    if (error) {
      console.error('24시간 미상담 세션 조회 오류:', error);
      return NextResponse.json({ error: '세션 조회 실패' }, { status: 500 });
    }

    let sent = 0;
    for (const session of sessions ?? []) {
      const rawPayload = decrypt(session.payload_encrypted);
      const payload = rawPayload ? JSON.parse(rawPayload) : null;
      if (!payload) continue;

      const baseQuotes = payload.baseQuotes || calculateSelfEstimateTotals({ pyeong: payload.pyeong, sash: payload.sash });
      const notifyResponse = await fetch(`${request.nextUrl.origin}/api/send-email/visit-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'followup',
          buttonClickedAt: session.created_at,
          phone: payload.phone || '',
          address: payload.selectedAddress || '',
          issues: payload.issues || [],
          pyeong: payload.pyeong,
          sash: payload.sash,
          fabricBaseEstimate: formatKRW(baseQuotes.fabric || 0),
          mohairBaseEstimate: formatKRW(baseQuotes.mohair || 0),
          sideBaseEstimate: formatKRW(baseQuotes.side || 0),
          refCode: 'zapgoself',
        }),
      });

      if (!notifyResponse.ok) {
        console.error('24시간 미상담 메일 발송 실패:', session.id);
        continue;
      }

      await supabase
        .from('self_estimate_sessions')
        .update({ followup_sent_at: now })
        .eq('id', session.id);
      sent += 1;
    }

    return NextResponse.json({ success: true, scanned: sessions?.length ?? 0, sent });
  } catch (error) {
    console.error('24시간 미상담 알림 오류:', error);
    return NextResponse.json({ error: '24시간 미상담 알림 실패' }, { status: 500 });
  }
}
