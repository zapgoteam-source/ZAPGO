'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { CUSTOMER_STATUS_LABELS, type StandardCustomerStatus } from '@/lib/customerStatus';

type AgencyCustomer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  status: string;
  sourceCode: string;
  finalConstructionAmount: number;
  scheduledDate: string | null;
  lastContactedAt: string | null;
  unanswered: boolean;
  createdAt: string;
};

type AgencyDashboard = {
  agency: { name: string; code: string };
  customers: AgencyCustomer[];
};

export default function AgencyCustomersPage() {
  const { role, user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<AgencyCustomer[]>([]);
  const [agency, setAgency] = useState<AgencyDashboard['agency'] | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | StandardCustomerStatus>('ALL');
  const [showUnansweredOnly, setShowUnansweredOnly] = useState(false);

  useEffect(() => {
    if (!loading && role !== 'AGENCY') router.replace('/login');
  }, [role, loading, router]);

  useEffect(() => {
    if (!user || role !== 'AGENCY' || !userProfile?.agency_id) return;
    async function fetch() {
      setDataLoading(true);
      setDataError('');
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const response = await window.fetch(`/api/agency/dashboard?agency_id=${userProfile!.agency_id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const payload = await response.json();
        if (!response.ok) {
          setDataError(payload.error || '고객 목록을 불러오지 못했습니다.');
          return;
        }
        setAgency(payload.agency);
        setCustomers(payload.customers || []);
      } finally {
        setDataLoading(false);
      }
    }
    fetch();
  }, [user, role, userProfile]);

  const filteredCustomers = customers.filter((customer) => {
    const statusMatched = statusFilter === 'ALL' || customer.status === statusFilter;
    const unansweredMatched = !showUnansweredOnly || customer.unanswered;
    return statusMatched && unansweredMatched;
  });

  const statusOptions = Array.from(new Set(customers.map((customer) => customer.status))).filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-gray-400 text-sm mb-2">
            ← 대시보드
          </button>
          <h1 className="text-xl font-bold text-gray-900">유입 고객 목록</h1>
          {agency && (
            <p className="text-sm text-gray-500 mt-0.5">대리점 코드: {agency.code}</p>
          )}
        </div>

        {dataError ? (
          <div className="border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {dataError}
          </div>
        ) : dataLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-b-2 border-gray-900" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">아직 유입 고객이 없습니다</p>
          </div>
        ) : (
          <>
            <div className="bg-white border border-gray-200 p-3 mb-4 space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
                    statusFilter === 'ALL' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  전체 {customers.length}
                </button>
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status as StandardCustomerStatus)}
                    className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
                      statusFilter === status ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {CUSTOMER_STATUS_LABELS[status as StandardCustomerStatus] || status}
                  </button>
                ))}
              </div>
              <label className="flex items-center justify-between text-sm text-gray-700">
                <span className="font-semibold">24시간 이상 미응대만 보기</span>
                <input
                  type="checkbox"
                  checked={showUnansweredOnly}
                  onChange={(e) => setShowUnansweredOnly(e.target.checked)}
                  className="h-4 w-4 accent-gray-900"
                />
              </label>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12 bg-white border border-gray-200">
                <p className="text-gray-400 text-sm">조건에 맞는 고객이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => router.push(`/agency/estimate/${c.id}`)}
                    className={`bg-white border p-4 cursor-pointer hover:border-gray-300 transition-colors ${
                      c.unanswered ? 'border-red-200' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{c.phone}</p>
                        {c.address && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{c.address}</p>
                        )}
                        <div className="flex items-center gap-1.5 mt-2">
                          {c.sourceCode && (
                            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5">
                              {c.sourceCode}
                            </span>
                          )}
                          {c.unanswered && (
                            <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 font-bold">
                              미응대
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5">
                          {CUSTOMER_STATUS_LABELS[c.status as StandardCustomerStatus] || c.status}
                        </span>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(c.createdAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
