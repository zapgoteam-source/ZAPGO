/**
 * ZAPGO 에너지잡고 셀프견적 - 견적 계산 엔진
 * 모든 금액은 부가세 별도
 */

import {
  WindowTypeCode,
  LayoutCode,
  SizeCategory,
  FrameMohairState,
  MaterialType,
  WindowInput,
  WindowServiceType,
  ServiceLineItem,
  FrameLineItem,
  ScreenLineItem,
  EstimateResult,
  PanelClassification,
} from '@/types';

// ============================================================
// 레이아웃 코드 → 패널 비율 정보
// ============================================================

/** 레이아웃별 패널 width_ratio 배열 */
const LAYOUT_PANEL_RATIOS: Record<LayoutCode, number[]> = {
  '2_1_1': [1, 1],
  '2_1_2': [1, 2],
  '2_2_1': [2, 1],
  '3_1_1_1': [1, 1, 1],
  '3_1_2_1': [1, 2, 1],
  '4_1_1_1_1': [1, 1, 1, 1],
};

/** 패널이 '넓은 창'인지 판별: 비율이 가장 큰 것 중 하나 */
function isWidePanel(panelRatio: number, allRatios: number[]): boolean {
  const max = Math.max(...allRatios);
  return panelRatio === max;
}

// ============================================================
// 크기 분류
// ============================================================

/**
 * 패널 크기 분류
 * @param windowTypeCode 창문 유형
 * @param isWide 넓은 창 여부
 * @param housingAreaPyeong 평형
 */
export function classifyPanelSize(
  windowTypeCode: WindowTypeCode,
  isWide: boolean,
  housingAreaPyeong: number
): SizeCategory {
  if (windowTypeCode === 'small_win') {
    return 'small';
  }
  if (windowTypeCode === 'half_win') {
    return 'medium';
  }
  // full_win
  if (!isWide) {
    // 좁은 창(소형창 아닌 경우): medium
    return 'medium';
  }
  // full_win 넓은 창: 평형 기준 적용
  if (housingAreaPyeong < 23) return 'medium';
  if (housingAreaPyeong < 38) return 'large';
  return 'xlarge'; // 38평 이상 (60평 초과도 xlarge, 인원만 5명으로)
}

/**
 * 창문의 패널들을 분류하여 반환
 */
export function classifyWindowPanels(
  window: WindowInput,
  housingAreaPyeong: number
): PanelClassification[] {
  const ratios = LAYOUT_PANEL_RATIOS[window.layout_code];
  return ratios.map((ratio, idx) => {
    const wide = isWidePanel(ratio, ratios);
    const size = classifyPanelSize(window.window_type_code, wide, housingAreaPyeong);
    return {
      panel_order: idx + 1,
      width_ratio: ratio,
      is_wide: wide,
      size_category: size,
    };
  });
}

/** 창문의 가장 큰 패널 크기 */
function getMaxPanelSize(panels: PanelClassification[]): SizeCategory {
  const order: SizeCategory[] = ['small', 'medium', 'large', 'xlarge'];
  let max: SizeCategory = 'small';
  for (const p of panels) {
    if (order.indexOf(p.size_category) > order.indexOf(max)) {
      max = p.size_category;
    }
  }
  return max;
}

// ============================================================
// 인건비 계산
// ============================================================

/**
 * 인건비 계산
 * 규칙:
 * - 60평 이상 → 5명
 * - 전체가 측면 시공만 → 1명
 * - 최대 창이 medium → 2명, large → 3명, xlarge → 4명
 */
export function calcLaborCost(
  windows: WindowInput[],
  housingAreaPyeong: number
): number {
  const workerCount = calcWorkerCount(windows, housingAreaPyeong);
  return 300_000 * workerCount;
}

export function calcWorkerCount(
  windows: WindowInput[],
  housingAreaPyeong: number
): number {
  if (windows.length === 0) return 0;

  if (housingAreaPyeong >= 60) return 5;

  const allSideOnly = windows.every((w) => w.service_type === 'SIDE_ONLY');
  if (allSideOnly) return 1;

  let maxSize: SizeCategory = 'small';
  const order: SizeCategory[] = ['small', 'medium', 'large', 'xlarge'];

  for (const w of windows) {
    const panels = classifyWindowPanels(w, housingAreaPyeong);
    const size = getMaxPanelSize(panels);
    if (order.indexOf(size) > order.indexOf(maxSize)) {
      maxSize = size;
    }
  }

  if (maxSize === 'xlarge') return 4;
  if (maxSize === 'large') return 3;
  return 2; // medium or small
}

// ============================================================
// 단가 테이블
// ============================================================

