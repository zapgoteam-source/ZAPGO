import { EstimateSurvey, EstimateRevision, EstimateAdjustment } from '@/types';

// ─── 창문 + 서비스 (detail 페이지용) ───────────────────────────────────────────

export interface DummyWindow {
  id: string;
  estimate_id: string;
  location_label: string;
  window_type_code: string;
  layout_code: string;
  is_double_window: boolean;
  frame_work_selected: boolean;
  frame_mohair_state: string;
  screen_target: boolean;
  screen_size_type: string | null;
  auto_screen_count: number;
  confirmed_screen_count: number;
  created_at: string;
  updated_at: string;
  services: DummyWindowService[];
}

export interface DummyWindowService {
  id: string;
  estimate_id: string;
  window_id: string;
  service_family: string;
  service_type: string;
  selected: boolean;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export const DUMMY_WINDOWS: Record<string, DummyWindow[]> = {
  // 김태평 — 32평, FABRIC, EST de-01
  'de-01-0000-0000-0000-000000000001': [
    {
      id: 'dw-01-1', estimate_id: 'de-01-0000-0000-0000-000000000001',
      location_label: '거실 큰창', window_type_code: 'full_win',
      layout_code: '2_1_1', is_double_window: true,
      frame_work_selected: true, frame_mohair_state: 'LINE_2',
      screen_target: true, screen_size_type: 'large',
      auto_screen_count: 2, confirmed_screen_count: 2,
      created_at: '2026-03-25T09:10:00Z', updated_at: '2026-03-25T09:10:00Z',
      services: [
        { id: 'ds-01-1a', estimate_id: 'de-01-0000-0000-0000-000000000001', window_id: 'dw-01-1', service_family: '패브릭씰러', service_type: 'FOUR_SIDE', selected: true, quantity: 2, unit_price: 620000, total_price: 1240000, created_at: '2026-03-25T09:10:00Z', updated_at: '2026-03-25T09:10:00Z' },
        { id: 'ds-01-1b', estimate_id: 'de-01-0000-0000-0000-000000000001', window_id: 'dw-01-1', service_family: '방충망 교체', service_type: 'FRAME', selected: true, quantity: 2, unit_price: 80000, total_price: 160000, created_at: '2026-03-25T09:10:00Z', updated_at: '2026-03-25T09:10:00Z' },
      ],
    },
    {
      id: 'dw-01-2', estimate_id: 'de-01-0000-0000-0000-000000000001',
      location_label: '안방 창문', window_type_code: 'half_win',
      layout_code: '2_1_1', is_double_window: true,
      frame_work_selected: false, frame_mohair_state: 'NONE',
      screen_target: true, screen_size_type: 'medium',
      auto_screen_count: 1, confirmed_screen_count: 1,
      created_at: '2026-03-25T09:10:00Z', updated_at: '2026-03-25T09:10:00Z',
      services: [
        { id: 'ds-01-2a', estimate_id: 'de-01-0000-0000-0000-000000000001', window_id: 'dw-01-2', service_family: '패브릭씰러', service_type: 'FOUR_SIDE', selected: true, quantity: 2, unit_price: 480000, total_price: 960000, created_at: '2026-03-25T09:10:00Z', updated_at: '2026-03-25T09:10:00Z' },
      ],
    },
    {
      id: 'dw-01-3', estimate_id: 'de-01-0000-0000-0000-000000000001',
      location_label: '작은방 창문', window_type_code: 'small_win',
      layout_code: '2_1_1', is_double_window: false,
      frame_work_selected: false, frame_mohair_state: 'NONE',
      screen_target: false, screen_size_type: null,
      auto_screen_count: 0, confirmed_screen_count: 0,
      created_at: '2026-03-25T09:10:00Z', updated_at: '2026-03-25T09:10:00Z',
      services: [
        { id: 'ds-01-3a', estimate_id: 'de-01-0000-0000-0000-000000000001', window_id: 'dw-01-3', service_family: '패브릭씰러', service_type: 'SIDE_ONLY', selected: true, quantity: 1, unit_price: 290000, total_price: 290000, created_at: '2026-03-25T09:10:00Z', updated_at: '2026-03-25T09:10:00Z' },
      ],
    },
  ],

  // 이서연 — 25평, MOHAIR, EST de-02
  'de-02-0000-0000-0000-000000000002': [
    {
      id: 'dw-02-1', estimate_id: 'de-02-0000-0000-0000-000000000002',
      location_label: '거실', window_type_code: 'full_win',
      layout_code: '2_1_1', is_double_window: true,
      frame_work_selected: true, frame_mohair_state: 'LINE_1',
      screen_target: true, screen_size_type: 'large',
      auto_screen_count: 2, confirmed_screen_count: 2,
      created_at: '2026-03-22T14:30:00Z', updated_at: '2026-03-22T14:30:00Z',
      services: [
        { id: 'ds-02-1a', estimate_id: 'de-02-0000-0000-0000-000000000002', window_id: 'dw-02-1', service_family: '일반모헤어', service_type: 'FOUR_SIDE', selected: true, quantity: 2, unit_price: 380000, total_price: 760000, created_at: '2026-03-22T14:30:00Z', updated_at: '2026-03-22T14:30:00Z' },
      ],
    },
    {
      id: 'dw-02-2', estimate_id: 'de-02-0000-0000-0000-000000000002',
      location_label: '안방', window_type_code: 'half_win',
      layout_code: '2_1_1', is_double_window: false,
      frame_work_selected: false, frame_mohair_state: 'NONE',
      screen_target: false, screen_size_type: null,
      auto_screen_count: 0, confirmed_screen_count: 0,
      created_at: '2026-03-22T14:30:00Z', updated_at: '2026-03-22T14:30:00Z',
      services: [
        { id: 'ds-02-2a', estimate_id: 'de-02-0000-0000-0000-000000000002', window_id: 'dw-02-2', service_family: '일반모헤어', service_type: 'FOUR_SIDE', selected: true, quantity: 1, unit_price: 320000, total_price: 320000, created_at: '2026-03-22T14:30:00Z', updated_at: '2026-03-22T14:30:00Z' },
      ],
    },
  ],

  // 박지훈 — 40평, FABRIC, EST de-03
  'de-03-0000-0000-0000-000000000003': [
    {
      id: 'dw-03-1', estimate_id: 'de-03-0000-0000-0000-000000000003',
      location_label: '거실 큰창', window_type_code: 'full_win',
      layout_code: '3_1_2_1', is_double_window: true,
      frame_work_selected: true, frame_mohair_state: 'LINE_2',
      screen_target: true, screen_size_type: 'xlarge',
      auto_screen_count: 3, confirmed_screen_count: 3,
      created_at: '2026-03-18T11:00:00Z', updated_at: '2026-03-18T11:00:00Z',
      services: [
        { id: 'ds-03-1a', estimate_id: 'de-03-0000-0000-0000-000000000003', window_id: 'dw-03-1', service_family: '패브릭씰러', service_type: 'FOUR_SIDE', selected: true, quantity: 2, unit_price: 780000, total_price: 1560000, created_at: '2026-03-18T11:00:00Z', updated_at: '2026-03-18T11:00:00Z' },
        { id: 'ds-03-1b', estimate_id: 'de-03-0000-0000-0000-000000000003', window_id: 'dw-03-1', service_family: '방충망 교체', service_type: 'FRAME', selected: true, quantity: 3, unit_price: 90000, total_price: 270000, created_at: '2026-03-18T11:00:00Z', updated_at: '2026-03-18T11:00:00Z' },
      ],
    },
    {
      id: 'dw-03-2', estimate_id: 'de-03-0000-0000-0000-000000000003',
      location_label: '안방', window_type_code: 'half_win',
      layout_code: '2_1_1', is_double_window: true,
      frame_work_selected: false, frame_mohair_state: 'UNKNOWN',
      screen_target: true, screen_size_type: 'medium',
      auto_screen_count: 1, confirmed_screen_count: 1,
      created_at: '2026-03-18T11:00:00Z', updated_at: '2026-03-18T11:00:00Z',
      services: [
        { id: 'ds-03-2a', estimate_id: 'de-03-0000-0000-0000-000000000003', window_id: 'dw-03-2', service_family: '패브릭씰러', service_type: 'FOUR_SIDE', selected: true, quantity: 2, unit_price: 520000, total_price: 1040000, created_at: '2026-03-18T11:00:00Z', updated_at: '2026-03-18T11:00:00Z' },
      ],
    },
    {
      id: 'dw-03-3', estimate_id: 'de-03-0000-0000-0000-000000000003',
      location_label: '작은방 1', window_type_code: 'small_win',
      layout_code: '2_1_1', is_double_window: false,
      frame_work_selected: false, frame_mohair_state: 'NONE',
      screen_target: false, screen_size_type: null,
      auto_screen_count: 0, confirmed_screen_count: 0,
      created_at: '2026-03-18T11:00:00Z', updated_at: '2026-03-18T11:00:00Z',
      services: [
        { id: 'ds-03-3a', estimate_id: 'de-03-0000-0000-0000-000000000003', window_id: 'dw-03-3', service_family: '패브릭씰러', service_type: 'SIDE_ONLY', selected: true, quantity: 1, unit_price: 280000, total_price: 280000, created_at: '2026-03-18T11:00:00Z', updated_at: '2026-03-18T11:00:00Z' },
      ],
    },
    {
      id: 'dw-03-4', estimate_id: 'de-03-0000-0000-0000-000000000003',
      location_label: '작은방 2', window_type_code: 'small_win',
      layout_code: '2_1_1', is_double_window: false,
      frame_work_selected: false, frame_mohair_state: 'NONE',
      screen_target: false, screen_size_type: null,
      auto_screen_count: 0, confirmed_screen_count: 0,
      created_at: '2026-03-18T11:00:00Z', updated_at: '2026-03-18T11:00:00Z',
      services: [
        { id: 'ds-03-4a', estimate_id: 'de-03-0000-0000-0000-000000000003', window_id: 'dw-03-4', service_family: '패브릭씰러', service_type: 'SIDE_ONLY', selected: true, quantity: 1, unit_price: 280000, total_price: 280000, created_at: '2026-03-18T11:00:00Z', updated_at: '2026-03-18T11:00:00Z' },
      ],
    },
  ],
};

// ─── 설문 더미 ─────────────────────────────────────────────────────────────────

export const DUMMY_SURVEYS: Record<string, EstimateSurvey> = {
  'de-01-0000-0000-0000-000000000001': {
    id: 'dsv-01', estimate_id: 'de-01-0000-0000-0000-000000000001',
    noise_level: 3, draft_level: 2, heating_cost_level: 3,
    dust_level: 1, bug_level: 0, odor_level: 0,
    created_at: '2026-03-25T09:10:00Z',
  },
  'de-02-0000-0000-0000-000000000002': {
    id: 'dsv-02', estimate_id: 'de-02-0000-0000-0000-000000000002',
    noise_level: 2, draft_level: 1, heating_cost_level: 1,
    dust_level: 0, bug_level: 0, odor_level: 0,
    created_at: '2026-03-22T14:30:00Z',
  },
  'de-03-0000-0000-0000-000000000003': {
    id: 'dsv-03', estimate_id: 'de-03-0000-0000-0000-000000000003',
    noise_level: 2, draft_level: 3, heating_cost_level: 2,
    dust_level: 2, bug_level: 1, odor_level: 0,
    created_at: '2026-03-18T11:00:00Z',
  },
  'de-06-0000-0000-0000-000000000006': {
    id: 'dsv-06', estimate_id: 'de-06-0000-0000-0000-000000000006',
    noise_level: 1, draft_level: 1, heating_cost_level: 1,
    dust_level: 0, bug_level: 3, odor_level: 2,
    created_at: '2026-03-20T13:00:00Z',
  },
  'de-10-0000-0000-0000-000000000010': {
    id: 'dsv-10', estimate_id: 'de-10-0000-0000-0000-000000000010',
    noise_level: 0, draft_level: 2, heating_cost_level: 2,
    dust_level: 1, bug_level: 0, odor_level: 0,
    created_at: '2026-03-21T11:45:00Z',
  },
};

// ─── 수정 이력 더미 ─────────────────────────────────────────────────────────────

export const DUMMY_REVISIONS: Record<string, EstimateRevision[]> = {
  'de-01-0000-0000-0000-000000000001': [
    { id: 'dr-01-1', estimate_id: 'de-01-0000-0000-0000-000000000001', actor_user_id: 'admin', actor_role: 'ADMIN', revision_type: '신규 접수', field_path: 'status', before_value: 'DRAFT', after_value: 'REQUESTED', memo: '셀프견적 완료 후 접수', created_at: '2026-03-25T09:10:00Z' },
  ],
  'de-02-0000-0000-0000-000000000002': [
    { id: 'dr-02-1', estimate_id: 'de-02-0000-0000-0000-000000000002', actor_user_id: 'admin', actor_role: 'ADMIN', revision_type: '담당자 배정', field_path: 'status', before_value: 'REQUESTED', after_value: 'ASSIGNED', memo: '담당 상담사 배정 완료', created_at: '2026-03-23T10:00:00Z' },
    { id: 'dr-02-2', estimate_id: 'de-02-0000-0000-0000-000000000002', actor_user_id: 'admin', actor_role: 'ADMIN', revision_type: '조정 금액 추가', field_path: 'admin_adjusted_amount', before_value: 0, after_value: 150000, memo: '창틀 추가 작업 비용 반영', created_at: '2026-03-23T11:00:00Z' },
    { id: 'dr-02-3', estimate_id: 'de-02-0000-0000-0000-000000000002', actor_user_id: 'customer', actor_role: 'CUSTOMER', revision_type: '셀프견적 생성', field_path: 'status', before_value: null, after_value: 'REQUESTED', memo: null, created_at: '2026-03-22T14:30:00Z' },
  ],
  'de-04-0000-0000-0000-000000000004': [
    { id: 'dr-04-1', estimate_id: 'de-04-0000-0000-0000-000000000004', actor_user_id: 'admin', actor_role: 'ADMIN', revision_type: '시공 완료', field_path: 'status', before_value: 'VISIT_SCHEDULED', after_value: 'COMPLETED', memo: '고객 서명 완료 및 잠금 처리', created_at: '2026-03-10T17:00:00Z' },
    { id: 'dr-04-2', estimate_id: 'de-04-0000-0000-0000-000000000004', actor_user_id: 'admin', actor_role: 'ADMIN', revision_type: '방문 일정 확정', field_path: 'status', before_value: 'ASSIGNED', after_value: 'VISIT_SCHEDULED', memo: '3/10(화) 오전 10시 확정', created_at: '2026-03-05T14:00:00Z' },
    { id: 'dr-04-3', estimate_id: 'de-04-0000-0000-0000-000000000004', actor_user_id: 'customer', actor_role: 'CUSTOMER', revision_type: '셀프견적 생성', field_path: 'status', before_value: null, after_value: 'REQUESTED', memo: null, created_at: '2026-02-28T08:45:00Z' },
  ],
};

// ─── 조정 이력 더미 ─────────────────────────────────────────────────────────────

export const DUMMY_ADJUSTMENTS: Record<string, EstimateAdjustment[]> = {
  'de-02-0000-0000-0000-000000000002': [
    { id: 'da-02-1', estimate_id: 'de-02-0000-0000-0000-000000000002', actor_user_id: 'admin', adjustment_type: 'ADD', amount: 150000, reason: '창틀 추가 작업비 반영 (현장 확인 후)', created_at: '2026-03-23T11:00:00Z' },
  ],
  'de-03-0000-0000-0000-000000000003': [
    { id: 'da-03-1', estimate_id: 'de-03-0000-0000-0000-000000000003', actor_user_id: 'admin', adjustment_type: 'ADD', amount: 400000, reason: '실측 후 창틀 규격 초과분 추가', created_at: '2026-03-20T15:00:00Z' },
  ],
  'de-06-0000-0000-0000-000000000006': [
    { id: 'da-06-1', estimate_id: 'de-06-0000-0000-0000-000000000006', actor_user_id: 'admin', adjustment_type: 'DISCOUNT', amount: 300000, reason: '대리점 제휴 할인 적용', created_at: '2026-03-21T10:00:00Z' },
  ],
  'de-07-0000-0000-0000-000000000007': [
    { id: 'da-07-1', estimate_id: 'de-07-0000-0000-0000-000000000007', actor_user_id: 'admin', adjustment_type: 'ADD', amount: 500000, reason: '50평 대형 현장 출장비 및 추가 인건비 반영', created_at: '2026-02-01T10:00:00Z' },
  ],
  'de-10-0000-0000-0000-000000000010': [
    { id: 'da-10-1', estimate_id: 'de-10-0000-0000-0000-000000000010', actor_user_id: 'admin', adjustment_type: 'ADD', amount: 600000, reason: '부산 원거리 출장비 포함', created_at: '2026-03-22T09:00:00Z' },
  ],
  'de-14-0000-0000-0000-000000000014': [
    { id: 'da-14-1', estimate_id: 'de-14-0000-0000-0000-000000000014', actor_user_id: 'admin', adjustment_type: 'ADD', amount: 700000, reason: '58평 대형 현장 추가 자재비 및 인건비', created_at: '2025-12-31T11:00:00Z' },
  ],
};
