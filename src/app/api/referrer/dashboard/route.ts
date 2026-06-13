import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/server/supabaseAdmin';
import { getOperationalStatus, maskName, maskPhone } from '@/lib/server/dashboardMetrics';

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code')?.trim();
    const secret = request.nextUrl.searchParams.get('secret')?.trim();
    const expectedSecret = process.env.REFERRER_PORTAL_PREVIEW_SECRET;
    if (!code) {
      return NextResponse.json({ error: '추천인 코드가 필요합니다.' }, { status: 400 });
    }

    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ error: '추천인 포털 접근 코드가 필요합니다.' }, { status: 403 });
    }

    const supabase = getSupabaseAdminClient();
    const { data: referrer, error: referrerError } = await supabase
      .from('referrers')
      .select('*')
      .eq('code', code)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (referrerError) {
      console.error('추천인 조회 오류:', referrerError);
      return NextResponse.json({ error: '추천인 정보를 조회할 수 없습니다.' }, { status: 500 });
    }

    if (!referrer) {
      return NextResponse.json({ error: '유효한 추천인 코드를 찾지 못했습니다.' }, { status: 404 });
    }

    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('referrer_id', referrer.id)
      .order('created_at', { ascending: false });

    if (customerError) {
      console.error('추천인 고객 조회 오류:', customerError);
      return NextResponse.json({ error: '추천인 고객 데이터를 조회할 수 없습니다.' }, { status: 500 });
    }

    const rows = customers || [];
    const completed = rows.filter((customer) =>
      ['COMPLETED', 'SETTLEMENT_PENDING', 'SETTLED'].includes(getOperationalStatus(customer))
    );
    const payable = rows.filter((customer) => ['PAYABLE', 'PAID'].includes(customer.incentive_status || ''));

    return NextResponse.json({
      referrer: {
        id: referrer.id,
        name: referrer.name,
        code: referrer.code,
        type: referrer.type,
      },
      summary: {
        leads: rows.length,
        inProgress: rows.length - completed.length,
        completed: completed.length,
        payableAmount: payable.reduce((sum, customer) => sum + Number(customer.incentive_amount || 0), 0),
      },
      customers: rows.map((customer) => ({
        id: customer.id,
        maskedName: maskName(customer.name),
        maskedPhone: maskPhone(customer.phone),
        status: getOperationalStatus(customer),
        createdAt: customer.created_at,
        completedAt: customer.standard_status === 'COMPLETED' ? customer.updated_at : null,
        incentiveStatus: customer.incentive_status || 'IN_PROGRESS',
        incentiveAmount: Number(customer.incentive_amount || 0),
      })),
    });
  } catch (error) {
    console.error('추천인 대시보드 API 오류:', error);
    return NextResponse.json({ error: '추천인 대시보드를 불러오지 못했습니다.' }, { status: 500 });
  }
}
