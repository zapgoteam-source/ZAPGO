const recentCustomers = [
  {
    id: '1',
    name: '김민지',
    phone: '010-1234-5678',
    status: '상담대기',
    createdAt: '2026.05.20',
  },
  {
    id: '2',
    name: '박성훈',
    phone: '010-2244-9185',
    status: '견적확인',
    createdAt: '2026.05.19',
  },
  {
    id: '3',
    name: '이하나',
    phone: '010-8891-3302',
    status: '시공예약',
    createdAt: '2026.05.18',
  },
];

export default function AgencyDashboardPreviewPage() {
  const referralUrl = 'http://localhost:3000/q/gangnam01/gangnam01';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-md px-4 py-6">
        <div className="mb-6">
          <p className="mb-1 text-xs font-semibold text-gray-400">PREVIEW</p>
          <h1 className="text-xl font-bold text-gray-900">대리점 대시보드</h1>
          <p className="mt-0.5 text-sm text-gray-500">강남 대리점</p>
        </div>

        <div className="mb-4 border border-yellow-200 bg-yellow-50 p-4">
          <p className="mb-2 text-sm font-bold text-yellow-800">견적 링크</p>
          <p className="mb-2 text-xs text-yellow-700">고객에게 이 링크를 공유하세요</p>
          <div className="flex items-center gap-2 bg-white p-2">
            <p className="flex-1 truncate text-xs text-gray-600">{referralUrl}</p>
            <button className="bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
              복사
            </button>
          </div>
          <p className="mt-2 text-xs text-yellow-600">코드: gangnam01</p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">유입 고객</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              18<span className="ml-1 text-sm font-normal">명</span>
            </p>
          </div>
          <div className="border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">이번 달</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              7<span className="ml-1 text-sm font-normal">명</span>
            </p>
          </div>
        </div>

        <div className="border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-bold text-gray-800">최근 유입 고객</h2>
            <button className="text-xs text-blue-600">전체보기</button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentCustomers.map((customer) => (
              <div key={customer.id} className="px-4 py-3">
                <div className="flex justify-between gap-3">
                  <p className="text-sm font-medium text-gray-800">{customer.name}</p>
                  <span className="shrink-0 text-xs text-gray-400">{customer.createdAt}</span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  {customer.phone} · {customer.status}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 border border-gray-200 bg-white p-4">
          <p className="text-sm font-bold text-gray-800">다음에 붙일 운영 지표</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-50 p-3">
              <p className="text-xs text-gray-500">상담</p>
              <p className="mt-1 font-bold text-gray-900">11</p>
            </div>
            <div className="bg-gray-50 p-3">
              <p className="text-xs text-gray-500">시공</p>
              <p className="mt-1 font-bold text-gray-900">4</p>
            </div>
            <div className="bg-gray-50 p-3">
              <p className="text-xs text-gray-500">전환율</p>
              <p className="mt-1 font-bold text-gray-900">22%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
