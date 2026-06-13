'use client';

import { useMemo, useState } from 'react';

type MetricKey = 'leads' | 'consultPending' | 'scheduled' | 'completed' | 'revenue';
type ActionKey = 'links' | 'unanswered' | 'settlement';
type AgencyCode = 'gangnam01' | 'songpa02' | 'bundang03' | 'ilsan04';

const summaryCards: Array<{ key: MetricKey; label: string; value: string; unit: string; tone: string }> = [
  { key: 'leads', label: '전체 유입', value: '128', unit: '명', tone: 'text-gray-900' },
  { key: 'consultPending', label: '상담 대기', value: '34', unit: '건', tone: 'text-amber-700' },
  { key: 'scheduled', label: '시공 예약', value: '17', unit: '건', tone: 'text-blue-700' },
  { key: 'completed', label: '시공 완료', value: '9', unit: '건', tone: 'text-emerald-700' },
  { key: 'revenue', label: '이번 달 예상 매출', value: '18,600,000', unit: '원', tone: 'text-[#b10000]' },
];

const agencies = [
  {
    name: '강남 대리점',
    code: 'gangnam01' as AgencyCode,
    leads: 42,
    consults: 31,
    scheduled: 12,
    completed: 8,
    conversion: '19%',
    revenue: '12,400,000원',
    pending: 3,
    lastLead: '오늘',
    status: '정상',
    statusTone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    name: '송파 대리점',
    code: 'songpa02' as AgencyCode,
    leads: 18,
    consults: 5,
    scheduled: 1,
    completed: 0,
    conversion: '0%',
    revenue: '0원',
    pending: 7,
    lastLead: '2일 전',
    status: '주의',
    statusTone: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    name: '분당 대리점',
    code: 'bundang03' as AgencyCode,
    leads: 25,
    consults: 16,
    scheduled: 6,
    completed: 4,
    conversion: '16%',
    revenue: '6,200,000원',
    pending: 2,
    lastLead: '오늘',
    status: '정상',
    statusTone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    name: '일산 대리점',
    code: 'ilsan04' as AgencyCode,
    leads: 6,
    consults: 1,
    scheduled: 0,
    completed: 0,
    conversion: '0%',
    revenue: '0원',
    pending: 1,
    lastLead: '14일 전',
    status: '비활성',
    statusTone: 'bg-gray-100 text-gray-600 border-gray-200',
  },
];

const alerts = [
  { title: '송파 대리점', body: '미응대 고객 7명, 상담 전환율이 낮습니다.', severity: '주의' },
  { title: '일산 대리점', body: '최근 14일 동안 신규 유입이 없습니다.', severity: '비활성' },
  { title: '강남 대리점', body: '시공완료 2건의 정산 확인이 필요합니다.', severity: '정산' },
];

const recentLeads = [
  { name: '김민지', phone: '010-1234-5678', agency: '강남 대리점', referrer: 'gangnam01', status: '상담대기', createdAt: '오늘 14:20' },
  { name: '박성훈', phone: '010-2244-9185', agency: '송파 대리점', referrer: 'blogger777', status: '신규유입', createdAt: '오늘 11:05' },
  { name: '이하나', phone: '010-8891-3302', agency: '분당 대리점', referrer: 'bundang03', status: '시공예약', createdAt: '어제 17:44' },
  { name: '최도윤', phone: '010-9077-4211', agency: '강남 대리점', referrer: 'instaA12', status: '견적확인', createdAt: '어제 09:31' },
];

