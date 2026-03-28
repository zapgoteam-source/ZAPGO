'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Estimate, EstimateStatus } from '@/types';
import { formatKRW } from '@/lib/estimateCalculator';

const STATUS_LABELS: Partial<Record<EstimateStatus, string>> = {
  ASSIGNED: '담당배정',
  VISIT_REQUESTED: '방문요청',
  VISIT_SCHEDULED: '방문예약',
  COMPLETED: '완료',
};

export default function WorkerListPage() {
  const { role, user, loading } = useAuth();
  const router = useRouter();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && role !== 'WORKER' && role !== 'ADMIN') {
      router.replace('/login');
    }
  }, [role, loading, router]);

  useEffect(() => {
    if (!user || (role !== 'WORKER' && role !== 'ADMIN')) return;
    async function fetch() {
      setDataLoading(true);
      try {
        let query = supabase
          .from('estimates')
          .select('*')
          .in('status', ['ASSIGNED', 'VISIT_REQUESTED', 'VISIT_SCHEDULED'])
          .order('created_at', { ascending: false });

        // WORKER는 자기 배정만
        if (role === 'WORKER') {
          query = query.eq('worker_id', user!.id);
        }

        const { data } = await query;
        setEstimates((data as Estimate[]) || []);
      } finally {
        setDataLoading(false);
      }
    }
    fetch();
  }, [user, role]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">배정 현장 목록</h1>
          <p className="text-sm text-gray-500 mt-0.5">담당 시공 현장을 확인하세요</p>
        </div>

        {dataLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
          </div>
        ) : estimates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">배정된 현장이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {estimates.map((e) => (
              <div
                key={e.id}
                onClick={() => router.push(`/worker/field/${e.id}`)}
                className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{e.customer_name || '고객명 없음'}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{e.customer_phone || '-'}</p>
                    {e.address && (
                      <p className="text-xs text-gray-400 mt-1 truncate max-w-[200px]">{e.address}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {e.housing_area_pyeong}평 · {e.material_type === 'FABRIC' ? '패브릭씰러' : '일반모헤어'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {STATUS_LABELS[e.status as EstimateStatus] || e.status}
                    </span>
                    <p className="text-sm font-bold text-gray-900 mt-2">
                      {formatKRW(e.self_estimated_amount)}
                    </p>
                    {e.preferred_date && (
                      <p className="text-xs text-gray-400 mt-1">희망: {e.preferred_date}</p>
                    )}
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
