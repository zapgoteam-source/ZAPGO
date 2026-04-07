'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Estimate, EstimateAdjustment } from '@/types';
import { formatKRW } from '@/lib/estimateCalculator';

export default function WorkerFieldPage() {
  const { role, user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [adjustments, setAdjustments] = useState<EstimateAdjustment[]>([]);
  const [newAdj, setNewAdj] = useState({ type: 'ADD', amount: 0, reason: '' });
  const [addingAdj, setAddingAdj] = useState(false);

  useEffect(() => {
    if (!loading && role !== 'WORKER' && role !== 'ADMIN') router.replace('/login');
  }, [role, loading, router]);

  useEffect(() => {
    if (!id || (role !== 'WORKER' && role !== 'ADMIN')) return;
    async function fetch() {
      const { data: est } = await supabase.from('estimates').select('*').eq('id', id).single();
      if (est) setEstimate(est as Estimate);
      const { data: adjs } = await supabase
        .from('estimate_adjustments')
        .select('*')
        .eq('estimate_id', id)
        .order('created_at', { ascending: false });
      setAdjustments((adjs as EstimateAdjustment[]) || []);
    }
    fetch();
  }, [id, role]);

  const handleAddAdj = async () => {
    if (!estimate || !user || !newAdj.reason || newAdj.amount === 0) return;
    const { data } = await supabase
      .from('estimate_adjustments')
      .insert({
        estimate_id: estimate.id,
        actor_user_id: user.id,
        adjustment_type: newAdj.type,
        amount: newAdj.amount,
        reason: newAdj.reason,
      })
      .select()
      .single();
    if (data) {
      setAdjustments((a) => [data as EstimateAdjustment, ...a]);
      setNewAdj({ type: 'ADD', amount: 0, reason: '' });
      setAddingAdj(false);
    }
  };

  if (loading || !estimate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const isLocked = !!estimate.locked_at;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="mb-4">
          <button onClick={() => router.back()} className="text-gray-400 text-sm mb-2">← 목록</button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{estimate.customer_name || '현장'}</h1>
              <p className="text-sm text-gray-500">{estimate.customer_phone}</p>
            </div>
            {isLocked && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1">잠김</span>
            )}
          </div>
        </div>

        {/* 견적 요약 */}
        <div className="bg-gray-900 p-4 mb-4">
          <p className="text-gray-400 text-xs mb-1">예상 견적 (부가세 별도)</p>
          <p className="text-2xl font-bold text-white">{formatKRW(estimate.self_estimated_amount)}</p>
          <p className="text-gray-400 text-xs mt-1">
            {estimate.housing_area_pyeong}평 · {estimate.material_type === 'FABRIC' ? '패브릭씰러' : '일반모헤어'}
          </p>
        </div>

        {/* 고객 정보 */}
        <div className="bg-white border border-gray-200 mb-4 p-4">
          <p className="text-sm font-bold text-gray-800 mb-3">현장 정보</p>
          <div className="space-y-2 text-sm">
            <Row label="주소" value={estimate.address || '-'} />
            <Row label="상태" value={estimate.status} />
            <Row label="희망일" value={estimate.preferred_date || '-'} />
            {estimate.extra_request && (
              <Row label="요청사항" value={estimate.extra_request} />
            )}
            {estimate.warning_unknown_frame && (
              <div className="bg-yellow-50 border border-yellow-200 p-2 mt-2">
                <p className="text-xs text-yellow-700">⚠️ 창틀 미확인 창문 있음 - 현장 실측 필요</p>
              </div>
            )}
          </div>
        </div>

        {/* 기타 금액 가감 */}
        {!isLocked && (
          <div className="bg-white border border-gray-200 mb-4 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-800">금액 가감</p>
              <button
                onClick={() => setAddingAdj(!addingAdj)}
                className="text-xs text-blue-600 border border-blue-200 px-2 py-1"
              >
                + 추가
              </button>
            </div>

            {addingAdj && (
              <div className="bg-gray-50 p-3 mb-3 space-y-2">
                <div className="flex gap-2">
                  <select
                    value={newAdj.type}
                    onChange={(e) => setNewAdj((a) => ({ ...a, type: e.target.value }))}
                    className="flex-1 py-2 px-2 border border-gray-200 text-sm"
                  >
                    <option value="ADD">추가금</option>
                    <option value="DISCOUNT">할인금</option>
                  </select>
                  <input
                    type="number"
                    value={newAdj.amount || ''}
                    onChange={(e) => setNewAdj((a) => ({ ...a, amount: Number(e.target.value) }))}
                    placeholder="금액"
                    className="flex-1 py-2 px-2 border border-gray-200 text-sm"
                  />
                </div>
                <input
                  value={newAdj.reason}
                  onChange={(e) => setNewAdj((a) => ({ ...a, reason: e.target.value }))}
                  placeholder="사유 (필수)"
                  className="w-full py-2 px-3 border border-gray-200 text-sm"
                />
                <button
                  onClick={handleAddAdj}
                  disabled={!newAdj.reason || newAdj.amount === 0}
                  className="w-full py-2 bg-gray-900 text-white text-sm disabled:opacity-40"
                >
                  적용
                </button>
              </div>
            )}

            {adjustments.length > 0 && (
              <div className="space-y-2">
                {adjustments.map((a) => (
                  <div key={a.id} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className={`text-xs font-semibold ${a.adjustment_type === 'ADD' ? 'text-red-600' : 'text-green-600'}`}>
                        {a.adjustment_type === 'ADD' ? '+' : '-'}{formatKRW(a.amount)}
                      </p>
                      <p className="text-xs text-gray-500">{a.reason}</p>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString('ko-KR')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 서명 받기 */}
        {!isLocked && (
          <button
            onClick={() => router.push(`/worker/sign/${id}`)}
            className="w-full py-4 bg-gray-900 text-white font-semibold text-base hover:bg-gray-800 transition-colors"
          >
            서명 받기
          </button>
        )}

        {isLocked && (
          <div className="bg-green-50 border border-green-200 p-4 text-center">
            <p className="text-green-700 font-semibold">✓ 서명 완료 - 견적 확정</p>
            {estimate.completed_at && (
              <p className="text-xs text-green-500 mt-1">
                {new Date(estimate.completed_at).toLocaleDateString('ko-KR')} 완료
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-500 w-20 flex-shrink-0 text-xs pt-0.5">{label}</span>
      <span className="text-gray-800 text-sm">{value}</span>
    </div>
  );
}
