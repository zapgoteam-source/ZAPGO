export const metadata = {
  title: '개인정보 처리방침 | 에너지잡고',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 text-sm text-gray-700 leading-relaxed">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">개인정보 처리방침</h1>
      <p className="text-gray-400 text-xs mb-8">시행일: 2025년 1월 1일</p>

      <p className="mb-6">
        에너지잡고(이하 "회사")는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 등 관련 법령을
        준수합니다. 본 방침은 회사가 제공하는 창문 단열 셀프견적 서비스(이하 "서비스")에 적용됩니다.
      </p>

      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">1. 수집하는 개인정보 항목</h2>
        <p className="mb-2">회사는 서비스 제공을 위해 아래 정보를 수집합니다.</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>카카오 계정 정보: 닉네임, 프로필 사진, 카카오 고유 식별자</li>
          <li>연락처: 전화번호 (서비스 이용 중 직접 입력 시)</li>
          <li>서비스 이용 기록: 견적 내역, 접속 로그</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">2. 개인정보 수집·이용 목적</h2>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>회원 식별 및 가입·탈퇴 처리</li>
          <li>창문 단열 견적 서비스 제공</li>
          <li>고객 상담 및 불만 처리</li>
          <li>서비스 개선을 위한 통계 분석</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">3. 개인정보 보유·이용 기간</h2>
        <p>
          회원 탈퇴 시까지 보유합니다. 단, 관련 법령에 따라 일정 기간 보존이 필요한 경우 해당
          기간 동안 보유합니다.
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2 mt-2">
          <li>전자상거래 계약·청약철회 기록: 5년 (전자상거래법)</li>
          <li>소비자 불만·분쟁처리 기록: 3년 (전자상거래법)</li>
          <li>접속 로그: 3개월 (통신비밀보호법)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">4. 개인정보 제3자 제공</h2>
        <p>
          회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 단, 법령에 의한 경우는
          예외로 합니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">5. 개인정보 처리 위탁</h2>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Supabase Inc.: 데이터베이스 및 인증 서비스 운영</li>
          <li>카카오(주): 소셜 로그인(카카오싱크) 서비스 제공</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">6. 이용자의 권리</h2>
        <p>이용자는 언제든지 아래 권리를 행사할 수 있습니다.</p>
        <ul className="list-disc list-inside space-y-1 pl-2 mt-2">
          <li>개인정보 열람, 정정, 삭제 요구</li>
          <li>개인정보 처리 정지 요구</li>
          <li>회원 탈퇴</li>
        </ul>
        <p className="mt-2">
          위 권리 행사는 설정 메뉴 또는 고객센터를 통해 요청하실 수 있습니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">7. 개인정보 보호책임자</h2>
        <ul className="space-y-1 pl-2">
          <li>책임자: 에너지잡고 개인정보보호팀</li>
          <li>이메일: privacy@energyjabgo.com</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">8. 개인정보 처리방침 변경</h2>
        <p>
          본 방침이 변경될 경우 시행 7일 전부터 서비스 공지사항을 통해 안내드립니다.
        </p>
      </section>

      <p className="text-xs text-gray-400 mt-10 border-t pt-6">
        에너지잡고 · 대표: OOO · 사업자등록번호: 000-00-00000 · 주소: 서울특별시 OO구
      </p>
    </div>
  );
}
