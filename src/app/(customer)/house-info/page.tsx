'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEstimateStore } from '@/store/estimateStore';
import PageTransition from '@/components/PageTransition';
import ConsultCTABar from '@/components/ConsultCTABar';

export default function HouseInfoPage() {
  const router = useRouter();
  const {
    housingAreaPyeong,
    windowSashCount,
    setHousingArea,
    setWindowSashCount,
  } = useEstimateStore();

  const [pyeong, setPyeong] = useState<string>(
    housingAreaPyeong !== null ? String(housingAreaPyeong) : ''
  );
  const [sashCount, setSashCount] = useState<string>(
    windowSashCount !== null ? String(windowSashCount) : ''
  );
  const [showVideoModal, setShowVideoModal] = useState(false);

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
    <PageTransition>
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <button onClick={() => router.back()} className="text-gray-400 text-sm flex items-center gap-1">
            ← 뒤로
          </button>
          <img src="/LOGO_BK.webp" alt="에너지잡고" className="w-10 h-10 object-contain flex-shrink-0" />
        </div>
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

        {/* 창짝 개수 입력 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-800">
              창짝 개수 입력 <span className="text-red-400">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowVideoModal(true)}
              className="text-xs text-blue-600 bg-blue-50 px-2 py-1 hover:bg-blue-100 transition-colors"
            >
              개수 세는 방법 보기 ▶
            </button>
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
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">개</span>
          </div>
          {sashCount && !isSashValid && (
            <p className="text-xs text-red-500 mt-1">올바른 창짝 개수를 입력해주세요 (1 이상)</p>
          )}
          <p className="text-xs text-gray-400 mt-1.5">유리창 한 판 한 판의 총 수량을 적어주세요</p>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="px-5 pb-6 pt-3 space-y-3 border-t border-gray-100 bg-white">
        <button
          onClick={handleNext}
          disabled={!isValid}
          className="w-full py-4 bg-[#b10000] text-white font-semibold text-base disabled:opacity-40 hover:bg-[#8b0000] transition-colors"
        >
          예상 견적 보기
        </button>
        <ConsultCTABar page3Colors />
      </div>

      {/* 창짝 영상 모달 */}
      {showVideoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setShowVideoModal(false)}
        >
          <div
            className="relative w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute -top-10 right-0 text-white text-sm font-medium"
            >
              닫기 ✕
            </button>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/mxnY3c9pPrc?autoplay=1"
                title="개수 세는 방법 보기"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
    </PageTransition>
  );
}
