export const metadata = {
  title: '개인정보 처리방침 | 에너지잡고',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 text-sm text-gray-700 leading-relaxed">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">개인정보 처리방침</h1>
      <p className="text-gray-400 text-xs mb-8">시행일: 2026년 3월 31일 | 최종 수정일: 2026년 3월 31일</p>

      <p className="mb-6">
        에너지잡고(이하 &ldquo;회사&rdquo;)는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 및 관련
        법령을 준수합니다. 본 방침은 회사가 제공하는 창문 단열 셀프견적 서비스(이하
        &ldquo;서비스&rdquo;)에 적용됩니다.
      </p>

      {/* 1. 수집 항목 - 필수/선택 구분 명시 */}
      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">1. 수집하는 개인정보 항목 및 수집 방법</h2>
        <p className="mb-3">
          회사는 서비스 제공을 위해 아래와 같이 개인정보를 수집합니다. 각 항목의 수집
          조건(필수/선택)을 명확히 구분합니다.
        </p>

        <h3 className="text-sm font-bold text-gray-800 mb-2 mt-4">가. 회원가입 시 (카카오 로그인)</h3>
        <div className="overflow-x-auto mb-4">
          <table className="w-full border border-gray-300 text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left">수집 항목</th>
                <th className="border border-gray-300 px-3 py-2 text-left">수집 목적</th>
                <th className="border border-gray-300 px-3 py-2 text-center">필수/선택</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-2">이름</td>
                <td className="border border-gray-300 px-3 py-2">시공 요청 시 고객 식별 및 예약 자동 입력</td>
                <td className="border border-gray-300 px-3 py-2 text-center">필수</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2">카카오 계정 닉네임</td>
                <td className="border border-gray-300 px-3 py-2">회원 식별 및 서비스 내 표시</td>
                <td className="border border-gray-300 px-3 py-2 text-center">필수</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2">카카오 계정 전화번호</td>
                <td className="border border-gray-300 px-3 py-2">시공 일정 조율, 상담 연락 및 자동 입력</td>
                <td className="border border-gray-300 px-3 py-2 text-center">필수</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2">카카오 계정 프로필 이미지</td>
                <td className="border border-gray-300 px-3 py-2">서비스 내 프로필 표시</td>
                <td className="border border-gray-300 px-3 py-2 text-center">선택</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2">카카오 계정 이메일</td>
                <td className="border border-gray-300 px-3 py-2">계정 복구, 중요 안내 발송</td>
                <td className="border border-gray-300 px-3 py-2 text-center">선택</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2">카카오 고유 식별자(ID)</td>
                <td className="border border-gray-300 px-3 py-2">회원 고유 식별 및 중복 가입 방지</td>
                <td className="border border-gray-300 px-3 py-2 text-center">필수</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          * 카카오 로그인 시 카카오(주)가 제공하는 이름 및 전화번호를 수집하여 시공 요청 시
          자동 입력에 활용합니다. 이용자는 자동 입력된 정보를 직접 수정할 수 있습니다.
        </p>

        <h3 className="text-sm font-bold text-gray-800 mb-2 mt-4">나. 시공 견적 요청 시 (이용자 직접 입력)</h3>
        <div className="overflow-x-auto mb-4">
          <table className="w-full border border-gray-300 text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left">수집 항목</th>
                <th className="border border-gray-300 px-3 py-2 text-left">수집 목적</th>
                <th className="border border-gray-300 px-3 py-2 text-center">필수/선택</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-2">이름</td>
                <td className="border border-gray-300 px-3 py-2">시공 예약 및 고객 식별</td>
                <td className="border border-gray-300 px-3 py-2 text-center">필수</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2">전화번호</td>
                <td className="border border-gray-300 px-3 py-2">시공 일정 조율 및 상담 연락</td>
                <td className="border border-gray-300 px-3 py-2 text-center">필수</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2">주소</td>
                <td className="border border-gray-300 px-3 py-2">시공 장소 확인 및 방문 견적</td>
                <td className="border border-gray-300 px-3 py-2 text-center">선택</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2">희망 시공일</td>
                <td className="border border-gray-300 px-3 py-2">시공 일정 조율</td>
                <td className="border border-gray-300 px-3 py-2 text-center">선택</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2">추가 요청사항</td>
                <td className="border border-gray-300 px-3 py-2">고객 요청 반영</td>
                <td className="border border-gray-300 px-3 py-2 text-center">선택</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          * 시공 견적 요청 시 수집하는 이름, 전화번호, 주소는 카카오 로그인과 별도로 이용자가
          직접 입력하는 정보입니다.
        </p>

        <h3 className="text-sm font-bold text-gray-800 mb-2 mt-4">다. 서비스 이용 과정에서 자동 수집</h3>
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left">수집 항목</th>
                <th className="border border-gray-300 px-3 py-2 text-left">수집 목적</th>
                <th className="border border-gray-300 px-3 py-2 text-center">필수/선택</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-2">접속 로그, 접속 IP, 기기 정보</td>
                <td className="border border-gray-300 px-3 py-2">서비스 안정성 확보 및 부정 이용 방지</td>
                <td className="border border-gray-300 px-3 py-2 text-center">필수</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2">견적 내역 (창문 정보, 설문 응답)</td>
                <td className="border border-gray-300 px-3 py-2">견적 서비스 제공 및 이력 관리</td>
                <td className="border border-gray-300 px-3 py-2 text-center">필수</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. 수집 이용 목적 */}
      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">2. 개인정보 수집 및 이용 목적</h2>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong>회원 관리:</strong> 카카오 로그인을 통한 회원 식별, 가입 및 탈퇴 처리</li>
          <li><strong>서비스 제공:</strong> 창문 단열 셀프견적 계산, 시공 요청 접수 및 처리</li>
          <li><strong>고객 상담:</strong> 시공 관련 상담, 일정 조율, 불만 처리</li>
          <li><strong>서비스 개선:</strong> 이용 통계 분석, 서비스 품질 향상</li>
          <li><strong>마케팅 (선택 동의 시):</strong> 이벤트, 프로모션 안내</li>
        </ul>
      </section>

      {/* 3. 보유 기간 */}
      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">3. 개인정보 보유 및 이용 기간</h2>
        <p className="mb-2">
          회원 탈퇴 시 지체 없이 파기합니다. 단, 관련 법령에 따라 아래 기간 동안 보존합니다.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left">보존 항목</th>
                <th className="border border-gray-300 px-3 py-2 text-left">보존 근거</th>
                <th className="border border-gray-300 px-3 py-2 text-center">보존 기간</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-2">계약 및 청약철회 기록</td>
                <td className="border border-gray-300 px-3 py-2">전자상거래법</td>
                <td className="border border-gray-300 px-3 py-2 text-center">5년</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2">소비자 불만 및 분쟁처리 기록</td>
                <td className="border border-gray-300 px-3 py-2">전자상거래법</td>
                <td className="border border-gray-300 px-3 py-2 text-center">3년</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2">접속 로그</td>
                <td className="border border-gray-300 px-3 py-2">통신비밀보호법</td>
                <td className="border border-gray-300 px-3 py-2 text-center">3개월</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. 제3자 제공 */}
      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">4. 개인정보 제3자 제공</h2>
        <p>
          회사는 이용자의 사전 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 단, 법령에 의한
          요청이 있는 경우는 예외로 합니다.
        </p>
      </section>

      {/* 5. 처리 위탁 - 카카오 명시 강화 */}
      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">5. 개인정보 처리 위탁</h2>
        <p className="mb-3">
          회사는 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리를 위탁하고 있습니다.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left">수탁 업체</th>
                <th className="border border-gray-300 px-3 py-2 text-left">위탁 업무 내용</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-2">카카오(주)</td>
                <td className="border border-gray-300 px-3 py-2">
                  카카오싱크를 통한 소셜 로그인 서비스 제공 (카카오 계정 인증, 이름·닉네임·전화번호·프로필
                  이미지·이메일 정보 전달)
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2">Supabase Inc.</td>
                <td className="border border-gray-300 px-3 py-2">
                  클라우드 데이터베이스 운영 및 사용자 인증 서비스 제공
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          위탁 계약 시 개인정보 보호 관련 법규 준수, 비밀 유지, 제3자 제공 금지, 사고 시
          책임 부담, 위탁 기간 종료 후 개인정보 반환·파기 의무 등을 규정하고 있습니다.
        </p>
      </section>

      {/* 6. 파기 */}
      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">6. 개인정보 파기 절차 및 방법</h2>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>
            <strong>파기 절차:</strong> 보유 기간이 경과하거나 처리 목적이 달성된 경우 지체 없이
            파기합니다.
          </li>
          <li>
            <strong>파기 방법:</strong> 전자적 파일은 복구 불가능한 방법으로 삭제하며, 종이
            문서는 분쇄 또는 소각합니다.
          </li>
        </ul>
      </section>

      {/* 7. 이용자 권리 */}
      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">7. 이용자의 권리 및 행사 방법</h2>
        <p className="mb-2">이용자는 언제든지 아래 권리를 행사할 수 있습니다.</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>개인정보 열람, 정정, 삭제 요구</li>
          <li>개인정보 처리 정지 요구</li>
          <li>회원 탈퇴 (서비스 내 설정 또는 고객센터)</li>
          <li>동의 철회</li>
        </ul>
        <p className="mt-2">
          위 권리 행사는 서비스 내 설정 메뉴 또는 개인정보 보호책임자에게 이메일로 요청하실
          수 있으며, 지체 없이 처리하겠습니다.
        </p>
      </section>

      {/* 8. 안전성 확보 조치 */}
      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">8. 개인정보 안전성 확보 조치</h2>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>개인정보의 암호화 처리 (전송 시 SSL/TLS, 저장 시 암호화)</li>
          <li>접근 권한 관리 및 접근 통제</li>
          <li>개인정보 처리 시스템 접속 기록 보관</li>
          <li>보안 프로그램 설치 및 주기적 갱신</li>
        </ul>
      </section>

      {/* 9. 보호책임자 */}
      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">9. 개인정보 보호책임자</h2>
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-xs">
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-semibold w-28">
                  담당부서
                </td>
                <td className="border border-gray-300 px-3 py-2">에너지잡고 IT 부서</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-semibold">
                  이메일
                </td>
                <td className="border border-gray-300 px-3 py-2">zapgoteam@gmail.com</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          기타 개인정보 침해 관련 상담은 개인정보침해신고센터(118), 개인정보 분쟁조정위원회
          (1833-6972), 대검찰청 사이버수사과(1301), 경찰청 사이버안전국(182)에 문의하실 수
          있습니다.
        </p>
      </section>

      {/* 10. 방침 변경 */}
      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">10. 개인정보 처리방침 변경</h2>
        <p>
          본 방침이 변경될 경우 시행 7일 전부터 서비스 공지사항 또는 앱 내 알림을 통해
          안내드립니다. 변경된 방침은 공지한 시행일부터 효력이 발생합니다.
        </p>
      </section>

      <p className="text-xs text-gray-400 mt-10 border-t pt-6">
        에너지잡고 &middot; 대표: 고경욱 &middot; 사업자등록번호: 830-81-01433 &middot; 주소:
        경기도 화성시 동탄기흥로 565, 509호 (영천동, YK퍼스트타워)
      </p>
    </div>
  );
}
