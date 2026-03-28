'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEstimateStore } from '@/store/estimateStore';
import { MaterialType } from '@/types';

const MATERIAL_OPTIONS: { value: MaterialType; label: string; desc: string; pros: string[] }[] = [
  {
    value: 'FABRIC',
    label: '패브릭씰러',
    desc: '고성능 단열 자재',
    pros: ['단열 효과 탁월', '소음 차단', '외풍 완전 차단'],
  },
  {
    value: 'MOHAIR',
    label: '일반모헤어',
    desc: '표준 창틀 보수 자재',
    pros: ['경제적인 가격', '간단한 시공', '기본 단열 효과'],
  },
];

export default function HouseInfoPage() {
  const router = useRouter();
  const { housingAreaPyeong, materialType, setHousingArea, setMaterialType } = useEstimateStore();

  const [pyeong, setPyeong] = useState<string>(
    housingAreaPyeong !== null ? String(housingAreaPyeong) : ''
  );
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType>(materialType);

  const pyeongNum = parseFloat(pyeong);
  const isValid = !isNaN(pyeongNum) && pyeongNum > 0;

  const handleNext = () => {
    if (!isValid) return;
    setHousingArea(pyeongNum);
    setMaterialType(selectedMaterial);
    router.push('/windows');
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-4">
        <button
          onClick={() => router.back()}
          className="text-gray-400 text-sm mb-3 flex items-center gap-1"
        >
          ← 뒤로
        </button>
        <p className="text-xs text-gray-400 mb-1">STEP 2 / 4</p>
        <h1 className="text-xl font-bold text-gray-900">주택 정보 입력</h1>
        <p className="text-sm text-gray-500 mt-1">평형과 시공 자재를 선택해주세요</p>
      </div>

      <div className="flex-1 px-5 space-y-6">
        {/* 평형 입력 */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            평형 입력 <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={pyeong}
              onChange={(e) => setPyeong(e.target.value)}
              placeholder="예: 25"
              min="1"
              max="200"
              className="w-full py-4 px-4 pr-12 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-gray-900 transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              평
            </span>
          </div>
          {pyeong && !isValid && (
            <p className="text-xs text-red-500 mt-1">올바른 평형을 입력해주세요 (1평 이상)</p>
          )}
          {isValid && pyeongNum >= 60 && (
            <div className="mt-2 bg-orange-50 rounded-lg p-2">
              <p className="text-xs text-orange-600">60평 이상은 작업 인원 5명이 기본 배정됩니다</p>
            </div>
          )}
        </div>

        {/* 자재 선택 */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            시공 자재 선택 <span className="text-red-400">*</span>
          </label>
          <div className="space-y-3">
            {MATERIAL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedMaterial(opt.value)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedMaterial === opt.value
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{opt.label}</span>
                  {selectedMaterial === opt.value && (
                    <span className="text-xs bg-white text-gray-900 px-2 py-0.5 rounded-full font-medium">
                      선택됨
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs mb-2 ${
                    selectedMaterial === opt.value ? 'text-gray-300' : 'text-gray-500'
                  }`}
                >
                  {opt.desc}
                </p>
                <ul className="space-y-0.5">
                  {opt.pros.map((pro, i) => (
                    <li
                      key={i}
                      className={`text-xs flex items-center gap-1 ${
                        selectedMaterial === opt.value ? 'text-gray-300' : 'text-gray-500'
                      }`}
                    >
                      <span>✓</span> {pro}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-xs text-blue-700">
            💡 패브릭씰러와 일반모헤어는 한 현장에서 혼합 사용하지 않습니다.
            <br />
            창별로 탈거 4면 시공과 측면 시공은 혼합 가능합니다.
          </p>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="px-5 pb-6 pt-3 space-y-3 border-t border-gray-100 bg-white">
        <button
          onClick={handleNext}
          disabled={!isValid}
          className="w-full py-4 bg-gray-900 text-white font-semibold rounded-xl text-base disabled:opacity-40 hover:bg-gray-800 transition-colors"
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
