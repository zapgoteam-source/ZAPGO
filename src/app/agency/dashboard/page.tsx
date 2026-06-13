'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type AgencyDashboard = {
  agency: {
    id: string;
    name: string;
    code: string;
    referralUrl: string;
  };
  summary: {
    leads: number;
    consultPending: number;
    scheduled: number;
    completed: number;
    revenue: number;
    unanswered: number;
  };
  customers: Array<{
    id: string;
    name: string;
    phone: string;
    status: string;
    createdAt: string;
  }>;
};

export default function AgencyDashboardPage() {
  const { role, user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<AgencyDashboard | null>(null);
  const [dataError, setDataError] = useState('');

  useEffect(() => {
    if (!loading && role !== 'AGENCY') router.replace('/login');
  }, [role, loading, router]);

  useEffect(() => {
    if (!user || role !== 'AGENCY' || !userProfile?.agency_id) return;
    async function fetch() {
      setDataError('');
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const response = await window.fetch(`/api/agency/dashboard?agency_id=${userProfile!.agency_id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = await response.json();
      if (!response.ok) {
        setDataError(payload.error || '대리점 데이터를 불러오지 못했습니다.');
        return;
      }
      setDashboard(payload);
    }
    fetch();
  }, [user, role, userProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const referralUrl =
    typeof window !== 'undefined' && dashboard
      ? `${window.location.origin}${dashboard.agency.referralUrl}`
      : '';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">대리점 대시보드</h1>
          {dashboard && <p className="text-sm text-gray-500 mt-0.5">{dashboard.agency.name}</p>}
        </div>

        {/* 추천 링크 */}
        {dashboard && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 mb-4">
            <p className="text-sm font-bold text-yellow-800 mb-2">추천 링크</p>
            <p className="text-xs text-yellow-700 mb-2">고객에게 이 링크를 공유하세요</p>
            <div className="bg-white p-2 flex items-center gap-2">
              <p className="text-xs text-gray-600 flex-1 truncate">{referralUrl}</p>
              <button
                onClick={() => navigator.clipboard?.writeText(referralUrl)}
                className="text-xs text-yellow-700 font-medium px-2 py-1 bg-yellow-100"
              >
                복사
              </button>
            </div>
            <p className="text-xs text-yellow-600 mt-2">코드: {dashboard.agency.code}</p>
          </div>
        )}

        {dataError && (
          <div className="mb-4 border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {dataError}
          </div>
        )}

        {/* 통계 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white border border-gray-200 p-4">
            <p className="text-xs text-gray-500">유입 고객</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {dashboard?.summary.leads ?? 0}<span className="text-sm font-normal ml-1">명</span>
            </p>
          </div>
          <div className="bg-white border border-gray-200 p-4">
            <p className="text-xs text-gray-500">상담 대기</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {dashboard?.summary.consultPending ?? 0}
              <span className="text-sm font-normal ml-1">명</span>
            </p>
          </div>
        </div>

        {/* 최근 고객 */}
        <div className="bg-white border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800">최근 유입 고객</h2>
            <button
              onClick={() => router.push('/agency/customers')}
              className="text-xs text-blue-600"
            >
              전체보기
            </button>
          </div>
          {!dashboard || dashboard.customers.length === 0 ? (
            <div className="py-6 text-center text-gray-400 text-sm">아직 유입 고객이 없습니다</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {dashboard.customers.slice(0, 5).map((c) => (
                <div key={c.id} className="px-4 py-3">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-800">{c.name}</p>
                    <span className="text-xs text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{c.phone} · {c.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
