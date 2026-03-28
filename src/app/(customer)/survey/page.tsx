'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEstimateStore } from '@/store/estimateStore';
import { SurveyAnswers, SurveyLevel } from '@/types';

const SURVEY_QUESTIONS = [
  { key: 'heating_cost' as const, label: '냉난방비', icon: '🌡️', desc: '냉난방비가 많이 나오시나요?' },
  { key: 'draft' as const, label: '외풍유입', icon: '💨', desc: '창문 주변으로 외풍이 들어오시나요?' },
  { key: 'dust' as const, label: '먼지날림', icon: '🌫️', desc: '창틀 주변에 먼지가 많이 쌓이나요?' },
  { key: 'bug' as const, label: '벌레유입', icon: '🐛', desc: '창문으로 벌레가 들어오시나요?' },
  { key: 'noise' as const, label: '소음유입', icon: '🔊', desc: '외부 소음이 많이 들리시나요?' },
  { key: 'odor' as const, label: '악취유입', icon: '🌀', desc: '외부 냄새가 들어오시나요?' },
];

const LEVEL_OPTIONS: { value: SurveyLevel; label: string; color: string }[] = [
  { value: 0, label: '전혀없음', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  { value: 1, label: '약간있음', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { value: 2, label: '심함', color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { value: 3, label: '매우심함', color: 'bg-red-50 text-red-600 border-red-200' },
];

export default function SurveyPage() {
  const router = useRouter();
  const { setSurvey, recommendations } = useEstimateStore();

  const [answers, setAnswers] = useState<SurveyAnswers>({
    heating_cost: null,
    draft: null,
    dust: null,
    bug: null,
    noise: null,
    odor: null,
  });

  const allAnswered = Object.values(answers).every((v) => v !== null);

  const handleSelect = (key: keyof SurveyAnswers, value: SurveyLevel) => {
    const updated = { ...answers, [key]: value };
    setAnswers(updated);
    // 실시간으로 store에 반영 (추천 계산용)
    setSurvey(updated);
  };

  const handleNext = () => {
    if (!allAnswered) return;
    setSurvey(answers);
    router.push('/house-info');
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-4">
        <p className="text-xs text-gray-400 mb-1">STEP 1 / 4</p>
        <h1 className="text-xl font-bold text-gray-900">문제 진단 설문</h1>
        <p className="text-sm text-gray-500 mt-1">현재 창문 상태를 알려주세요</p>
      </div>

      {/* 설문 항목 */}
      <div className="flex-1 px-5 space-y-5 pb-4">
        {SURVEY_QUESTIONS.map((q) => (
          <div key={q.key} className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{q.icon}</span>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{q.label}</p>
                <p className="text-xs text-gray-500">{q.desc}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {LEVEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(q.key, opt.value)}
                  className={`py-2 px-1 rounded-lg border text-xs font-medium transition-all ${
                    answers[q.key] === opt.value
                      ? 'ring-2 ring-offset-1 ring-gray-900 ' + opt.color
                      : opt.color + ' opacity-70'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* 추천 표시 */}
        {allAnswered && recommendations.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
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
          disabled={!allAnswered}
          className="w-full py-4 bg-gray-900 text-white font-semibold rounded-xl text-base disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
        >
          다음
        </button>
        <div className="flex gap-2">
          <a
            href="tel:0000000000"
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 text-center hover:bg-gray-50"
          >
            📞 상담원 연결
          </a>
          <a
            href="/visit-request"
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 text-center hover:bg-gray-50"
          >
            방문 견적 요청
          </a>
        </div>
      </div>
    </div>
  );
}