const metricDetails: Record<MetricKey, {
  title: string;
  description: string;
  rows: Array<{ primary: string; secondary: string; agency: string; status: string; amount?: string; date: string }>;
}> = {
  leads: {
    title: '전체 유입 상세',
    description: '이번 달 대리점/추천인 링크로 접수된 전체 고객입니다.',
    rows: [
      { primary: '김민지', secondary: '010-1234-5678 · gangnam01', agency: '강남 대리점', status: '상담대기', date: '오늘 14:20' },
      { primary: '박성훈', secondary: '010-2244-9185 · blogger777', agency: '송파 대리점', status: '신규유입', date: '오늘 11:05' },
      { primary: '최도윤', secondary: '010-9077-4211 · instaA12', agency: '강남 대리점', status: '견적확인', date: '어제 09:31' },
    ],
  },
  consultPending: {
    title: '상담 대기 상세',
    description: '상담 신청 또는 링크 발송 후 아직 담당자가 처리하지 않은 고객입니다.',
    rows: [
      { primary: '김민지', secondary: '맞춤 견적 링크 확인 후 상담 요청', agency: '강남 대리점', status: '상담대기', date: '오늘 14:20' },
      { primary: '박성훈', secondary: '유입 후 6시간 미응대', agency: '송파 대리점', status: '신규유입', date: '오늘 11:05' },
      { primary: '오세진', secondary: '유입 후 3일 미응대', agency: '송파 대리점', status: '상담대기', date: '3일 전' },
    ],
  },
  scheduled: {
    title: '시공 예약 상세',
    description: '시공일이 잡힌 고객입니다. 현장팀 배정 여부를 함께 확인합니다.',
    rows: [
      { primary: '이하나', secondary: '5월 24일 오전 · 김팀장 배정', agency: '분당 대리점', status: '시공예약', amount: '1,540,000원', date: '어제 17:44' },
      { primary: '장유진', secondary: '5월 27일 오후 · 배정 대기', agency: '강남 대리점', status: '시공예약', amount: '2,280,000원', date: '2일 전' },
    ],
  },
  completed: {
    title: '시공 완료 상세',
    description: '이번 달 시공 완료 처리된 건입니다. 정산 확인 여부를 같이 봅니다.',
    rows: [
      { primary: '한지호', secondary: '정산 확인 필요', agency: '강남 대리점', status: '시공완료', amount: '1,860,000원', date: '5월 18일' },
      { primary: '윤서연', secondary: '정산 완료', agency: '분당 대리점', status: '시공완료', amount: '1,320,000원', date: '5월 17일' },
    ],
  },
  revenue: {
    title: '예상 매출 상세',
    description: '시공 예약과 완료 건을 기준으로 본 이번 달 예상 매출입니다.',
    rows: [
      { primary: '강남 대리점', secondary: '예약 12건 · 완료 8건', agency: 'gangnam01', status: '정상', amount: '12,400,000원', date: '이번 달' },
      { primary: '분당 대리점', secondary: '예약 6건 · 완료 4건', agency: 'bundang03', status: '정상', amount: '6,200,000원', date: '이번 달' },
    ],
  },
};

