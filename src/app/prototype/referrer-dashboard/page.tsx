const summary = [
  { label: '유입 고객', value: '21', unit: '명' },
  { label: '진행 중', value: '14', unit: '명' },
  { label: '시공 완료', value: '3', unit: '건' },
  { label: '지급대상', value: '240,000', unit: '원' },
];

const customers = [
  { name: '김*지', status: '상담대기', agency: '강남 대리점', createdAt: '오늘', incentive: '진행중' },
  { name: '최*윤', status: '견적제출', agency: '강남 대리점', createdAt: '어제', incentive: '진행중' },
  { name: '한*호', status: '시공완료', agency: '강남 대리점', createdAt: '5월 18일', incentive: '지급대상' },
  { name: '윤*연', status: '시공완료', agency: '분당 대리점', createdAt: '5월 17일', incentive: '지급완료' },
];

export default function ReferrerDashboardPreviewPage() {
  const referralLink = 'http://localhost:3000/q/gangnam01/instaA12';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-md px-4 py-6">
        <header className="mb-6">
          <p className="mb-1 text-xs font-semibold text-gray-400">PREVIEW</p>
          <h1 className="text-2xl font-bold">추천인 대시보드</h1>
          <p className="mt-1 text-sm text-gray-500">instaA12 추천인</p>
        </header>

        <section className="mb-4 border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm font-bold text-yellow-800">내 추천 링크</p>
          <p className="mt-1 text-xs text-yellow-700">이 링크로 들어온 고객은 내 성과로 기록됩니다.</p>
          <div className="mt-3 flex items-center gap-2 bg-white p-2">
            <p className="flex-1 truncate text-xs text-gray-600">{referralLink}</p>
            <button className="bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">복사</button>
          </div>
        </section>

        <section className="mb-4 grid grid-cols-2 gap-3">
          {summary.map((item) => (
            <div key={item.label} className="border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="mt-1 text-2xl font-bold">
                {item.value}
                <span className="ml-1 text-sm font-normal text-gray-500">{item.unit}</span>
              </p>
            </div>
          ))}
        </section>

        <section className="mb-4 border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-bold">내 유입 고객</h2>
            <p className="mt-0.5 text-xs text-gray-500">개인정보는 제한적으로 표시됩니다.</p>
          </div>
          <div className="divide-y divide-gray-100">
            {customers.map((customer) => (
              <div key={`${customer.name}-${customer.createdAt}`} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{customer.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{customer.agency} · {customer.createdAt}</p>
                  </div>
                  <span className="shrink-0 bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                    {customer.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#b10000]">인센티브: {customer.incentive}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-bold">지급 기준</h2>
          <div className="mt-3 space-y-2 text-sm leading-6 text-gray-600">
            <p>시공 완료 후 본사 확인이 끝나면 지급대상이 됩니다.</p>
            <p>지급완료 처리는 본사 정산 후 반영됩니다.</p>
            <p>고객 개인정보 보호를 위해 연락처와 상세주소는 표시하지 않습니다.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
