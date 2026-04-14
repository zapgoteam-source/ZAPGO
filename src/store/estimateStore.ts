/**
 * ZAPGO 견적 Zustand Store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  SurveyAnswers,
  WindowInput,
  MaterialType,
  EstimateResult,
  Recommendation,
} from '@/types';
import { calcTotal, getAutoScreenCountForWindow, isWindowScreenTarget } from '@/lib/estimateCalculator';

// ============================================================
// 추천 시공 계산
// ============================================================

function computeRecommendations(survey: SurveyAnswers): Recommendation[] {
  const recs: Recommendation[] = [];

  const highThreshold = 2; // 심함(2) 이상

  const heatingHigh = survey.heating_cost !== null && survey.heating_cost >= highThreshold;
  const draftHigh = survey.draft !== null && survey.draft >= highThreshold;
  const noiseHigh = survey.noise !== null && survey.noise >= highThreshold;
  const odorHigh = survey.odor !== null && survey.odor >= highThreshold;
  const dustHigh = survey.dust !== null && survey.dust >= highThreshold;
  const bugPresent = survey.bug !== null && survey.bug >= 1;

  if (heatingHigh || draftHigh || noiseHigh || odorHigh) {
    recs.push({
      type: 'fabric_four_side',
      label: '패브릭씰러 탈거 4면 시공',
      reason: [
        heatingHigh && '냉난방비',
        draftHigh && '외풍',
        noiseHigh && '소음',
        odorHigh && '악취',
      ]
        .filter(Boolean)
        .join(', ') + ' 문제 해결에 효과적입니다',
    });
  }

  if (dustHigh) {
    recs.push({
      type: 'side_only',
      label: '측면 시공',
      reason: '먼지날림 차단에 효과적입니다',
    });
  }

  if (bugPresent) {
    recs.push({
      type: 'bug_solution',
      label: '방충솔루션',
      reason: '벌레 유입 차단에 효과적입니다',
    });
  }

  return recs;
}

// ============================================================
// Store 타입
// ============================================================

interface EstimateStore {
  // 상태
  surveyAnswers: SurveyAnswers;
  housingAreaPyeong: number | null;
  materialType: MaterialType;
  windowSashCount: number | null;
  premiumProtection: boolean;
  pestSolution: boolean;
  pestScreenCount: number;
  selectedPlan: 'main' | 'alt1' | 'alt2';
  windows: WindowInput[];
  recommendations: Recommendation[];
  _savedAt?: number; // persist 만료 체크용 (직접 사용 금지)

  // 액션
  setSurvey: (answers: SurveyAnswers) => void;
  setHousingArea: (pyeong: number) => void;
  setMaterialType: (type: MaterialType) => void;
  setWindowSashCount: (count: number) => void;
  setPremiumProtection: (value: boolean) => void;
  setPestSolution: (value: boolean) => void;
  setPestScreenCount: (count: number) => void;
  setSelectedPlan: (plan: 'main' | 'alt1' | 'alt2') => void;
  addWindow: (window: WindowInput) => void;
  updateWindow: (id: string, updates: Partial<WindowInput>) => void;
  removeWindow: (id: string) => void;
  reset: () => void;

  // 계산 결과
  getEstimateResult: () => EstimateResult | null;
  getAlternativeResult: (altMaterial: MaterialType, altServiceType: 'FOUR_SIDE' | 'SIDE_ONLY') => EstimateResult | null;
}

// ============================================================
// 초기 상태
// ============================================================

const initialSurveyAnswers: SurveyAnswers = {
  heating_cost: null,
  draft: null,
  dust: null,
  bug: null,
  noise: null,
  odor: null,
};

// ============================================================
// Store 생성
// ============================================================

export const useEstimateStore = create<EstimateStore>()(
  persist(
    (set, get) => ({
      surveyAnswers: initialSurveyAnswers,
      housingAreaPyeong: null,
      materialType: 'FABRIC',
      windowSashCount: null,
      premiumProtection: false,
      pestSolution: false,
      pestScreenCount: 1,
      selectedPlan: 'main',
      windows: [],
      recommendations: [],

      setSurvey: (answers) => {
        const recs = computeRecommendations(answers);
        set({ surveyAnswers: answers, recommendations: recs });
      },

      setHousingArea: (pyeong) => {
        set({ housingAreaPyeong: pyeong });
      },

      setMaterialType: (type) => {
        set({ materialType: type });
      },

      setWindowSashCount: (count) => {
        set({ windowSashCount: count });
      },

      setPremiumProtection: (value) => {
        set({ premiumProtection: value });
      },

      setPestSolution: (value) => {
        set({ pestSolution: value, ...(value ? {} : { pestScreenCount: 1 }) });
      },

      setPestScreenCount: (count) => {
        set({ pestScreenCount: count });
      },

      setSelectedPlan: (plan) => {
        set({ selectedPlan: plan });
      },

      addWindow: (window) => {
        // 방충망 대상이면 confirmed_screen_count 자동 설정
        const autoCount = isWindowScreenTarget(window)
          ? getAutoScreenCountForWindow(window.layout_code)
          : 0;
        const newWindow: WindowInput = {
          ...window,
          confirmed_screen_count:
            window.confirmed_screen_count > 0 ? window.confirmed_screen_count : autoCount,
        };
        set((state) => ({ windows: [...state.windows, newWindow] }));
      },

      updateWindow: (id, updates) => {
        set((state) => ({
          windows: state.windows.map((w) => {
            if (w.id !== id) return w;
            const updated = { ...w, ...updates };
            // 방충망 수량 재계산 (레이아웃이나 타입 변경 시)
            if (updates.layout_code || updates.window_type_code || updates.is_double_window || updates.location_label) {
              if (isWindowScreenTarget(updated) && updated.confirmed_screen_count === 0) {
                updated.confirmed_screen_count = getAutoScreenCountForWindow(updated.layout_code);
              }
            }
            return updated;
          }),
        }));
      },

      removeWindow: (id) => {
        set((state) => ({ windows: state.windows.filter((w) => w.id !== id) }));
      },

      reset: () => {
        set({
          surveyAnswers: initialSurveyAnswers,
          housingAreaPyeong: null,
          materialType: 'FABRIC',
          windowSashCount: null,
          premiumProtection: false,
          pestSolution: false,
          pestScreenCount: 1,
          selectedPlan: 'main',
          windows: [],
          recommendations: [],
        });
      },

      getEstimateResult: () => {
        const { windows, housingAreaPyeong, materialType } = get();
        if (housingAreaPyeong === null || windows.length === 0) return null;
        return calcTotal(windows, housingAreaPyeong, materialType, 0);
      },

      getAlternativeResult: (altMaterial, altServiceType) => {
        const { windows, housingAreaPyeong } = get();
        if (housingAreaPyeong === null || windows.length === 0) return null;
        const altWindows = windows.map((w) => ({
          ...w,
          service_type: altServiceType,
        }));
        return calcTotal(altWindows, housingAreaPyeong, altMaterial, 0);
      },
    }),
    {
      name: 'zapgo-estimate-store',
      version: 1, // 스키마 변경 시 증가 → 구버전 캐시 자동 무효화
      // 24시간 후 캐시 만료
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const stored = localStorage.getItem('zapgo-estimate-store');
        if (!stored) return;
        try {
          const parsed = JSON.parse(stored) as { state?: { _savedAt?: number } };
          const savedAt = parsed?.state?._savedAt;
          if (savedAt && Date.now() - savedAt > 24 * 60 * 60 * 1000) {
            useEstimateStore.getState().reset();
          }
        } catch {
          // 파싱 실패 시 무시
        }
      },
      partialize: (s) => ({
        surveyAnswers: s.surveyAnswers,
        housingAreaPyeong: s.housingAreaPyeong,
        materialType: s.materialType,
        windowSashCount: s.windowSashCount,
        premiumProtection: s.premiumProtection,
        pestSolution: s.pestSolution,
        pestScreenCount: s.pestScreenCount,
        selectedPlan: s.selectedPlan,
        windows: s.windows,
        recommendations: s.recommendations,
        _savedAt: Date.now(),
      }),
    }
  )
);