const agencyDetails: Record<AgencyCode, {
  owner: string;
  email: string;
  phone: string;
  link: string;
  royalty: string;
  settlement: string;
  memo: string;
  referrers: Array<{ code: string; leads: number; completed: number; incentive: string; status: string }>;
  pendingCustomers: Array<{ name: string; status: string; elapsed: string }>;
}> = {
  gangnam01: {
    owner: '정대리',
    email: 'gangnam.owner@example.com',
    phone: '010-7711-2200',
    link: '/q/gangnam01/gangnam01',
    royalty: '월 매출 8%',
    settlement: '시공완료 2건 확인 필요',
    memo: '유입과 시공 전환 모두 양호. 인스타 추천인 성과를 별도 추적하면 좋음.',
    referrers: [
      { code: 'gangnam01', leads: 28, completed: 6, incentive: '해당 없음', status: '대리점 자체' },
      { code: 'instaA12', leads: 9, completed: 2, incentive: '160,000원', status: '지급대상' },
      { code: 'aptCafe7', leads: 5, completed: 0, incentive: '0원', status: '진행중' },
    ],
    pendingCustomers: [
      { name: '문가영', status: '담당자 미배정', elapsed: '1일' },
      { name: '김민지', status: '상담대기', elapsed: '3시간' },
      { name: '서지훈', status: '견적 확인 요청', elapsed: '6시간' },
    ],
  },
  songpa02: {
    owner: '한송파',
    email: 'songpa.owner@example.com',
    phone: '010-8842-0191',
    link: '/q/songpa02/songpa02',
    royalty: '월 매출 8%',
    settlement: '정산 대상 없음',
    memo: '유입 대비 상담 전환이 낮음. 본사에서 미응대 고객 확인과 영업 코칭 필요.',
    referrers: [
      { code: 'songpa02', leads: 11, completed: 0, incentive: '해당 없음', status: '대리점 자체' },
      { code: 'blogger777', leads: 7, completed: 0, incentive: '0원', status: '진행중' },
    ],
    pendingCustomers: [
      { name: '오세진', status: '3일 미응대', elapsed: '3일' },
      { name: '박성훈', status: '상담 미시작', elapsed: '6시간' },
      { name: '남유라', status: '전화 부재 후 미처리', elapsed: '2일' },
    ],
  },
  bundang03: {
    owner: '이분당',
    email: 'bundang.owner@example.com',
    phone: '010-3301-8821',
    link: '/q/bundang03/bundang03',
    royalty: '월 매출 8%',
    settlement: '이번 달 정산 확인 완료',
    memo: '상담 처리 속도가 안정적. 현장팀 배정 지연만 주기적으로 확인.',
    referrers: [
      { code: 'bundang03', leads: 20, completed: 4, incentive: '해당 없음', status: '대리점 자체' },
      { code: 'momCafe33', leads: 5, completed: 0, incentive: '0원', status: '진행중' },
    ],
    pendingCustomers: [
      { name: '허민재', status: '시공 일정 조율', elapsed: '8시간' },
      { name: '이하나', status: '시공예약', elapsed: '완료' },
    ],
  },
  ilsan04: {
    owner: '박일산',
    email: 'ilsan.owner@example.com',
    phone: '010-2199-4300',
    link: '/q/ilsan04/ilsan04',
    royalty: '월 매출 8%',
    settlement: '정산 대상 없음',
    memo: '최근 유입이 거의 없음. 링크 활용 여부와 지역 마케팅 상태 확인 필요.',
    referrers: [
      { code: 'ilsan04', leads: 6, completed: 0, incentive: '해당 없음', status: '대리점 자체' },
    ],
    pendingCustomers: [
      { name: '정다은', status: '상담대기', elapsed: '14일' },
    ],
  },
};

const statusRules = [
  { label: '정상', body: '최근 7일 내 유입이 있고 미응대 고객이 적으며 상담/시공 진행이 유지됩니다.' },
  { label: '주의', body: '유입은 있으나 미응대가 많거나 상담 전환율이 낮아 본사 개입이 필요합니다.' },
  { label: '비활성', body: '최근 14일 이상 유입이 없거나 계정/계약 상태 확인이 필요합니다.' },
];

const actionDetails: Record<ActionKey, {
  title: string;
  rows: Array<{ title: string; body: string; meta: string }>;
}> = {
  links: {
    title: '대리점 링크',
    rows: [
      { title: '강남 대리점', body: '/q/gangnam01/gangnam01', meta: '정상' },
      { title: '송파 대리점', body: '/q/songpa02/songpa02', meta: '주의' },
      { title: '분당 대리점', body: '/q/bundang03/bundang03', meta: '정상' },
    ],
  },
  unanswered: {
    title: '미응대 고객',
    rows: [
      { title: '오세진', body: '송파 대리점 · 유입 후 3일 미응대', meta: '긴급' },
      { title: '박성훈', body: '송파 대리점 · 오늘 유입 후 상담 미시작', meta: '확인' },
      { title: '문가영', body: '강남 대리점 · 상담 요청 후 담당자 미배정', meta: '확인' },
    ],
  },
  settlement: {
    title: '월 정산 확인',
    rows: [
      { title: '강남 대리점', body: '시공완료 2건 정산 확인 필요', meta: '2건' },
      { title: '분당 대리점', body: '이번 달 정산 대상 4건 중 4건 확인 완료', meta: '완료' },
      { title: '송파 대리점', body: '시공완료 건 없음', meta: '없음' },
    ],
  },
};

