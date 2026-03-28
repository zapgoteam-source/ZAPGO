'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Agency, Customer } from '@/types';

export default function AgencyDashboardPage() {
  const { role, user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [customerCount, setCustomerCount] = useState(0);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    if (!loading && role !== 'AGENCY') router.replace('/login');
  }, [role, loading, router]);

  useEffect(() => {
    if (!user || role !== 'AGENCY' || !userProfile?.agency_id) return;
    async function fetch() {
      // 대리점 정보
      const { data: ag } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', userProfile!.agency_id)
        .single();
      if (ag) setAgency(ag as Agency);

      // 고객 목록
      const { data: customers, count } = await supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('referral_code', ag?.referral_code)
        .order('created_at', { ascending: false })
        .limit(5);

      setCustomerCount(count || 0);
      setRecentCustomers((customers as Customer[]) || []);
    }
    fetch();
  }, [user, role, userProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const referralUrl =
    typeof window !== 'undefined' && agency
      ? `${window.location.origin}/login?ref=${agency.referral_code}`
      : '';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">대리점 대시보드</h1>
          {agency && <p className="text-sm text-gray-500 mt-0.5">{agency.name}</p>}
        </div>

        {/* 추천 링크 */}
        {agency && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
            <p className="text-sm font-bold text-yellow-800 mb-2">추천 링크</p>
            <p className="text-xs text-yellow-700 mb-2">고객에게 이 링크를 공유하세요</p>
            <div className="bg-white rounded-lg p-2 flex items-center gap-2">
              <p className="text-xs text-gray-600 flex-1 truncate">{referralUrl}</p>
              <button
                onClick={() => navigator.clipboard?.writeText(referralUrl)}
                className="text-xs text-yellow-700 font-medium px-2 py-1 bg-yellow-100 rounded"
              >
                복사
              </button>
            </div>
            <p className="text-xs text-yellow-600 mt-2">코드: {agency.referral_code}</p>
          </div>
        )}

        {/* 통계 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">유입 고객</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {customerCount}<span className="text-sm font-normal ml-1">명</span>
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">이번 달</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {recentCustomers.filter(
                (c) => new Date(c.created_at).getMonth() === new Date().getMonth()
              ).length}
              <span className="text-sm font-normal ml-1">명</span>
            </p>
          </div>
        </div>

        {/* 최근 고객 */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800">최근 유입 고객</h2>
            <button
              onClick={() => router.push('/agency/customers')}
              className="text-xs text-blue-600"
            >
              전체보기
            </button>
          </div>
          {recentCustomers.length === 0 ? (
            <div className="py-6 text-center text-gray-400 text-sm">아직 유입 고객이 없습니다</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentCustomers.map((c) => (
                <div key={c.id} className="px-4 py-3">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-800">{c.name}</p>
                    <span className="text-xs text-gray-400">
                      {new Date(c.created_at).toLocaleDateString('ko-KR')}
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
