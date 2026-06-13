import { NextRequest, NextResponse } from 'next/server';
import { getApiUserProfile, isHqRole } from '@/lib/server/apiAuth';
import { getSupabaseAdminClient } from '@/lib/server/supabaseAdmin';
import { getAgencyCode, getOperationalStatus, isCompletedStatus } from '@/lib/server/dashboardMetrics';

function getPeriodMonth(value?: string | null) {
  const now = new Date();
  const raw = value || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `${raw.slice(0, 7)}-01`;
}

export async function GET(request: NextRequest) {
  try {
    const profile = await getApiUserProfile(request);
    if (!isHqRole(profile?.role)) {
      return NextResponse.json({ error: '본사 권한이 필요합니다.' }, { status: 403 });
    }

    const periodMonth = getPeriodMonth(request.nextUrl.searchParams.get('month'));
    const from = new Date(periodMonth);
    const to = new Date(from.getFullYear(), from.getMonth() + 1, 1);
    const supabase = getSupabaseAdminClient();

    const [agenciesRes, customersRes, incentivesRes, settlementsRes] = await Promise.all([
      supabase.from('agencies').select('*').order('created_at', { ascending: true }),
      supabase
        .from('customers')
        .select('*')
        .gte('created_at', from.toISOString())
        .lt('created_at', to.toISOString()),
      supabase
        .from('incentives')
        .select('*')
        .gte('created_at', from.toISOString())
        .lt('created_at', to.toISOString()),
      supabase
        .from('settlements')
        .select('*')
        .eq('period_month', periodMonth),
    ]);

    if (agenciesRes.error || customersRes.error) {
      console.error('정산 데이터 조회 오류:', agenciesRes.error || customersRes.error);
      return NextResponse.json({ error: '정산 데이터를 조회할 수 없습니다.' }, { status: 500 });
    }

    const incentives = incentivesRes.error ? [] : incentivesRes.data || [];
    const settlements = settlementsRes.error ? [] : settlementsRes.data || [];
    const settlementsByAgencyId = new Map(settlements.map((row) => [row.agency_id, row]));

    const rows = (agenciesRes.data || []).map((agency) => {
      const agencyCustomers = (customersRes.data || []).filter((customer) => customer.agency_id === agency.id);
      const completedCustomers = agencyCustomers.filter((customer) => isCompletedStatus(getOperationalStatus(customer)));
      const grossAmount = completedCustomers.reduce(
        (sum, customer) => sum + Number(customer.final_construction_amount || 0),
        0,
      );
      const incentiveAmount = incentives
        .filter((incentive) => incentive.agency_id === agency.id && ['PAYABLE', 'PAID'].includes(incentive.status))
        .reduce((sum, incentive) => sum + Number(incentive.incentive_amount || 0), 0);
      const royaltyRate = Number(agency.royalty_rate || 0);
      const royaltyAmount = Math.round(grossAmount * (royaltyRate / 100));
      const existing = settlementsByAgencyId.get(agency.id);

      return {
        agencyId: agency.id,
        agencyName: agency.name,
        agencyCode: getAgencyCode(agency),
        periodMonth,
        completedCount: completedCustomers.length,
        grossAmount,
        royaltyRate,
        royaltyAmount: existing?.royalty_amount ?? royaltyAmount,
        laborCostAmount: Number(existing?.labor_cost_amount || 0),
        incentiveAmount: existing?.incentive_amount ?? incentiveAmount,
        netAmount: grossAmount - (existing?.royalty_amount ?? royaltyAmount) - Number(existing?.labor_cost_amount || 0) - (existing?.incentive_amount ?? incentiveAmount),
        status: existing?.status || 'DRAFT',
        settlementId: existing?.id || null,
        memo: existing?.memo || '',
      };
    });

    return NextResponse.json({
      periodMonth,
      rows,
      summary: {
        grossAmount: rows.reduce((sum, row) => sum + row.grossAmount, 0),
        royaltyAmount: rows.reduce((sum, row) => sum + row.royaltyAmount, 0),
        incentiveAmount: rows.reduce((sum, row) => sum + row.incentiveAmount, 0),
        netAmount: rows.reduce((sum, row) => sum + row.netAmount, 0),
      },
      warnings: [
        ...(incentivesRes.error ? ['incentives 테이블 조회 실패로 인센티브 금액이 0으로 표시될 수 있습니다.'] : []),
        ...(settlementsRes.error ? ['settlements 테이블 조회 실패로 저장된 정산 상태가 표시되지 않습니다.'] : []),
      ],
    });
  } catch (error) {
    console.error('정산 API 오류:', error);
    return NextResponse.json({ error: '정산 데이터를 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const profile = await getApiUserProfile(request);
    if (!isHqRole(profile?.role)) {
      return NextResponse.json({ error: '본사 권한이 필요합니다.' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.agencyId || !body.periodMonth) {
      return NextResponse.json({ error: 'agencyId와 periodMonth가 필요합니다.' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const payload = {
      agency_id: body.agencyId,
      period_month: getPeriodMonth(body.periodMonth),
      gross_amount: Number(body.grossAmount || 0),
      royalty_rate: Number(body.royaltyRate || 0),
      royalty_amount: Number(body.royaltyAmount || 0),
      labor_cost_amount: Number(body.laborCostAmount || 0),
      incentive_amount: Number(body.incentiveAmount || 0),
      status: body.status || 'DRAFT',
      memo: body.memo || null,
      confirmed_at: body.status === 'CONFIRMED' ? new Date().toISOString() : null,
      paid_at: body.status === 'PAID' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('settlements')
      .upsert(payload, { onConflict: 'agency_id,period_month' })
      .select('*')
      .single();

    if (error) {
      console.error('정산 저장 오류:', error);
      return NextResponse.json({ error: '정산 상태를 저장하지 못했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('정산 저장 API 오류:', error);
    return NextResponse.json({ error: '정산 상태 저장에 실패했습니다.' }, { status: 500 });
  }
}