export default function HqDashboardPreviewPage() {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('leads');
  const [selectedAction, setSelectedAction] = useState<ActionKey>('unanswered');
  const [selectedAgencyCode, setSelectedAgencyCode] = useState<AgencyCode>('gangnam01');
  const selectedMetricDetail = useMemo(() => metricDetails[selectedMetric], [selectedMetric]);
  const selectedActionDetail = useMemo(() => actionDetails[selectedAction], [selectedAction]);
  const selectedAgency = useMemo(
    () => agencies.find((agency) => agency.code === selectedAgencyCode) || agencies[0],
    [selectedAgencyCode],
  );
  const selectedAgencyDetail = useMemo(() => agencyDetails[selectedAgencyCode], [selectedAgencyCode]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold text-gray-400">PREVIEW</p>
            <h1 className="text-2xl font-bold">본사 운영 대시보드</h1>
            <p className="mt-1 text-sm text-gray-500">
              대리점 유입, 상담, 시공 전환과 주의 필요 항목을 한 화면에서 봅니다.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700">
              이번 달
            </button>
            <button className="bg-[#b10000] px-3 py-2 text-sm font-semibold text-white">
              리포트 내보내기
            </button>
          </div>
        </header>

        <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {summaryCards.map((card) => (
            <button
              key={card.label}
              onClick={() => setSelectedMetric(card.key)}
              className={`border bg-white p-4 text-left transition hover:border-[#b10000] ${
                selectedMetric === card.key ? 'border-[#b10000] shadow-sm' : 'border-gray-200'
              }`}
            >
              <p className="text-xs font-medium text-gray-500">{card.label}</p>
              <p className={`mt-2 text-2xl font-bold ${card.tone}`}>
                {card.value}
                <span className="ml-1 text-sm font-normal text-gray-500">{card.unit}</span>
              </p>
            </button>
          ))}
        </section>

        <section className="mb-5 border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-bold">{selectedMetricDetail.title}</h2>
            <p className="mt-0.5 text-xs text-gray-500">{selectedMetricDetail.description}</p>
          </div>
          <div className="divide-y divide-gray-100">
            {selectedMetricDetail.rows.map((row) => (
              <div key={`${row.primary}-${row.date}`} className="grid gap-3 px-4 py-3 text-sm sm:grid-cols-[1.1fr_1fr_1fr_auto] sm:items-center">
                <div>
                  <p className="font-semibold text-gray-900">{row.primary}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{row.secondary}</p>
                </div>
                <p className="text-gray-700">{row.agency}</p>
                <div>
                  <p className="font-semibold text-gray-700">{row.status}</p>
                  {row.amount && <p className="mt-0.5 text-xs text-[#b10000]">{row.amount}</p>}
                </div>
                <p className="text-xs text-gray-400">{row.date}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <section className="border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-bold">대리점 성과</h2>
                <p className="mt-0.5 text-xs text-gray-500">유입부터 시공 완료까지의 월간 현황</p>
              </div>
              <button className="text-xs font-semibold text-blue-600">전체 대리점</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">대리점</th>
                    <th className="px-3 py-3 font-semibold">유입</th>
                    <th className="px-3 py-3 font-semibold">상담</th>
                    <th className="px-3 py-3 font-semibold">예약</th>
                    <th className="px-3 py-3 font-semibold">완료</th>
                    <th className="px-3 py-3 font-semibold">전환율</th>
                    <th className="px-3 py-3 font-semibold">매출</th>
                    <th className="px-3 py-3 font-semibold">미응대</th>
                    <th className="px-3 py-3 font-semibold">최근유입</th>
                    <th className="px-4 py-3 font-semibold">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {agencies.map((agency) => (
                    <tr
                      key={agency.code}
                      onClick={() => setSelectedAgencyCode(agency.code)}
                      className={`cursor-pointer hover:bg-gray-50 ${
                        selectedAgencyCode === agency.code ? 'bg-[#fff8f6]' : ''
                      }`}
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-900">{agency.name}</p>
                        <p className="mt-0.5 text-xs text-gray-400">{agency.code}</p>
                      </td>
                      <td className="px-3 py-4 font-semibold">{agency.leads}</td>
                      <td className="px-3 py-4">{agency.consults}</td>
                      <td className="px-3 py-4">{agency.scheduled}</td>
                      <td className="px-3 py-4">{agency.completed}</td>
                      <td className="px-3 py-4 font-semibold">{agency.conversion}</td>
                      <td className="px-3 py-4">{agency.revenue}</td>
                      <td className={`px-3 py-4 font-semibold ${agency.pending >= 5 ? 'text-amber-700' : 'text-gray-700'}`}>
                        {agency.pending}
                      </td>
                      <td className="px-3 py-4 text-gray-600">{agency.lastLead}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex border px-2 py-1 text-xs font-semibold ${agency.statusTone}`}>
                          {agency.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-4 py-3">
                <h2 className="text-sm font-bold">주의 필요</h2>
                <p className="mt-0.5 text-xs text-gray-500">본사가 먼저 확인할 항목</p>
              </div>
              <div className="divide-y divide-gray-100">
                {alerts.map((alert) => (
                  <div key={alert.title} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-gray-900">{alert.title}</p>
                      <span className="bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-5 text-gray-600">{alert.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-bold">운영 액션</h2>
              <div className="mt-3 grid gap-2">
                <button
                  onClick={() => setSelectedAction('links')}
                  className={`border bg-white px-3 py-3 text-left text-sm font-semibold ${
                    selectedAction === 'links' ? 'border-[#b10000] text-[#b10000]' : 'border-gray-300 text-gray-700'
                  }`}
                >
                  대리점 링크 복사
                </button>
                <button
                  onClick={() => setSelectedAction('unanswered')}
                  className={`border bg-white px-3 py-3 text-left text-sm font-semibold ${
                    selectedAction === 'unanswered' ? 'border-[#b10000] text-[#b10000]' : 'border-gray-300 text-gray-700'
                  }`}
                >
                  미응대 고객 보기
                </button>
                <button
                  onClick={() => setSelectedAction('settlement')}
                  className={`border bg-white px-3 py-3 text-left text-sm font-semibold ${
                    selectedAction === 'settlement' ? 'border-[#b10000] text-[#b10000]' : 'border-gray-300 text-gray-700'
                  }`}
                >
                  월 정산 확인
                </button>
              </div>
            </section>

            <section className="border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-4 py-3">
                <h2 className="text-sm font-bold">{selectedActionDetail.title}</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {selectedActionDetail.rows.map((row) => (
                  <div key={row.title} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-gray-900">{row.title}</p>
                      <span className="bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                        {row.meta}
                      </span>
                    </div>
                    <p className="mt-2 break-all text-sm leading-5 text-gray-600">{row.body}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="border border-gray-200 bg-white">
            <div className="flex flex-col gap-2 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold">선택 대리점 관리</h2>
                <p className="mt-0.5 text-xs text-gray-500">대리점 행을 누르면 이 영역이 바뀝니다.</p>
              </div>
              <span className={`inline-flex w-fit border px-2 py-1 text-xs font-semibold ${selectedAgency.statusTone}`}>
                {selectedAgency.status}
              </span>
            </div>
            <div className="grid gap-4 p-4 lg:grid-cols-[1fr_1.2fr]">
              <div className="space-y-4">
                <div>
                  <p className="text-xl font-bold">{selectedAgency.name}</p>
                  <p className="mt-1 text-sm text-gray-500">{selectedAgency.code}</p>
                </div>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                    <span className="text-gray-500">대리점장</span>
                    <span className="font-semibold">{selectedAgencyDetail.owner}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                    <span className="text-gray-500">이메일</span>
                    <span className="font-semibold">{selectedAgencyDetail.email}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                    <span className="text-gray-500">연락처</span>
                    <span className="font-semibold">{selectedAgencyDetail.phone}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
                    <span className="text-gray-500">로열티</span>
                    <span className="font-semibold">{selectedAgencyDetail.royalty}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">정산</span>
                    <span className="font-semibold text-[#b10000]">{selectedAgencyDetail.settlement}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3">
                  <p className="text-xs font-semibold text-gray-500">공유 링크</p>
                  <p className="mt-1 break-all text-sm font-semibold text-gray-900">{selectedAgencyDetail.link}</p>
                </div>
                <p className="text-sm leading-6 text-gray-600">{selectedAgencyDetail.memo}</p>
              </div>

              <div className="grid gap-4">
                <div className="border border-gray-200">
                  <div className="border-b border-gray-100 px-3 py-2">
                    <p className="text-sm font-bold">추천인 성과</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {selectedAgencyDetail.referrers.map((referrer) => (
                      <div key={referrer.code} className="grid grid-cols-[1fr_auto] gap-3 px-3 py-3 text-sm">
                        <div>
                          <p className="font-semibold">{referrer.code}</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            유입 {referrer.leads}명 · 완료 {referrer.completed}건
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[#b10000]">{referrer.incentive}</p>
                          <p className="mt-0.5 text-xs text-gray-500">{referrer.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-gray-200">
                  <div className="border-b border-gray-100 px-3 py-2">
                    <p className="text-sm font-bold">확인 필요 고객</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {selectedAgencyDetail.pendingCustomers.map((customer) => (
                      <div key={`${customer.name}-${customer.elapsed}`} className="flex items-center justify-between gap-3 px-3 py-3 text-sm">
                        <div>
                          <p className="font-semibold">{customer.name}</p>
                          <p className="mt-0.5 text-xs text-gray-500">{customer.status}</p>
                        </div>
                        <span className="shrink-0 bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                          {customer.elapsed}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-bold">상태 판단 기준</h2>
              <p className="mt-0.5 text-xs text-gray-500">초기 MVP에서 자동 뱃지에 사용할 규칙</p>
            </div>
            <div className="divide-y divide-gray-100">
              {statusRules.map((rule) => (
                <div key={rule.label} className="p-4">
                  <p className="font-semibold text-gray-900">{rule.label}</p>
                  <p className="mt-1 text-sm leading-5 text-gray-600">{rule.body}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-5 border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <h2 className="text-sm font-bold">최근 유입 고객</h2>
              <p className="mt-0.5 text-xs text-gray-500">대리점과 추천인 코드가 함께 보이는 운영 리스트</p>
            </div>
            <button className="text-xs font-semibold text-blue-600">고객 전체보기</button>
          </div>
          <div className="grid divide-y divide-gray-100">
            {recentLeads.map((lead) => (
              <div key={`${lead.phone}-${lead.createdAt}`} className="grid gap-3 px-4 py-3 text-sm sm:grid-cols-[1.1fr_1fr_1fr_1fr_auto] sm:items-center">
                <div>
                  <p className="font-semibold text-gray-900">{lead.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{lead.phone}</p>
                </div>
                <p className="text-gray-700">{lead.agency}</p>
                <p className="text-gray-500">{lead.referrer}</p>
                <p className="font-semibold text-gray-700">{lead.status}</p>
                <p className="text-xs text-gray-400">{lead.createdAt}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
