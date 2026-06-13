import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/server/supabaseAdmin';
import { getApiUserProfile, isAgencyRole, isHqRole } from '@/lib/server/apiAuth';
import {
  getAgencyCode,
  getOperationalStatus,
  isCompletedStatus,
  isRevenueStatus,
  isScheduledStatus,
  isUnanswered,
  safeDecrypt,
} from '@/lib/server/dashboardMetrics';

export async function GET(request: NextRequest) {
  try {
    const profile = await getApiUserProfile(request);
    if (!profile || (!isHqRole(profile.role) && !isAgencyRole(profile.role))) {
      return NextResponse.json({ error: '대리점 권한이 필요합니다.' }, { status: 403 });
    }

    const agencyId = request.nextUrl.searchParams.get('agency_id');
    const code = request.nextUrl.searchParams.get('code')?.trim();
    const effectiveAgencyId = isAgencyRole(profile.role) && !isHqRole(profile.role)
      ? profile.agency_id || agencyId
      : agencyId;

    if (!effectiveAgencyId && !code) {
      return NextResponse.json({ error: 'agency_id 또는 code가 필요합니다.' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    let agencyQuery = supabase.from('agencies').select('*').limit(1);
    if (effectiveAgencyId) agencyQuery = agencyQuery.eq('id', effectiveAgencyId);
    else if (code) agencyQuery = agencyQuery.or(`code.eq.${code},referral_code.eq.${code}`);

    let { data: agencies, error: agencyError } = await agencyQuery;
    if (agencyError && code) {
      const legacy = await supabase.from('agencies').select('*').eq('referral_code', code).limit(1);
      agencies = legacy.data;
      agencyError = legacy.error;
    }

    if (agencyError) {
      console.error('대리점 조회 오류:', agencyError);
      return NextResponse.json({ error: '대리점 정보를 조회할 수 없습니다.' }, { status: 500 });
    }

    const agency = agencies?.[0];
    if (!agency) {
      return NextResponse.json({ error: '대리점을 찾을 수 없습니다.' }, { status: 404 });
    }

    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .or(`agency_id.eq.${agency.id},referral_code.eq.${getAgencyCode(agency)}`)
      .order('created_at', { ascending: false });

    if (customerError) {
      console.error('대리점 고객 조회 오류:', customerError);
      return NextResponse.json({ error: '대리점 고객 데이터를 조회할 수 없습니다.' }, { status: 500 });
    }

    const rows = customers || [];
    const summary = {
      leads: rows.length,
      consultPending: rows.filter((customer) => ['NEW', 'CONSULT_PENDING'].includes(getOperationalStatus(customer))).length,
      scheduled: rows.filter((customer) => isScheduledStatus(getOperationalStatus(customer))).length,
      completed: rows.filter((customer) => isCompletedStatus(getOperationalStatus(customer))).length,
      revenue: rows.reduce((sum, customer) => {
        const status = getOperationalStatus(customer);
        if (!isRevenueStatus(status)) return sum;
        return sum + Number(customer.final_construction_amount || 0);
      }, 0),
      unanswered: rows.filter((customer) => isUnanswered(customer)).length,
    };

    return NextResponse.json({
      agency: {
        id: agency.id,
        name: agency.name,
        code: getAgencyCode(agency),
        ownerName: agency.owner_name || '',
        ownerEmail: agency.owner_email || '',
        ownerPhone: agency.owner_phone || '',
        referralUrl: `/q/${getAgencyCode(agency)}/${getAgencyCode(agency)}`,
      },
      summary,
      customers: rows.slice(0, 50).map((customer) => ({
        id: customer.id,
        name: safeDecrypt(customer.name),
        phone: safeDecrypt(customer.phone),
        address: safeDecrypt(customer.address),
        status: getOperationalStatus(customer),
        sourceCode: customer.source_code || customer.referral_code || customer.ref_code || '',
        finalConstructionAmount: Number(customer.final_construction_amount || 0),
        scheduledDate: customer.scheduled_date,
        lastContactedAt: customer.last_contacted_at,
        unanswered: isUnanswered(customer),
        createdAt: customer.created_at,
      })),
    });
  } catch (error) {
    console.error('대리점 대시보드 API 오류:', error);
    return NextResponse.json({ error: '대리점 대시보드를 불러오지 못했습니다.' }, { status: 500 });
  }
}