const FABRIC_PRICES: Record<SizeCategory, { four_side: number; side: number; frame: number }> = {
  small: { four_side: 20_000, side: 10_000, frame: 15_000 },
  medium: { four_side: 30_000, side: 15_000, frame: 25_000 },
  large: { four_side: 40_000, side: 20_000, frame: 30_000 },
  xlarge: { four_side: 50_000, side: 25_000, frame: 40_000 },
};

const MOHAIR_PRICES: Record<SizeCategory, { four_side: number; side: number; frame: number }> = {
  small: { four_side: 10_000, side: 5_000, frame: 10_000 },
  medium: { four_side: 15_000, side: 10_000, frame: 15_000 },
  large: { four_side: 20_000, side: 15_000, frame: 20_000 },
  xlarge: { four_side: 25_000, side: 20_000, frame: 25_000 },
};

function getPriceTable(materialType: MaterialType) {
  return materialType === 'FABRIC' ? FABRIC_PRICES : MOHAIR_PRICES;
}

function getUnitPrice(
  materialType: MaterialType,
  serviceType: WindowServiceType,
  size: SizeCategory
): number {
  const table = getPriceTable(materialType);
  return serviceType === 'FOUR_SIDE' ? table[size].four_side : table[size].side;
}

// ============================================================
// 서비스 비용 계산
// ============================================================

/**
 * 메인 시공비 계산 (패브릭씰러 or 모헤어)
 * 이중창은 각 레이어를 과금하므로 총 창 비용 × 레이어 수
 */
export function calcServiceCost(
  windows: WindowInput[],
  housingAreaPyeong: number,
  materialType: MaterialType
): ServiceLineItem[] {
  const lines: ServiceLineItem[] = [];

  for (const w of windows) {
    const panels = classifyWindowPanels(w, housingAreaPyeong);
    const layers = w.is_double_window ? 2 : 1;

    for (const panel of panels) {
      const unitPrice = getUnitPrice(materialType, w.service_type, panel.size_category);
      const quantity = layers;
      lines.push({
        window_id: w.id,
        location_label: w.location_label,
        service_type: w.service_type,
        layers,
        size_category: panel.size_category,
        unit_price: unitPrice,
        quantity,
        total_price: unitPrice * quantity,
      });
    }
  }

  return lines;
}

// ============================================================
// 창틀 시공비 계산
// ============================================================

/**
 * 창틀 모헤어 상태에 따른 배율 반환
 * NONE, UNKNOWN: 0 (과금 없음)
 * LINE_1, LINE_2: 1
 * LINE_3, LINE_4: 2
 */
function getFrameMultiplier(state: FrameMohairState): number {
  if (state === 'NONE' || state === 'UNKNOWN') return 0;
  if (state === 'LINE_3' || state === 'LINE_4') return 2;
  return 1;
}

export function calcFrameCosts(
  windows: WindowInput[],
  housingAreaPyeong: number,
  materialType: MaterialType
): FrameLineItem[] {
  const lines: FrameLineItem[] = [];
  const priceTable = getPriceTable(materialType);

  for (const w of windows) {
    const multiplier = getFrameMultiplier(w.frame_mohair_state);
    if (multiplier === 0) continue;

    const panels = classifyWindowPanels(w, housingAreaPyeong);
    const maxSize = getMaxPanelSize(panels);
    const layers = w.is_double_window ? 2 : 1;
    const basePrice = priceTable[maxSize].frame;
    const unitPrice = basePrice * multiplier;
    const quantity = layers;

    lines.push({
      window_id: w.id,
      location_label: w.location_label,
      frame_mohair_state: w.frame_mohair_state,
      layers,
      size_category: maxSize,
      unit_price: unitPrice,
      quantity,
      total_price: unitPrice * quantity,
    });
  }

  return lines;
}

// ============================================================
// 방충망 및 방충솔루션 계산
// ============================================================

const SCREEN_PRICES: Record<SizeCategory, number> = {
  small: 50_000,
  medium: 60_000,
  large: 70_000,
  xlarge: 70_000, // full_win은 대형으로 처리
};

const BUG_SOLUTION_UNIT = 23_000;

const SCREEN_TARGET_KEYWORDS = ['베란다', '세탁실', '화장실', '주방'];

function isScreenTarget(window: WindowInput): boolean {
  if (window.is_double_window) return true;
  return SCREEN_TARGET_KEYWORDS.some((kw) => window.location_label.includes(kw));
}

function getAutoScreenCount(layoutCode: LayoutCode): number {
  const panels = LAYOUT_PANEL_RATIOS[layoutCode];
  if (panels.length === 2) return 1;
  return 2; // 3짝, 4짝
}

function getScreenSize(windowTypeCode: WindowTypeCode): SizeCategory {
  if (windowTypeCode === 'small_win') return 'small';
  if (windowTypeCode === 'half_win') return 'medium';
  return 'large'; // full_win
}

