import { decrypt } from '@/lib/encryption';
import { normalizeCustomerStatus, type StandardCustomerStatus } from '@/lib/customerStatus';

type CustomerLike = {
  id: string;
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: string | null;
  standard_status?: string | null;
  agency_id?: string | null;
  referrer_id?: string | null;
  referral_code?: string | null;
  ref_code?: string | null;
  source_code?: string | null;
  final_construction_amount?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  scheduled_date?: string | null;
  last_contacted_at?: string | null;
  payment_received_date?: string | null;
  settlement_status?: string | null;
  incentive_status?: string | null;
};

type AgencyLike = {
  id: string;
  name: string;
  code?: string | null;
  referral_code?: string | null;
  status?: string | null;
  owner_name?: string | null;
  owner_email?: string | null;
  owner_phone?: string | null;
  royalty_rate?: number | null;
};

type ReferrerLike = {
  id: string;
  agency_id?: string | null;
  name: string;
  code: string;
  type?: string | null;
  status?: string | null;
};

type AgencyDashboardRow = {
  id: string;
  name: string;
  code: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  royaltyRate: number;
  leads: number;
  consults: number;
  scheduled: number;
  completed: number;
  revenue: number;
  pending: number;
  conversionRate: number;
  consultRate: number;
  lastLeadAt: string | null;
  status: 'NORMAL' | 'ATTENTION' | 'INACTIVE';
};

type HqDashboard = {
  summary: {
    leads: number;
    consultPending: number;
    scheduled: number;
    completed: number;
    revenue: number;
    unanswered: number;
  };
  agencies: AgencyDashboardRow[];
  recentCustomers: Array<{
    id: string;
    name: string;
    maskedName: string;
    phone: string;
    maskedPhone: string;
    agencyName: string;
    agencyCode: string;
    referrerCode: string;
    status: StandardCustomerStatus;
    amount: number;
    createdAt?: string | null;
  }>;
  alerts: Array<{
    type: string;
    severity: string;
    title: string;
    body: string;
  }>;
};

export function safeDecrypt(value?: string | null) {
  if (!value) return '';
  return decrypt(value) || value;
}

export function maskName(name?: string | null) {
  const value = safeDecrypt(name);
  if (!value) return '고객';
  if (value.length <= 1) return `${value}*`;
  return `${value[0]}*${value.slice(2)}`;
}

export function maskPhone(phone?: string | null) {
  const value = safeDecrypt(phone);
  const digits = value.replace(/\D/g, '');
  if (digits.length < 8) return '';
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
}

export function getOperationalStatus(customer: CustomerLike): StandardCustomerStatus {
  return normalizeCustomerStatus(customer.standard_status || customer.status);
}

export function isConsultCountStatus(status: StandardCustomerStatus) {
  return ['CONSULT_PENDING', 'CONSULTING', 'QUOTE_SENT', 'SCHEDULED', 'COMPLETED', 'SETTLEMENT_PENDING', 'SETTLED'].includes(status);
}

export function isScheduledStatus(status: StandardCustomerStatus) {
  return status === 'SCHEDULED';
}

export function isCompletedStatus(status: StandardCustomerStatus) {
  return ['COMPLETED', 'SETTLEMENT_PENDING', 'SETTLED'].includes(status);
}

export function isRevenueStatus(status: StandardCustomerStatus) {
  return ['SCHEDULED', 'COMPLETED', 'SETTLEMENT_PENDING', 'SETTLED'].includes(status);
}

export function isUnanswered(customer: CustomerLike, now = Date.now()) {
  const status = getOperationalStatus(customer);
  if (!['NEW', 'CONSULT_PENDING'].includes(status)) return false;
  const base = customer.last_contacted_at || customer.created_at;
  if (!base) return false;
  return now - new Date(base).getTime() >= 24 * 60 * 60 * 1000;
}

export function getAgencyCode(agency: AgencyLike) {
  return agency.code || agency.referral_code || '';
}

