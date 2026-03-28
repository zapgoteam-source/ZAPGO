/**
 * TanStack Query 쿼리 함수 모음
 * queryKey 규칙: ['리소스', 필터객체]
 */

import { supabase } from '@/lib/supabase';
import { Customer, Estimate, EstimateAdjustment, EstimateRevision, EstimateSurvey, EstimateWindowService, Window } from '@/types';

const PAGE_SIZE = 20;

// ─── 견적 목록 ────────────────────────────────────────────────────────────────

export interface EstimateListParams {
  page: number;
  search: string;
  statusFilter: string;
  dateFrom: string;
}

export async function fetchEstimateList({ page, search, statusFilter, dateFrom }: EstimateListParams) {
  let query = supabase
    .from('estimates')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (search) {
    query = query.or(
      `customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,address.ilike.%${search}%,referral_code.ilike.%${search}%`
    );
  }
  if (statusFilter) query = query.eq('status', statusFilter);
  if (dateFrom) query = query.gte('created_at', dateFrom);

  const { data, count, error } = await query;
  if (error) throw error;
  return { data: (data as Estimate[]) ?? [], total: count ?? 0 };
}

// ─── 견적 상세 ────────────────────────────────────────────────────────────────

export async function fetchEstimateDetail(id: string) {
  const [estRes, adjRes, revRes, surveyRes, winsRes] = await Promise.all([
    supabase.from('estimates').select('*').eq('id', id).single(),
    supabase.from('estimate_adjustments').select('*').eq('estimate_id', id).order('created_at', { ascending: false }),
    supabase.from('estimate_revisions').select('*').eq('estimate_id', id).order('created_at', { ascending: false }).limit(10),
    supabase.from('estimate_surveys').select('*').eq('estimate_id', id).maybeSingle(),
    supabase.from('windows').select('*').eq('estimate_id', id).order('created_at', { ascending: true }),
  ]);

  if (estRes.error) throw estRes.error;

  const wins = (winsRes.data as Window[]) ?? [];
  let windowsWithServices: (Window & { services: EstimateWindowService[] })[] = [];

  if (wins.length > 0) {
    const { data: svcs } = await supabase
      .from('estimate_window_services')
      .select('*')
      .in('window_id', wins.map((w) => w.id));
    const svcMap = new Map<string, EstimateWindowService[]>();
    (svcs ?? []).forEach((s: EstimateWindowService) => {
      const arr = svcMap.get(s.window_id!) ?? [];
      arr.push(s);
      svcMap.set(s.window_id!, arr);
    });
    windowsWithServices = wins.map((w) => ({ ...w, services: svcMap.get(w.id) ?? [] }));
  }

  return {
    estimate: estRes.data as Estimate,
    adjustments: (adjRes.data as EstimateAdjustment[]) ?? [],
    revisions: (revRes.data as EstimateRevision[]) ?? [],
    survey: surveyRes.data as EstimateSurvey | null,
    windows: windowsWithServices,
  };
}

// ─── 고객 목록 ────────────────────────────────────────────────────────────────

export interface CustomerListParams {
  page: number;
  search: string;
  dateFrom: string;
}

export async function fetchCustomerList({ page, search, dateFrom }: CustomerListParams) {
  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  if (dateFrom) query = query.gte('created_at', dateFrom);

  const { data, count, error } = await query;
  if (error) throw error;
  return { data: (data as Customer[]) ?? [], total: count ?? 0 };
}

// ─── 대시보드용 전체 견적 (최근 50건) ─────────────────────────────────────────

export interface DashboardParams {
  statusFilter: string;
  referralFilter: string;
}

export async function fetchDashboardEstimates() {
  const { data, error } = await supabase
    .from('estimates')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data as Estimate[]) ?? [];
}

export const PAGE_SIZE_EXPORT = PAGE_SIZE;
