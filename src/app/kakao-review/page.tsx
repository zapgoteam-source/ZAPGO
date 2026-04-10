export const metadata = {
  title: '서비스 화면 안내 | 에너지잡고',
};

export default function KakaoReviewPage() {
  return (
    <div className="max-w-md mx-auto px-6 py-12 text-sm text-gray-700">
      <h1 className="text-xl font-bold text-gray-900 mb-1">시공 신청</h1>
      <p className="text-xs text-gray-400 mb-8">
        카카오 로그인 시 연락처가 자동으로 입력됩니다.
      </p>

      {/* 필수 회원정보 */}
      <div className="mb-6">
        <div className="bg-gray-800 text-white text-xs font-semibold px-4 py-2 mb-0">
          필수 정보
        </div>
        <div className="border border-t-0 border-gray-200 px-4 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              disabled
              placeholder="홍길동"
              className="w-full px-3 py-2.5 border border-gray-200 text-sm bg-white text-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              연락처 <span className="text-red-500">*</span>
              <span className="ml-2 text-yellow-600 font-normal">카카오 로그인 시 자동 입력</span>
            </label>
            <input
              type="text"
              disabled
              placeholder="010-0000-0000"
              className="w-full px-3 py-2.5 border border-yellow-300 bg-yellow-50 text-sm text-gray-400"
            />
            <p className="text-xs text-yellow-600 mt-1">
              카카오 계정의 전화번호(선택 동의)가 자동으로 입력됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* 선택 정보 */}
      <div className="mb-8">
        <div className="bg-gray-400 text-white text-xs font-semibold px-4 py-2 mb-0">
          선택 정보
        </div>
        <div className="border border-t-0 border-gray-200 px-4 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">주소</label>
            <input
              type="text"
              disabled
              placeholder="시공 주소를 입력해주세요"
              className="w-full px-3 py-2.5 border border-gray-200 text-sm bg-white text-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">희망 시공일</label>
            <input
              type="text"
              disabled
              placeholder="예: 2026-05-10"
              className="w-full px-3 py-2.5 border border-gray-200 text-sm bg-white text-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">추가 요청사항</label>
            <textarea
              disabled
              placeholder="기타 요청사항을 입력해주세요"
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 text-sm bg-white text-gray-400 resize-none"
            />
          </div>
        </div>
      </div>

      <button
        disabled
        className="w-full py-4 bg-[#FEE500] text-[#191919] font-bold text-base opacity-50"
      >
        시공 신청하기
      </button>

      <p className="text-xs text-gray-400 mt-6 text-center">
        에너지잡고 · 창문 단열 셀프견적 서비스
      </p>
    </div>
  );
}
