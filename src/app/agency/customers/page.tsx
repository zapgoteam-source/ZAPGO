'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Customer, Agency } from '@/types';

export default function AgencyCustomersPage() {
  const { role, user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && role !== 'AGENCY') router.replace('/login');
  }, [role, loading, router]);

  useEffect(() => {
    if (!user || role !== 'AGENCY' || !userProfile?.agency_id) return;
    async function fetch() {
      setDataLoading(true);
      try {
        const { data: ag } = await supabase
          .from('agencies')
          .select('*')
          .eq('id', userProfile!.agency_id)
          .single();
        if (ag) {
          setAgency(ag as Agency);
          const { data: custs } = await supabase
            .from('customers')
            .select('*')
            .eq('referral_code', ag.referral_code)
            .order('created_at', { ascending: false });
          setCustomers((custs as Customer[]) || []);
        }
      } finally {
        setDataLoading(false);
      }
    }
    fetch();
  }, [user, role, userProfile]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-gray-400 text-sm mb-2">
            ← 대시보드
          </button>
          <h1 className="text-xl font-bold text-gray-900">유입 고객 목록</h1>
          {agency && (
            <p className="text-sm text-gray-500 mt-0.5">추천코드: {agency.referral_code}</p>
          )}
        </div>

        {dataLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">아직 유입 고객이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {customers.map((c) => (
              <div
                key={c.id}
                onClick={() => router.push(`/agency/estimate/${c.id}`)}
                className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{c.phone}</p>
                    {c.address && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{c.address}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {c.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(c.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
