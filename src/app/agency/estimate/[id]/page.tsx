'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Customer, Estimate } from '@/types';
import { formatKRW } from '@/lib/estimateCalculator';

export default function AgencyEstimatePage() {
  const { role, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [estimates, setEstimates] = useState<Estimate[]>([]);

  useEffect(() => {
    if (!loading && role !== 'AGENCY') router.replace('/login');
  }, [role, loading, router]);

  useEffect(() => {
    if (role !== 'AGENCY' || !id) return;
    async function fetch() {
      const { data: cust } = await supabase.from('customers').select('*').eq('id', id).single();
      if (cust) setCustomer(cust as Customer);
      const { data: ests } = await supabase
        .from('estimates')
        .select('*')
        .eq('customer_id', id)
        .order('created_at', { ascending: false });
      setEstimates((ests as Estimate[]) || []);
    }
    fetch();
  }, [id, role]);

  if (loading || !customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-gray-400 text-sm mb-2">
            ← 고객 목록
          </button>
          <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
          <p className="text-sm text-gray-500">{customer.phone}</p>
        </div>

        {/* 고객 정보 (읽기 전용) */}
        <div className="bg-white border border-gray-200 mb-4 p-4">
          <p className="text-sm font-bold text-gray-800 mb-3">고객 정보</p>
          <div className="space-y-2 text-sm">
            <Row label="상태" value={customer.status} />
            <Row label="주소" value={customer.address || '-'} />
            <Row label="등록일" value={new Date(customer.created_at).toLocaleDateString('ko-KR')} />
            {customer.extra_request && (
              <Row label="요청사항" value={customer.extra_request} />
            )}
          </div>
        </div>

        {/* 견적 목록 (읽기 전용) */}
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-sm font-bold text-gray-800 mb-3">견적 내역</p>
          {estimates.length === 0 ? (
            <p className="text-sm text-gray-400">견적이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {estimates.map((e) => (
                <div key={e.id} className="p-3 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {e.housing_area_pyeong}평 · {e.material_type === 'FABRIC' ? '패브릭씰러' : '일반모헤어'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {e.estimate_request_type === 'SELF' ? '셀프견적' : '방문견적'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {formatKRW(e.self_estimated_amount)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{e.status}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(e.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          대리점은 견적 내용을 조회만 할 수 있습니다
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-500 w-20 flex-shrink-0 text-xs pt-0.5">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}
