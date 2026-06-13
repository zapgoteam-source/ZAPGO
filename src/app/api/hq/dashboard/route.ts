import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/server/supabaseAdmin';
import { buildHqDashboard } from '@/lib/server/dashboardMetrics';
import { getApiUserProfile, isHqRole } from '@/lib/server/apiAuth';

function getDefaultPeriod() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

export async function GET(request: NextRequest) {
  try {
    const profile = await getApiUserProfile(request);
    if (!isHqRole(profile?.role)) {
      return NextResponse.json({ error: '본사 권한이 필요합니다.' }, { status: 403 });
    }

    const supabase = getSupabaseAdminClient();
    const defaults = getDefaultPeriod();
    const from = request.nextUrl.searchParams.get('from') || defaults.from;
    const to = request.nextUrl.searchParams.get('to') || defaults.to;

    const [customersRes, agenciesRes, referrersRes] = await Promise.all([
      supabase
        .from('customers')
        .select('*')
        .gte('created_at', from)
        .lt('created_at', to)
        .order('created_at', { ascending: false }),
      supabase
        .from('agencies')
        .select('*')
        .order('created_at', { ascending: true }),
      supabase
        .from('referrers')
        .select('*')
        .order('created_at', { ascending: true }),
    ]);

    if (customersRes.error) {
      console.error('본사 대시보드 고객 조회 오류:', customersRes.error);
      return NextResponse.json({ error: '고객 데이터를 조회할 수 없습니다.' }, { status: 500 });
    }

    if (agenciesRes.error) {
      console.error('본사 대시보드 대리점 조회 오류:', agenciesRes.error);
      return NextResponse.json({ error: '대리점 데이터를 조회할 수 없습니다.' }, { status: 500 });
    }

    const referrers = referrersRes.error ? [] : (referrersRes.data || []);
    const dashboard = buildHqDashboard(customersRes.data || [], agenciesRes.data || [], referrers);

    return NextResponse.json({
      period: { from, to },
      ...dashboard,
      warnings: referrersRes.error
        ? ['referrers 테이블을 찾지 못해 기존 유입 코드 기준으로 일부 정보를 표시합니다.']
        : [],
    });
  } catch (error) {
    console.error('본사 대시보드 API 오류:', error);
    return NextResponse.json({ error: '본사 대시보드를 불러오지 못했습니다.' }, { status: 500 });
  }
}