export function buildHqDashboard(customers: CustomerLike[], agencies: AgencyLike[], referrers: ReferrerLike[] = []): HqDashboard {
  const now = Date.now();
  const agencyById = new Map(agencies.map((agency) => [agency.id, agency]));
  const referrerById = new Map(referrers.map((referrer) => [referrer.id, referrer]));

  const metricRows = customers.map((customer) => {
    const status = getOperationalStatus(customer);
    return { customer, status };
  });

  const summary = {
    leads: customers.length,
    consultPending: metricRows.filter(({ status }) => ['NEW', 'CONSULT_PENDING'].includes(status)).length,
    scheduled: metricRows.filter(({ status }) => isScheduledStatus(status)).length,
    completed: metricRows.filter(({ status }) => isCompletedStatus(status)).length,
    revenue: metricRows.reduce((sum, { customer, status }) => {
      if (!isRevenueStatus(status)) return sum;
      return sum + Number(customer.final_construction_amount || 0);
    }, 0),
    unanswered: customers.filter((customer) => isUnanswered(customer, now)).length,
  };

  const agencyRows = agencies.map((agency) => {
    const owned = metricRows.filter(({ customer }) => customer.agency_id === agency.id);
    const leads = owned.length;
    const consults = owned.filter(({ status }) => isConsultCountStatus(status)).length;
    const scheduled = owned.filter(({ status }) => isScheduledStatus(status)).length;
    const completed = owned.filter(({ status }) => isCompletedStatus(status)).length;
    const revenue = owned.reduce((sum, { customer, status }) => {
      if (!isRevenueStatus(status)) return sum;
      return sum + Number(customer.final_construction_amount || 0);
    }, 0);
    const pending = owned.filter(({ customer }) => isUnanswered(customer, now)).length;
    const lastLeadAt = owned
      .map(({ customer }) => customer.created_at)
      .filter(Boolean)
      .sort()
      .at(-1) || null;
    const daysSinceLead = lastLeadAt
      ? Math.floor((now - new Date(lastLeadAt).getTime()) / (24 * 60 * 60 * 1000))
      : null;
    const conversionRate = leads > 0 ? Math.round((completed / leads) * 100) : 0;
    const consultRate = leads > 0 ? Math.round((consults / leads) * 100) : 0;
    const status: AgencyDashboardRow['status'] =
      daysSinceLead === null || daysSinceLead >= 14
        ? 'INACTIVE'
        : pending >= 5 || (leads >= 10 && consultRate < 30)
          ? 'ATTENTION'
          : 'NORMAL';

    return {
      id: agency.id,
      name: agency.name,
      code: getAgencyCode(agency),
      ownerName: agency.owner_name || '',
      ownerEmail: agency.owner_email || '',
      ownerPhone: agency.owner_phone || '',
      royaltyRate: Number(agency.royalty_rate || 0),
      leads,
      consults,
      scheduled,
      completed,
      revenue,
      pending,
      conversionRate,
      consultRate,
      lastLeadAt,
      status,
    };
  });

  const recentCustomers = customers
    .slice()
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 20)
    .map((customer) => {
      const agency = customer.agency_id ? agencyById.get(customer.agency_id) : undefined;
      const referrer = customer.referrer_id ? referrerById.get(customer.referrer_id) : undefined;
      return {
        id: customer.id,
        name: safeDecrypt(customer.name) || '고객',
        maskedName: maskName(customer.name),
        phone: safeDecrypt(customer.phone),
        maskedPhone: maskPhone(customer.phone),
        agencyName: agency?.name || '본사/직접 유입',
        agencyCode: agency ? getAgencyCode(agency) : '',
        referrerCode: referrer?.code || customer.source_code || customer.referral_code || customer.ref_code || '',
        status: getOperationalStatus(customer),
        amount: Number(customer.final_construction_amount || 0),
        createdAt: customer.created_at,
      };
    });

  return {
    summary,
    agencies: agencyRows,
    recentCustomers,
    alerts: buildAlerts(agencyRows),
  };
}

function buildAlerts(agencyRows: AgencyDashboardRow[]): HqDashboard['alerts'] {
  return agencyRows
    .flatMap((agency) => {
      const rows = [];
      if (agency.pending >= 5) {
        rows.push({
          type: 'UNANSWERED',
          severity: 'ATTENTION',
          title: agency.name,
          body: `미응대 고객 ${agency.pending}명입니다.`,
        });
      }
      if (agency.status === 'INACTIVE') {
        rows.push({
          type: 'INACTIVE',
          severity: 'INACTIVE',
          title: agency.name,
          body: '최근 14일 이상 신규 유입이 없습니다.',
        });
      }
      if (agency.completed > 0 && agency.revenue > 0) {
        rows.push({
          type: 'SETTLEMENT',
          severity: 'SETTLEMENT',
          title: agency.name,
          body: `시공완료 ${agency.completed}건의 정산 확인이 필요합니다.`,
        });
      }
      return rows;
    })
    .slice(0, 10);
}
