'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEstimateStore } from '@/store/estimateStore';

const PREMIUM_PROTECTION_PRICE = 80000;
const PEST_SCREEN_UNIT_PRICE = 23000;

export default function HouseInfoPage() {
  const router = useRouter();
  const {
    housingAreaPyeong,
    windowSashCount,
    premiumProtection,
    pestSolution,
    pestScreenCount,
    setHousingArea,
    setWindowSashCount,
    setPremiumProtection,
    setPestSolution,
    setPestScreenCount,
  } = useEstimateStore();

  const [pyeong, setPyeong] = useState<string>(
    housingAreaPyeong !== null ? String(housingAreaPyeong) : ''
  );
  const [sashCount, setSashCount] = useState<string>(
    windowSashCount !== null ? String(windowSashCount) : ''
  );

  const pyeongNum = parseFloat(pyeong);
  const sashNum = parseInt(sashCount, 10);
  const isPyeongValid = !isNaN(pyeongNum) && pyeongNum > 0;
  const isSashValid = !isNaN(sashNum) && sashNum > 0;
  const isValid = isPyeongValid && isSashValid;

  const handleNext = () => {
    if (!isValid) return;
    setHousingArea(pyeongNum);
    setWindowSashCount(sashNum);
    router.push('/estimate');
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-4">
        <button onClick={() => router.back()} className="text-gray-400 text-sm mb-3 flex items-center gap-1">
          ← 뒤로
        </button>
        <p className="text-xs text-gray-400 mb-1">STEP 2 / 3</p>
        <h1 className="text-xl font-bold text-gray-900">주택 정보 입력</h1>
        <p className="text-sm text-gray-500 mt-1">평형과 창짝 정보를 입력해주세요</p>
      </div>

      <div className="flex-1 px-5 space-y-7 pb-4">

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
              className="w-full py-4 px-4 pr-12 border-2 border-gray-200 text-base focus:outline-none focus:border-gray-900 transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">평</span>
          </div>
          {pyeong && !isPyeongValid && (
            <p className="text-xs text-red-500 mt-1">올바른 평형을 입력해주세요 (1평 이상)</p>
          )}
          {isPyeongValid && pyeongNum >= 60 && (
            <div className="mt-2 bg-orange-50 p-2">
              <p className="text-xs text-orange-600">60평 이상은 작업 인원 5명이 기본 배정됩니다</p>
            </div>
          )}
        </div>

        {/* 창짝 수 입력 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-800">
              창짝 수 입력 <span className="text-red-400">*</span>
            </label>
            {/* 추후 영상 링크 제공 예정 */}
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1">
              창짝이란? 영상 준비 중
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              value={sashCount}
              onChange={(e) => setSashCount(e.target.value)}
              placeholder="예: 10"
              min="1"
              className="w-full py-4 px-4 pr-12 border-2 border-gray-200 text-base focus:outline-none focus:border-gray-900 transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">짝</span>
          </div>
          {sashCount && !isSashValid && (
            <p className="text-xs text-red-500 mt-1">올바른 창짝 수를 입력해주세요 (1 이상)</p>
          )}
          <p className="text-xs text-gray-400 mt-1.5">창문 하나에 여닫이 패널 개수를 모두 더한 총 개수입니다</p>
        </div>

        {/* 추가 옵션 */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">추가 옵션</label>
          <div className="space-y-3">

            {/* 프리미엄 보양 */}
            <button
              type="button"
              onClick={() => setPremiumProtection(!premiumProtection)}
              className={`w-full text-left p-4 border-2 transition-all ${
                premiumProtection
                  ? 'border-[#b10000] bg-white text-gray-900'
                  : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">프리미엄 보양</p>
                  <p className="text-xs mt-0.5 text-gray-500">
                    고급 보양재로 시공 중 오염·스크래치 완벽 방지
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className={`text-sm font-bold ${premiumProtection ? 'text-[#b10000]' : 'text-gray-700'}`}>
                    +{PREMIUM_PROTECTION_PRICE.toLocaleString()}원
                  </p>
                  <p className="text-xs mt-0.5 text-gray-400">1회</p>
                </div>
              </div>
            </button>

            {/* 방충솔루션 */}
            <div className={`border-2 transition-all ${pestSolution ? 'border-[#b10000]' : 'border-gray-200'}`}>
              <button
                type="button"
                onClick={() => setPestSolution(!pestSolution)}
                className="w-full text-left p-4 bg-white text-gray-800 hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">방충솔루션</p>
                    <p className="text-xs mt-0.5 text-gray-500">
                      방충망 틈새 차단으로 벌레 유입 원천 방지
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className={`text-sm font-bold ${pestSolution ? 'text-[#b10000]' : 'text-gray-700'}`}>
                      +{PEST_SCREEN_UNIT_PRICE.toLocaleString()}원
                    </p>
                    <p className="text-xs mt-0.5 text-gray-400">방충망 1개당</p>
                  </div>
                </div>
              </button>

              {/* 방충망 수량 입력 (방충솔루션 선택 시 노출) */}
              {pestSolution && (
                <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2 pt-3">방충망 수량을 입력해주세요</p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPestScreenCount(Math.max(1, pestScreenCount - 1))}
                      className="w-10 h-10 border border-gray-300 text-gray-700 text-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center text-gray-900 font-bold text-lg">
                      {pestScreenCount}개
                    </span>
                    <button
                      type="button"
                      onClick={() => setPestScreenCount(pestScreenCount + 1)}
                      className="w-10 h-10 border border-gray-300 text-gray-700 text-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      +
                    </button>
                  </div>

                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="px-5 pb-6 pt-3 space-y-3 border-t border-gray-100 bg-white">
        <button
          onClick={handleNext}
          disabled={!isValid}
          className="w-full py-4 bg-gray-900 text-white font-semibold text-base disabled:opacity-40 hover:bg-gray-800 transition-colors"
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
