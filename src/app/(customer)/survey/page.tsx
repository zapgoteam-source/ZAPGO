'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEstimateStore } from '@/store/estimateStore';
import { SurveyAnswers } from '@/types';

const SURVEY_QUESTIONS: { key: keyof SurveyAnswers; label: string; icon: string }[] = [
  { key: 'heating_cost', label: '냉난방비', icon: '🌡️' },
  { key: 'draft',        label: '외풍유입', icon: '💨' },
  { key: 'dust',         label: '먼지날림', icon: '🌫️' },
  { key: 'bug',          label: '벌레유입', icon: '🐛' },
  { key: 'noise',        label: '소음유입', icon: '🔊' },
  { key: 'odor',         label: '악취유입', icon: '🌀' },
];

export default function SurveyPage() {
  const router = useRouter();
  const { setSurvey, recommendations } = useEstimateStore();

  const [selected, setSelected] = useState<Set<keyof SurveyAnswers>>(new Set());

  const toggle = (key: keyof SurveyAnswers) => {
    const next = new Set(selected);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelected(next);

    // store 실시간 반영 (선택 → 3, 미선택 → 0)
    setSurvey(buildAnswers(next));
  };

  const buildAnswers = (sel: Set<keyof SurveyAnswers>): SurveyAnswers => ({
    heating_cost: sel.has('heating_cost') ? 3 : 0,
    draft:        sel.has('draft')        ? 3 : 0,
    dust:         sel.has('dust')         ? 3 : 0,
    bug:          sel.has('bug')          ? 3 : 0,
    noise:        sel.has('noise')        ? 3 : 0,
    odor:         sel.has('odor')         ? 3 : 0,
  });

  const canNext = selected.size > 0;

  const handleNext = () => {
    if (!canNext) return;
    const answers = buildAnswers(selected);
    setSurvey(answers);
    router.push('/house-info');
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-4">
        <p className="text-xs text-gray-400 mb-1">STEP 1 / 3</p>
        <h1 className="text-xl font-bold text-gray-900">현재 느끼고 계신 불편 사항을</h1>
        <h1 className="text-xl font-bold text-gray-900">모두 선택해 주세요</h1>
        <p className="text-sm text-gray-500 mt-1">해당하는 항목을 모두 눌러주세요</p>
      </div>

      {/* 선택 카드 */}
      <div className="flex-1 px-5 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {SURVEY_QUESTIONS.map((q) => {
            const isSelected = selected.has(q.key);
            return (
              <button
                key={q.key}
                onClick={() => toggle(q.key)}
                className={`relative flex flex-col items-center justify-center gap-2 py-6 border-2 transition-all ${
                  isSelected
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-2 right-2 text-xs font-bold text-white bg-gray-700 rounded-full w-5 h-5 flex items-center justify-center">
                    ✓
                  </span>
                )}
                <span className="text-3xl">{q.icon}</span>
                <span className="text-sm font-semibold">{q.label}</span>
              </button>
            );
          })}
        </div>

        {/* 추천 표시 */}
        {selected.size > 0 && recommendations.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 mt-5">
            <p className="text-sm font-bold text-yellow-800 mb-2">💡 추천 시공</p>
            <ul className="space-y-2">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5 flex-shrink-0">▶</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{rec.label}</p>
                    <p className="text-xs text-gray-500">{rec.reason}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-400 mt-2">
              * 추천은 참고용이며 다음 단계에서 원하는 시공을 선택하실 수 있습니다
            </p>
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="px-5 pb-6 pt-3 space-y-3 border-t border-gray-100 bg-white">
        <button
          onClick={handleNext}
          disabled={!canNext}
          className="w-full py-4 bg-gray-900 text-white font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
        >
          다음
        </button>
        <div className="flex gap-2">
          <a
            href="tel:16009195"
            className="flex-1 py-3 border border-gray-200 text-sm font-medium text-gray-600 text-center hover:bg-gray-50"
          >
            📞 상담원 연결
          </a>
          <a
            href="/visit-request"
            className="flex-1 py-3 border border-gray-200 text-sm font-medium text-gray-600 text-center hover:bg-gray-50"
          >
            방문 견적 요청
          </a>
        </div>
      </div>
    </div>
  );
}
