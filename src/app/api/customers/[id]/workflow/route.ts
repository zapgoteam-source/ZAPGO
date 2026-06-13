import { NextRequest, NextResponse } from 'next/server';
import { getApiUserProfile, isAgencyRole, isHqRole } from '@/lib/server/apiAuth';
import { getSupabaseAdminClient } from '@/lib/server/supabaseAdmin';
import { encrypt } from '@/lib/encryption';
import { normalizeCustomerStatus, type StandardCustomerStatus } from '@/lib/customerStatus';

const HQ_ONLY_STATUSES = new Set<StandardCustomerStatus>(['SETTLEMENT_PENDING', 'SETTLED']);

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: PageProps) {
  try {
    const profile = await getApiUserProfile(request);
    if (!profile || (!isHqRole(profile.role) && !isAgencyRole(profile.role))) {
      return NextResponse.json({ error: '고객 처리 권한이 필요합니다.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabaseAdminClient();

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (customerError) {
      console.error('고객 워크플로우 조회 오류:', customerError);
      return NextResponse.json({ error: '고객 정보를 조회할 수 없습니다.' }, { status: 500 });
    }
    if (!customer) {
      return NextResponse.json({ error: '고객을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (isAgencyRole(profile.role) && !isHqRole(profile.role) && customer.agency_id !== profile.agency_id) {
      return NextResponse.json({ error: '해당 대리점 고객만 수정할 수 있습니다.' }, { status: 403 });
    }

    const nextStatus = body.standard_status ? normalizeCustomerStatus(body.standard_status) : null;
    if (nextStatus && HQ_ONLY_STATUSES.has(nextStatus) && !isHqRole(profile.role)) {
      return NextResponse.json({ error: '정산 상태 변경은 본사만 할 수 있습니다.' }, { status: 403 });
    }

    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (nextStatus) {
      update.standard_status = nextStatus;
      update.status = nextStatus;
      if (['CONSULTING', 'QUOTE_SENT'].includes(nextStatus)) update.last_contacted_at = new Date().toISOString();
    }
    if (typeof body.address === 'string') update.address = encrypt(body.address);
    if (typeof body.consult_memo === 'string') update.consult_memo = body.consult_memo;
    if (typeof body.scheduled_date === 'string' || body.scheduled_date === null) update.scheduled_date = body.scheduled_date;
    if (typeof body.final_construction_amount === 'number') update.final_construction_amount = body.final_construction_amount;
    if (typeof body.deposit_amount === 'number') update.deposit_amount = body.deposit_amount;
    if (typeof body.deposit_received_date === 'string' || body.deposit_received_date === null) {
      update.deposit_received_date = body.deposit_received_date;
    }
    if (typeof body.payment_status === 'string') update.payment_status = body.payment_status;
    if (typeof body.payment_received_date === 'string' || body.payment_received_date === null) {
      update.payment_received_date = body.payment_received_date;
    }
    if (typeof body.payer_name === 'string') update.payer_name = body.payer_name;
    if (typeof body.team_leader_user_id === 'string' || body.team_leader_user_id === null) {
      update.team_leader_user_id = body.team_leader_user_id;
    }
    if (typeof body.team_member_names === 'string') update.team_member_names = body.team_member_names;
    if (typeof body.assigned_user_id === 'string' || body.assigned_user_id === null) update.assigned_user_id = body.assigned_user_id;

    let updateResult = await supabase
      .from('customers')
      .update(update)
      .eq('id', id)
      .select('*')
      .single();

    if (updateResult.error && ['42703', 'PGRST204'].includes(updateResult.error.code || '')) {
      const {
        standard_status,
        payment_status,
        assigned_user_id,
        last_contacted_at,
        team_leader_user_id,
        team_member_names,
        ...legacyUpdate
      } = update;
      updateResult = await supabase
        .from('customers')
        .update(legacyUpdate)
        .eq('id', id)
        .select('*')
        .single();
    }

    if (updateResult.error) {
      console.error('고객 워크플로우 업데이트 오류:', updateResult.error);
      return NextResponse.json({ error: '고객 처리 내용을 저장하지 못했습니다.' }, { status: 500 });
    }

    if (nextStatus) {
      await supabase.from('customer_status_events').insert({
        customer_id: id,
        from_status: normalizeCustomerStatus(customer.standard_status || customer.status),
        to_status: nextStatus,
        changed_by: profile.id,
        changed_by_role: profile.role,
        memo: body.status_memo || null,
      });

      if (nextStatus === 'COMPLETED' && customer.referrer_id) {
        const { data: existingIncentive, error: lookupError } = await supabase
          .from('incentives')
          .select('id')
          .eq('customer_id', id)
          .eq('referrer_id', customer.referrer_id)
          .maybeSingle();

        if (!lookupError && !existingIncentive) {
          await supabase.from('incentives').insert({
            customer_id: id,
            referrer_id: customer.referrer_id,
            agency_id: customer.agency_id,
            basis_amount: Number(body.final_construction_amount || customer.final_construction_amount || 0),
            incentive_amount: Number(customer.incentive_amount || 0),
            status: 'PAYABLE',
            memo: '시공완료 자동 지급대상 생성',
          });
        }
      }
    }

    return NextResponse.json({ data: updateResult.data });
  } catch (error) {
    console.error('고객 워크플로우 API 오류:', error);
    return NextResponse.json({ error: '고객 처리에 실패했습니다.' }, { status: 500 });
  }
}