export function calcScreenCosts(windows: WindowInput[]): ScreenLineItem[] {
  const lines: ScreenLineItem[] = [];

  for (const w of windows) {
    if (!isScreenTarget(w)) continue;

    const autoCount = getAutoScreenCount(w.layout_code);
    // confirmed_screen_count가 0이면 자동 계산값 사용
    const screenCount = w.confirmed_screen_count > 0 ? w.confirmed_screen_count : autoCount;
    if (screenCount === 0) continue;

    const size = getScreenSize(w.window_type_code);
    const replacementUnit = SCREEN_PRICES[size];
    const replacementTotal = replacementUnit * screenCount;
    const bugSolutionTotal = BUG_SOLUTION_UNIT * screenCount;

    lines.push({
      window_id: w.id,
      location_label: w.location_label,
      screen_count: screenCount,
      screen_size: size,
      replacement_unit_price: replacementUnit,
      replacement_total: replacementTotal,
      bug_solution_unit_price: BUG_SOLUTION_UNIT,
      bug_solution_total: bugSolutionTotal,
    });
  }

  return lines;
}

// ============================================================
// 총액 계산
// ============================================================

/**
 * 전체 견적 계산
 */
export function calcTotal(
  windows: WindowInput[],
  housingAreaPyeong: number,
  materialType: MaterialType,
  adjustments: number = 0
): EstimateResult {
  const laborCost = calcLaborCost(windows, housingAreaPyeong);
  const workerCount = calcWorkerCount(windows, housingAreaPyeong);
  const serviceLines = calcServiceCost(windows, housingAreaPyeong, materialType);
  const frameLines = calcFrameCosts(windows, housingAreaPyeong, materialType);
  const screenLines = calcScreenCosts(windows);

  const subtotalService = serviceLines.reduce((s, l) => s + l.total_price, 0);
  const subtotalFrame = frameLines.reduce((s, l) => s + l.total_price, 0);
  const subtotalScreenReplacement = screenLines.reduce((s, l) => s + l.replacement_total, 0);
  const subtotalBugSolution = screenLines.reduce((s, l) => s + l.bug_solution_total, 0);

  const hasUnknownFrame = windows.some((w) => w.frame_mohair_state === 'UNKNOWN');

  const total =
    laborCost +
    subtotalService +
    subtotalFrame +
    subtotalScreenReplacement +
    subtotalBugSolution +
    adjustments;

  return {
    labor_cost: laborCost,
    worker_count: workerCount,
    service_lines: serviceLines,
    frame_lines: frameLines,
    screen_lines: screenLines,
    adjustment_total: adjustments,
    subtotal_service: subtotalService,
    subtotal_frame: subtotalFrame,
    subtotal_screen_replacement: subtotalScreenReplacement,
    subtotal_bug_solution: subtotalBugSolution,
    total,
    has_unknown_frame: hasUnknownFrame,
  };
}

// ============================================================
// 유틸리티
// ============================================================

/** 금액 포맷 (한국 원화) */
export function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

/** 크기 카테고리 한국어 표시 */
export function sizeCategoryLabel(size: SizeCategory): string {
  const labels: Record<SizeCategory, string> = {
    small: '소형',
    medium: '중형',
    large: '대형',
    xlarge: '특대형',
  };
  return labels[size];
}

/** 창문 유형 한국어 표시 */
export function windowTypeLabel(code: WindowTypeCode): string {
  const labels: Record<WindowTypeCode, string> = {
    full_win: '완창',
    half_win: '반창',
    small_win: '소형창',
  };
  return labels[code];
}

/** 레이아웃 코드 한국어 표시 */
export function layoutCodeLabel(code: LayoutCode): string {
  const labels: Record<LayoutCode, string> = {
    '2_1_1': '2짝 1:1',
    '2_1_2': '2짝 1:2',
    '2_2_1': '2짝 2:1',
    '3_1_1_1': '3짝 1:1:1',
    '3_1_2_1': '3짝 1:2:1',
    '4_1_1_1_1': '4짝 1:1:1:1',
  };
  return labels[code];
}

/** 창틀 모헤어 상태 한국어 표시 */
export function frameMohairLabel(state: FrameMohairState): string {
  const labels: Record<FrameMohairState, string> = {
    UNKNOWN: '모르겠음',
    NONE: '없음',
    LINE_1: '1줄',
    LINE_2: '2줄',
    LINE_3: '3줄',
    LINE_4: '4줄',
  };
  return labels[state];
}

/** 방충망 대상 창 여부 판별 (WindowInput 기반) */
export function isWindowScreenTarget(window: WindowInput): boolean {
  return isScreenTarget(window);
}

/** 자동 방충망 수량 */
export function getAutoScreenCountForWindow(layoutCode: LayoutCode): number {
  return getAutoScreenCount(layoutCode);
}
