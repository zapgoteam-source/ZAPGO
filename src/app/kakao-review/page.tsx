export const metadata = {
  title: '서비스 화면 안내 | 에너지잡고',
};

export default function KakaoReviewPage() {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-xl font-bold text-gray-900">시공 요청</h1>
        <p className="text-sm text-gray-500 mt-1">고객 정보를 입력해주세요</p>
      </div>

      {/* 견적 요약 */}
      <div className="mx-5 mb-4 bg-gray-50 p-4">
        <p className="text-sm text-gray-500 mb-1">예상 견적 금액</p>
        <p className="text-2xl font-bold text-gray-900">550,000원</p>
        <p className="text-xs text-gray-400">부가세 별도 · 참고용 금액</p>
      </div>

      <div className="flex-1 px-5 space-y-4">
        {/* 이름 */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            이름 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            disabled
            placeholder="홍길동"
            className="w-full py-3 px-4 border-2 border-gray-200 text-sm bg-white text-gray-400"
          />
        </div>

        {/* 연락처 - 카카오 자동입력 강조 */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            연락처 <span className="text-red-400">*</span>
          </label>
          <input
            type="tel"
            disabled
            placeholder="010-0000-0000"
            className="w-full py-3 px-4 border-2 border-yellow-300 bg-yellow-50 text-sm text-gray-400"
          />
          <p className="text-xs text-yellow-600 mt-1">
            카카오 로그인 시 카카오 계정의 전화번호가 자동으로 입력됩니다. (선택 동의)
          </p>
        </div>

        {/* 주소 */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">주소</label>
          <input
            type="text"
            disabled
            placeholder="시공 주소를 입력해주세요"
            className="w-full py-3 px-4 border-2 border-gray-200 text-sm bg-white text-gray-400"
          />
        </div>

        {/* 희망 시공일 */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">희망 시공일</label>
          <input
            type="date"
            disabled
            className="w-full py-3 px-4 border-2 border-gray-200 text-sm bg-white text-gray-400"
          />
        </div>

        {/* 추가 요청사항 */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">추가 요청사항</label>
          <textarea
            disabled
            placeholder="특이사항이나 요청사항을 입력해주세요"
            rows={3}
            className="w-full py-3 px-4 border-2 border-gray-200 text-sm bg-white text-gray-400 resize-none"
          />
        </div>

        {/* 마케팅 동의 */}
        <label className="flex items-start gap-3">
          <input type="checkbox" disabled className="mt-0.5 w-5 h-5 border-gray-300" />
          <span className="text-sm text-gray-600">마케팅 정보 수신에 동의합니다 (선택)</span>
        </label>
      </div>

      <div className="px-5 pb-6 pt-3 space-y-3 border-t border-gray-100 bg-white">
        <button
          disabled
          className="w-full py-4 bg-gray-900 text-white font-semibold text-base opacity-40"
        >
          시공 요청 제출
        </button>
        <div className="flex gap-2">
          <span className="flex-1 py-3 border border-gray-200 text-sm font-medium text-gray-600 text-center">
            📞 상담원 연결
          </span>
          <span className="flex-1 py-3 border border-gray-200 text-sm font-medium text-gray-600 text-center">
            방문 견적 요청
          </span>
        </div>
      </div>
    </div>
  );
}
