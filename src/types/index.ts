// ============================================================
// ZAPGO 에너지잡고 셀프견적 - 타입 정의
// ============================================================

// --- 열거형 타입 ---

export type UserRole = 'CUSTOMER' | 'ADMIN' | 'WORKER' | 'AGENCY';

export type EstimateStatus =
  | 'DRAFT'
  | 'REQUESTED'
  | 'ASSIGNED'
  | 'VISIT_REQUESTED'
  | 'VISIT_SCHEDULED'
  | 'COMPLETED';

export type WindowTypeCode = 'full_win' | 'half_win' | 'small_win';

export type LayoutCode =
  | '2_1_1'
  | '2_1_2'
  | '2_2_1'
  | '3_1_1_1'
  | '3_1_2_1'
  | '4_1_1_1_1';

export type FrameMohairState =
  | 'UNKNOWN'
  | 'NONE'
  | 'LINE_1'
  | 'LINE_2'
  | 'LINE_3'
  | 'LINE_4';

export type SizeCategory = 'small' | 'medium' | 'large' | 'xlarge';

export type SurveyLevel = 0 | 1 | 2 | 3;

export type MaterialType = 'FABRIC' | 'MOHAIR';

export type ServiceType = 'FOUR_SIDE' | 'SIDE_ONLY' | 'FRAME';

export type AdjustmentType = 'ADD' | 'DISCOUNT';

// --- DB Row 타입 ---

export interface Agency {
  id: string;
  name: string;
  referral_code: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  role: UserRole;
  kakao_id: string | null;
  name: string | null;
  phone: string | null;
  agency_id: string | null;
  created_at: string;
  updated_at: string;
  // 하위 호환성을 위한 선택적 필드 (이전 시스템에서 마이그레이션)
  is_active?: boolean;
  tenant_id?: string;
  email?: string;
  tenant?: { name?: string; [key: string]: unknown };
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  status: string;
  problem_summary: string | null;
  extra_request: string | null;
  consult_memo: string | null;
  consultant_user_id: string | null;
  team_leader_user_id: string | null;
  team_member_names: string | null;
  scheduled_date: string | null;
  final_construction_amount: number;
  deposit_amount: number;
  deposit_received_date: string | null;
  payment_received_date: string | null;
  payer_name: string | null;
  referral_code: string | null;
  agency_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Estimate {
  id: string;
  customer_id: string;
  worker_id: string | null;
  status: EstimateStatus;
  estimate_request_type: string;
  housing_area_pyeong: number;
  material_type: MaterialType | null;
  self_estimated_amount: number;
  admin_adjusted_amount: number;
  final_confirmed_amount: number;
  customer_name: string | null;
  customer_phone: string | null;
  address: string | null;
  preferred_date: string | null;
  extra_request: string | null;
  marketing_consent: boolean;
  customer_signature_url: string | null;
  warning_unknown_frame: boolean;
  referral_code: string | null;
  agency_id: string | null;
  locked_at: string | null;
  requested_at: string | null;
  assigned_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EstimateSurvey {
  id: string;
  estimate_id: string;
  heating_cost_level: SurveyLevel;
  draft_level: SurveyLevel;
  dust_level: SurveyLevel;
  bug_level: SurveyLevel;
  noise_level: SurveyLevel;
  odor_level: SurveyLevel;
  created_at: string;
}

export interface Window {
  id: string;
  estimate_id: string;
  location_label: string;
  window_type_code: WindowTypeCode;
  layout_code: LayoutCode;
  is_double_window: boolean;
  frame_work_selected: boolean;
  frame_mohair_state: FrameMohairState;
  screen_target: boolean;
  screen_size_type: string | null;
  auto_screen_count: number;
  confirmed_screen_count: number;
  created_at: string;
  updated_at: string;
}

export interface WindowPanel {
  id: string;
  window_id: string;
  panel_order: number;
  width_ratio: number;
  size_category: SizeCategory;
  created_at: string;
}

export interface EstimateWindowService {
  id: string;
  estimate_id: string;
  window_id: string | null;
  service_family: string;
  service_type: ServiceType;
  selected: boolean;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface EstimateAdjustment {
  id: string;
  estimate_id: string;
  actor_user_id: string;
  adjustment_type: AdjustmentType;
  amount: number;
  reason: string;
  created_at: string;
}

export interface EstimateRevision {
  id: string;
  estimate_id: string;
  actor_user_id: string;
  actor_role: UserRole;
  revision_type: string;
  field_path: string;
  before_value: unknown | null;
  after_value: unknown | null;
  memo: string | null;
  created_at: string;
}

// --- 프론트엔드 타입 ---

export interface SurveyAnswers {
  heating_cost: SurveyLevel | null;
  draft: SurveyLevel | null;
  dust: SurveyLevel | null;
  bug: SurveyLevel | null;
  noise: SurveyLevel | null;
  odor: SurveyLevel | null;
}

/** 창문 패널 분류 결과 (계산 중간 데이터) */
export interface PanelClassification {
  panel_order: number;
  width_ratio: number;
  is_wide: boolean;
  size_category: SizeCategory;
}

/** 창문 서비스 타입 선택 */
export type WindowServiceType = 'FOUR_SIDE' | 'SIDE_ONLY';

/** 창문 폼 입력 데이터 */
export interface WindowInput {
  id: string; // 프론트엔드 임시 ID
  location_label: string;
  window_type_code: WindowTypeCode;
  layout_code: LayoutCode;
  is_double_window: boolean;
  frame_mohair_state: FrameMohairState;
  service_type: WindowServiceType; // 4면 or 측면
  confirmed_screen_count: number; // 고객이 수정 가능한 방충망 수
}

/** 서비스 라인 아이템 */
export interface ServiceLineItem {
  window_id: string;
  location_label: string;
  service_type: WindowServiceType;
  layers: number; // 1 or 2 (이중창)
  size_category: SizeCategory;
  unit_price: number;
  quantity: number;
  total_price: number;
}

/** 창틀 시공 라인 아이템 */
export interface FrameLineItem {
  window_id: string;
  location_label: string;
  frame_mohair_state: FrameMohairState;
  layers: number;
  size_category: SizeCategory;
  unit_price: number;
  quantity: number;
  total_price: number;
}

/** 방충망 라인 아이템 */
export interface ScreenLineItem {
  window_id: string;
  location_label: string;
  screen_count: number;
  screen_size: SizeCategory;
  replacement_unit_price: number;
  replacement_total: number;
  bug_solution_unit_price: number;
  bug_solution_total: number;
}

/** 견적 계산 결과 */
export interface EstimateResult {
  labor_cost: number;
  worker_count: number;
  service_lines: ServiceLineItem[];
  frame_lines: FrameLineItem[];
  screen_lines: ScreenLineItem[];
  adjustment_total: number;
  subtotal_service: number;
  subtotal_frame: number;
  subtotal_screen_replacement: number;
  subtotal_bug_solution: number;
  total: number;
  has_unknown_frame: boolean;
}

/** 추천 시공 */
export interface Recommendation {
  type: 'fabric_four_side' | 'side_only' | 'bug_solution';
  label: string;
  reason: string;
}
