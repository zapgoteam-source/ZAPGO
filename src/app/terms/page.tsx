export const metadata = {
  title: '서비스 이용약관 | 에너지잡고',
};

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 text-sm text-gray-700 leading-relaxed">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">서비스 이용약관</h1>
      <p className="text-gray-400 text-xs mb-8">시행일: 2025년 1월 1일</p>

      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">제1조 (목적)</h2>
        <p>
          이 약관은 에너지잡고(이하 "회사")가 제공하는 창문 단열 셀프견적 서비스(이하 "서비스")의
          이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">제2조 (정의)</h2>
        <ul className="space-y-2 pl-2">
          <li>① "서비스"란 회사가 제공하는 창문 단열 셀프견적 및 관련 서비스를 말합니다.</li>
          <li>② "이용자"란 본 약관에 동의하고 서비스를 이용하는 자를 말합니다.</li>
          <li>③ "회원"이란 카카오 계정으로 회원가입하여 서비스를 이용하는 자를 말합니다.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">제3조 (약관의 효력 및 변경)</h2>
        <ul className="space-y-2 pl-2">
          <li>① 본 약관은 서비스를 이용하는 모든 이용자에게 적용됩니다.</li>
          <li>
            ② 회사는 관련 법령에 위반하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 7일
            전에 공지합니다.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">제4조 (회원가입)</h2>
        <ul className="space-y-2 pl-2">
          <li>① 이용자는 카카오 계정을 통해 회원가입할 수 있습니다.</li>
          <li>② 회사는 회원가입 신청을 수락함을 원칙으로 하나, 아래 사유에 해당하는 경우 거절할 수 있습니다.</li>
          <li className="pl-4">- 타인 명의 또는 허위 정보로 신청한 경우</li>
          <li className="pl-4">- 관련 법령에 위반하는 경우</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">제5조 (서비스 이용)</h2>
        <ul className="space-y-2 pl-2">
          <li>① 서비스는 연중무휴 24시간 제공을 원칙으로 합니다.</li>
          <li>
            ② 회사는 시스템 점검, 장애 등 불가피한 사유로 서비스를 일시 중단할 수 있으며, 이 경우
            사전에 공지합니다.
          </li>
          <li>③ 서비스에서 제공되는 견적은 참고용이며, 실제 시공 비용과 차이가 있을 수 있습니다.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">제6조 (이용자의 의무)</h2>
        <ul className="space-y-2 pl-2">
          <li>① 이용자는 타인의 계정을 무단으로 사용하여서는 안 됩니다.</li>
          <li>② 이용자는 서비스를 통해 허위 정보를 유포하거나 타인의 권리를 침해하여서는 안 됩니다.</li>
          <li>③ 이용자는 서비스를 상업적 목적으로 무단 이용하여서는 안 됩니다.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">제7조 (회원 탈퇴 및 자격 상실)</h2>
        <ul className="space-y-2 pl-2">
          <li>① 회원은 언제든지 서비스 내 설정 메뉴를 통해 탈퇴를 요청할 수 있습니다.</li>
          <li>
            ② 회사는 회원이 본 약관을 위반한 경우 사전 통보 없이 서비스 이용을 제한할 수 있습니다.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">제8조 (면책 조항)</h2>
        <ul className="space-y-2 pl-2">
          <li>① 회사는 천재지변, 불가항력으로 인한 서비스 제공 불능에 대해 책임을 지지 않습니다.</li>
          <li>② 서비스 내 견적 정보는 참고용이며, 이를 근거로 한 시공 계약에 대해 회사는 책임을 지지 않습니다.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">제9조 (분쟁 해결)</h2>
        <p>
          서비스 이용과 관련한 분쟁은 회사 소재지를 관할하는 법원을 전속 관할 법원으로 합니다.
        </p>
      </section>

      <p className="text-xs text-gray-400 mt-10 border-t pt-6">
        에너지잡고 · 대표: OOO · 사업자등록번호: 000-00-00000 · 주소: 서울특별시 OO구
      </p>
    </div>
  );
}
