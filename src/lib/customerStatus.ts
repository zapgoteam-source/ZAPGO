export type StandardCustomerStatus =
  | 'NEW'
  | 'CONSULT_PENDING'
  | 'CONSULTING'
  | 'QUOTE_SENT'
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'SETTLEMENT_PENDING'
  | 'SETTLED'
  | 'AS_REQUESTED'
  | 'CLOSED';

export type PaymentStatus = 'UNPAID' | 'DEPOSIT_PAID' | 'PAID' | 'REFUNDED';
export type SettlementStatus = 'NONE' | 'PENDING' | 'CONFIRMED' | 'PAID' | 'HOLD';
export type IncentiveStatus = 'NONE' | 'IN_PROGRESS' | 'PAYABLE' | 'HOLD' | 'PAID' | 'CANCELED';
export type TaxInvoiceStatus = 'NOT_REQUIRED' | 'NEEDED' | 'REQUESTED' | 'ISSUED' | 'CANCELED';

export const CUSTOMER_STATUS_LABELS: Record<StandardCustomerStatus, string> = {
  NEW: '신규유입',
  CONSULT_PENDING: '상담대기',
  CONSULTING: '상담중',
  QUOTE_SENT: '견적제출',
  SCHEDULED: '시공예약',
  COMPLETED: '시공완료',
  SETTLEMENT_PENDING: '정산대기',
  SETTLED: '정산완료',
  AS_REQUESTED: 'AS접수',
  CLOSED: '종료',
};

export const CUSTOMER_STATUS_FLOW: StandardCustomerStatus[] = [
  'NEW',
  'CONSULT_PENDING',
  'CONSULTING',
  'QUOTE_SENT',
  'SCHEDULED',
  'COMPLETED',
  'SETTLEMENT_PENDING',
  'SETTLED',
];

const LEGACY_STATUS_MAP: Record<string, StandardCustomerStatus> = {
  NEW: 'NEW',
  상담대기: 'CONSULT_PENDING',
  CONSULT_PENDING: 'CONSULT_PENDING',
  CONSULTING: 'CONSULTING',
  견적확인: 'QUOTE_SENT',
  QUOTE_SENT: 'QUOTE_SENT',
  VISIT_REQUESTED: 'CONSULTING',
  VISIT_SCHEDULED: 'SCHEDULED',
  SCHEDULED: 'SCHEDULED',
  시공예약: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  시공완료: 'COMPLETED',
  SETTLEMENT_PENDING: 'SETTLEMENT_PENDING',
  SETTLED: 'SETTLED',
  AS_REQUESTED: 'AS_REQUESTED',
  상담종료: 'CLOSED',
  CLOSED: 'CLOSED',
};

export function normalizeCustomerStatus(status?: string | null): StandardCustomerStatus {
  if (!status) return 'NEW';
  return LEGACY_STATUS_MAP[status] ?? 'NEW';
}

export function getCustomerStatusLabel(status?: string | null) {
  return CUSTOMER_STATUS_LABELS[normalizeCustomerStatus(status)];
}

export function isUnansweredCustomer(status?: string | null, lastContactedAt?: string | null, createdAt?: string | null) {
  const normalized = normalizeCustomerStatus(status);
  if (!['NEW', 'CONSULT_PENDING'].includes(normalized)) return false;

  const baseDate = lastContactedAt || createdAt;
  if (!baseDate) return false;

  const elapsedMs = Date.now() - new Date(baseDate).getTime();
  return elapsedMs >= 24 * 60 * 60 * 1000;
}
