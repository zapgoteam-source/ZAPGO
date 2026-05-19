export type IssueKey = 'dust' | 'draft' | 'bug' | 'heating' | 'noise' | 'odor';
export type PlanKey = 'fabric' | 'mohair' | 'side';
export type ProtectionKey = 'none' | 'premium';

export const ISSUE_LABELS: Record<IssueKey, string> = {
  dust: '먼지날림',
  draft: '외풍유입',
  bug: '벌레유입',
  heating: '냉난방비',
  noise: '소음유입',
  odor: '악취유입',
};

export const PLAN_LABELS: Record<PlanKey, string> = {
  fabric: '패브릭씰러 시공',
  mohair: '일반 모헤어 시공',
  side: '측면 시공',
};

export const PROTECTION_LABELS: Record<ProtectionKey, string> = {
  none: '보양 추가 없음',
  premium: '프리미엄 보양',
};

const LABOR_PER_WORKER = 250_000;
const FABRIC_FOUR_UNIT = 30_000;
const SIDE_ONLY_UNIT = 15_000;
const MOHAIR_PER_PYEONG = 35_000;
const PREMIUM_PROTECTION_PRICE = 80_000;
const VAT_RATE = 1.1;

export type SelfEstimateTotalsInput = {
  pyeong: number;
  sash: number;
  protectionOption?: ProtectionKey | null;
  includeRailMohair?: boolean;
  pestSolution?: boolean;
  pestScreenCount?: number;
};

export function getSelfEstimateWorkerCount(pyeong: number) {
  if (pyeong >= 71) return 6;
  if (pyeong >= 51) return 5;
  if (pyeong >= 38) return 4;
  if (pyeong >= 23) return 3;
  return 2;
}

export function withVat(amount: number) {
  return Math.round(amount * VAT_RATE);
}

export function calculateSelfEstimateTotals({
  pyeong,
  sash,
  protectionOption = null,
  includeRailMohair = false,
  pestSolution = false,
  pestScreenCount = 1,
}: SelfEstimateTotalsInput) {
  const pyeongNum = Number(pyeong) || 0;
  const sashNum = Number(sash) || 0;
  const labor = getSelfEstimateWorkerCount(pyeongNum) * LABOR_PER_WORKER;
  const protectionCost = protectionOption === 'premium' ? PREMIUM_PROTECTION_PRICE : 0;
  const pestCost = pestSolution ? Math.max(1, Number(pestScreenCount) || 1) * 23_000 : 0;
  const multiplier = includeRailMohair ? 1.4 : 1;
  const fabricBase = withVat((labor + sashNum * FABRIC_FOUR_UNIT) * multiplier);
  const mohairBase = Math.round(pyeongNum * MOHAIR_PER_PYEONG * multiplier);
  const sideBase = withVat((LABOR_PER_WORKER + sashNum * SIDE_ONLY_UNIT) * multiplier);

  return {
    fabric: fabricBase + protectionCost + pestCost,
    mohair: mohairBase + protectionCost + pestCost,
    side: sideBase + protectionCost + pestCost,
  } satisfies Record<PlanKey, number>;
}

export function formatKRW(amount: number) {
  return `${Math.round(amount).toLocaleString('ko-KR')}원`;
}

export function formatKoreanDateTime(value: string | Date = new Date()) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

export function getRegionFromAddress(address: string) {
  const parts = address.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]} ${parts[1]}`;
  return parts[0] || '지역 미입력';
}

export function translateIssues(issues: string[] = []) {
  return issues.map((issue) => ISSUE_LABELS[issue as IssueKey] || issue).join(', ') || '미입력';
}
