'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Customer, Estimate } from '@/types';

// ─── 상태 메타 ─────────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; cls: string }> = {
  NEW:             { label: '신규문의',    cls: 'bg-blue-100 text-blue-700' },
  CONSULTING:      { label: '상담 중',     cls: 'bg-orange-100 text-orange-700' },
  SELF_ESTIMATE:   { label: '셀프견적',    cls: 'bg-purple-100 text-purple-700' },
  VISIT_REQUESTED: { label: '방문요청',    cls: 'bg-yellow-100 text-yellow-700' },
  SCHEDULED:       { label: '시공예약',    cls: 'bg-sky-100 text-sky-700' },
  COMPLETED:       { label: '시공완료',    cls: 'bg-green-100 text-green-700' },
  PENDING:         { label: '보류',        cls: 'bg-gray-100 text-gray-600' },
  CLOSED:          { label: '종결',        cls: 'bg-red-100 text-red-700' },
};
const STATUSES = Object.keys(STATUS_META);

function fmtDate(d?: string | null) {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '-';
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}.${mm}.${dd}`;
}

function fmtDateTime(d?: string | null) {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '-';
  return `${fmtDate(d)} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}

function fmtKRW(n: number) {
  if (!n) return '0원';
  return n.toLocaleString() + '원';
}

// ─── 문제 태그 파싱 ────────────────────────────────────────────────────────────
function parseProblemTags(summary: string | null): string[] {
  if (!summary) return [];
  return summary.split(/[,，+&]+/).map((s) => s.trim()).filter(Boolean);
}

// ─── 더미 이벤트 로그 ──────────────────────────────────────────────────────────
function getDummyLog(c: Customer) {
  const logs = [];
  if (c.payment_received_date)
    logs.push({ time: c.payment_received_date, text: '잔금 입금 확인', who: '시스템' });
  if (c.scheduled_date)
    logs.push({ time: c.scheduled_date, text: '시공 일정 확정', who: '관리자' });
  if (c.deposit_received_date)
    logs.push({ time: c.deposit_received_date, text: '예약금 입금 확인', who: '시스템' });
  logs.push({ time: c.created_at, text: '고객 등록', who: '시스템' });
  return logs.slice(0, 4);
}

export default function CustomerDetailPage() {
  const { role, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Customer>>({});
  const [saving, setSaving] = useState(false);
  const [memo, setMemo] = useState('');

  useEffect(() => {
    if (!loading && role !== 'ADMIN') router.replace('/login');
  }, [role, loading, router]);

  useEffect(() => {
    if (role !== 'ADMIN' || !id) return;

    async function load() {
      const { data: cust } = await supabase.from('customers').select('*').eq('id', id).single();
      if (cust) { setCustomer(cust as Customer); setForm(cust as Customer); }
      const { data: ests } = await supabase
        .from('estimates').select('*').eq('customer_id', id).order('created_at', { ascending: false });
      setEstimates((ests as Estimate[]) || []);
    }
    load();
  }, [role, id]);

  const handleSave = async () => {
    if (!customer) { setEditing(false); return; }
    setSaving(true);
    try {
      await supabase.from('customers').update({ ...form, updated_at: new Date().toISOString() }).eq('id', customer.id);
      setCustomer({ ...customer, ...form } as Customer);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !customer) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-b-2 border-[#B10000]" />
      </div>
    );
  }

  const status = STATUS_META[customer.status] ?? { label: customer.status, cls: 'bg-gray-100 text-gray-600' };
  const remaining = customer.final_construction_amount - customer.deposit_amount;
  const isPaid = !!customer.payment_received_date;
  const problems = parseProblemTags(customer.problem_summary);
  const activityLog = getDummyLog(customer);
  const teamMembers = customer.team_member_names ? customer.team_member_names.split(/[,，]/).map((s) => s.trim()) : [];

  return (
    <div>
      {/* 브레드크럼 */}
      <nav className="flex items-center gap-1.5 text-sm text-[#434655] mb-4">
        <button onClick={() => router.back()} className="hover:text-[#B10000] transition-colors">
          고객 관리
        </button>
        <span className="text-[#c3c6d7]">›</span>
        <span className="text-[#B10000] font-semibold">상세 정보</span>
      </nav>

      {/* 페이지 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-extrabold text-[#191c1e] tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {customer.name} 고객님
          </h1>
          {editing ? (
            <select
              value={form.status || customer.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="px-3 py-1.5 text-xs font-bold border border-[#c3c6d7] bg-white"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </select>
          ) : (
            <span className={`px-3 py-1 text-xs font-bold ${status.cls}`}>{status.label}</span>
          )}
          <span className="text-[#434655] text-sm font-medium">{customer.phone}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="px-4 py-2.5 border border-[#c3c6d7] text-sm font-semibold text-[#434655] hover:bg-[#f2f4f6] transition-colors">
                취소
              </button>
              <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-[#B10000] text-white text-sm font-bold disabled:opacity-40 hover:bg-[#8e0000] transition-colors">
                {saving ? '저장 중...' : '저장'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="px-4 py-2.5 border border-[#c3c6d7] text-sm font-semibold text-[#434655] hover:bg-[#f2f4f6] transition-colors">
                수정
              </button>
              <button className="px-4 py-2.5 border border-[#c3c6d7] text-sm font-semibold text-[#434655] hover:bg-[#f2f4f6] transition-colors">
                견적 생성
              </button>
              <button className="px-5 py-2.5 bg-[#B10000] text-white text-sm font-bold hover:bg-[#8e0000] transition-colors">
                방문 견적 등록
              </button>
            </>
          )}
        </div>
      </div>

      {/* 메인 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── 왼쪽 (2/3) ─────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* 기본 정보 + 설문 결과 (가로 2분할) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* 기본 정보 */}
            <div className="bg-white border border-[#c3c6d7]/30 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#191c1e] mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-[#B10000]" />
                기본 정보
              </h3>
              <div className="space-y-3">
                <InfoRow label="고객명" value={customer.name} />
                <InfoRow
                  label="주소"
                  value={
                    editing
                      ? <input value={form.address || ''} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="w-full px-2 py-1 border border-[#e0e3e5] text-sm" />
                      : customer.address || '-'
                  }
                />
                <InfoRow label="등록일" value={fmtDate(customer.created_at)} />
                {customer.referral_code && (
                  <InfoRow
                    label="유입경로"
                    value={<span className="px-2 py-0.5 bg-[#f2f4f6] text-xs font-medium">{customer.referral_code}</span>}
                  />
                )}
              </div>
            </div>

            {/* 설문 결과 */}
            <div className="bg-white border border-[#c3c6d7]/30 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#191c1e] mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-[#434655]" />
                설문 결과
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-[#434655] uppercase tracking-wider mb-2">해결 희망 문제</p>
                  {problems.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {problems.map((p) => (
                        <span key={p} className="px-2.5 py-1 bg-[#ffdad6] text-[#3b0000] text-[11px] font-bold">
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#434655]">-</p>
                  )}
                </div>
                {customer.extra_request && (
                  <div>
                    <p className="text-[10px] font-bold text-[#434655] uppercase tracking-wider mb-1.5">요청사항</p>
                    <blockquote className="bg-[#f2f4f6] px-3 py-2 text-sm text-[#434655] italic leading-relaxed">
                      "{customer.extra_request}"
                    </blockquote>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 상담 관리 */}
          <div className="bg-white border border-[#c3c6d7]/30 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#191c1e] flex items-center gap-2">
                <span className="w-1 h-4 bg-[#0053db]" />
                상담 관리
              </h3>
              <span className="text-xs text-[#434655]">
                상담자 지정:{' '}
                <span className="font-bold text-[#191c1e]">
                  {customer.consultant_user_id ? '담당자' : '미지정'}
                </span>
              </span>
            </div>

            {/* 메모 입력 */}
            <div className="relative mb-4">
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="메모를 입력해 주세요..."
                rows={3}
                className="w-full bg-[#f2f4f6] border-none px-4 py-3 text-sm resize-none focus:ring-1 focus:ring-[#B10000]/40 outline-none"
              />
              <button className="absolute bottom-3 right-3 px-4 py-1.5 bg-[#B10000] text-white text-xs font-bold hover:bg-[#8e0000] transition-colors">
                기록하기
              </button>
            </div>

            {/* 메모 히스토리 */}
            {customer.consult_memo && (
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="w-7 h-7 bg-[#B10000] flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                    관
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-[#B10000]">관리자</span>
                      <span className="text-[10px] text-[#434655]">{fmtDateTime(customer.updated_at)}</span>
                    </div>
                    <p className="text-sm text-[#191c1e] leading-relaxed">{customer.consult_memo}</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-7 h-7 bg-[#e0e3e5] flex items-center justify-center text-[#434655] text-[10px] font-black flex-shrink-0">
                    AD
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-[#434655]">시스템</span>
                      <span className="text-[10px] text-[#434655]">{fmtDateTime(customer.created_at)}</span>
                    </div>
                    <p className="text-sm text-[#434655]">고객이 접수되었습니다.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 견적 이력 */}
          <div className="bg-white border border-[#c3c6d7]/30 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f2f4f6]">
              <h3 className="text-sm font-bold text-[#191c1e] flex items-center gap-2">
                <span className="w-1 h-4 bg-[#943700]" />
                견적 이력
              </h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f2f4f6]">
                  {['구분', '견적일', '견적 금액', '상태'].map((h) => (
                    <th key={h} className="px-5 py-3 text-[10px] font-bold text-[#434655] uppercase tracking-wider text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4f6]">
                {estimates.length === 0 ? (
                  /* 더미 견적 행 */
                  <>
                    {customer.final_construction_amount > 0 && (
                      <tr>
                        <td className="px-5 py-4 font-bold text-[#B10000]">방문 견적</td>
                        <td className="px-5 py-4 text-[#434655]">{fmtDate(customer.updated_at)}</td>
                        <td className="px-5 py-4 font-bold text-[#191c1e]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                          {fmtKRW(customer.final_construction_amount)}
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 bg-[#dbe1ff] text-[#003ea8] text-[11px] font-bold">
                            확정 대기
                          </span>
                        </td>
                      </tr>
                    )}
                    {customer.deposit_amount > 0 && (
                      <tr>
                        <td className="px-5 py-4 font-bold text-[#434655]">셀프 견적</td>
                        <td className="px-5 py-4 text-[#434655]">{fmtDate(customer.created_at)}</td>
                        <td className="px-5 py-4 font-bold text-[#191c1e]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                          {fmtKRW(Math.round(customer.final_construction_amount * 0.85))}
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 bg-[#e0e3e5] text-[#434655] text-[11px] font-bold">
                            만료
                          </span>
                        </td>
                      </tr>
                    )}
                    {customer.final_construction_amount === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-sm text-[#434655]">
                          견적 이력이 없습니다
                        </td>
                      </tr>
                    )}
                  </>
                ) : (
                  estimates.map((e) => (
                    <tr key={e.id} className="hover:bg-[#f2f4f6]/50 cursor-pointer" onClick={() => router.push(`/admin/estimate/${e.id}`)}>
                      <td className="px-5 py-4 font-bold text-[#B10000]">{e.estimate_request_type === 'VISIT' ? '방문 견적' : '셀프 견적'}</td>
                      <td className="px-5 py-4 text-[#434655]">{fmtDate(e.created_at)}</td>
                      <td className="px-5 py-4 font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>{fmtKRW(e.self_estimated_amount)}</td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 bg-[#dbe1ff] text-[#003ea8] text-[11px] font-bold">{e.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 오른쪽 사이드바 (1/3) ─────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* PAYMENT SUMMARY */}
          <div className="bg-[#B10000] p-6 text-white shadow-lg">
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/70 mb-3">Payment Summary</p>
            <div className="mb-5">
              <p className="text-xs text-white/60 mb-1">최종 시공 금액</p>
              {editing ? (
                <input
                  type="number"
                  value={form.final_construction_amount || 0}
                  onChange={(e) => setForm((f) => ({ ...f, final_construction_amount: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 text-white font-bold text-xl"
                />
              ) : (
                <p className="text-4xl font-black tracking-tighter" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {customer.final_construction_amount > 0
                    ? customer.final_construction_amount.toLocaleString()
                    : '-'}
                  <span className="text-xl font-bold ml-1">원</span>
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/10 p-3">
                <p className="text-[10px] text-white/60 mb-1">예약금</p>
                <p className="text-sm font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {fmtKRW(customer.deposit_amount)}
                </p>
              </div>
              <div className="bg-white/10 p-3">
                <p className="text-[10px] text-white/60 mb-1">입금 상태</p>
                <span className={`text-xs font-black px-2 py-0.5 ${isPaid ? 'bg-green-400 text-white' : 'bg-white/20 text-white'}`}>
                  {isPaid ? '입금 완료' : '입금 대기'}
                </span>
              </div>
            </div>
            <div className="border-t border-white/20 pt-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-white/60">입금 일자</span>
                <span className="font-semibold">{fmtDate(customer.payment_received_date)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/60">잔금 예정</span>
                <span className="font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {remaining > 0 ? fmtKRW(remaining) : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* 시공 일정 및 배정 */}
          <div className="bg-white border border-[#c3c6d7]/30 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#191c1e] flex items-center gap-2">
                <span className="w-1 h-4 bg-[#943700]" />
                시공 일정 및 배정
              </h3>
              {editing && <span className="text-xs text-[#B10000] font-semibold cursor-pointer">수정</span>}
            </div>

            {customer.scheduled_date ? (
              <div className="bg-[#fff5f5] border border-[#B10000]/20 px-4 py-3 mb-4">
                <p className="text-[10px] font-bold text-[#B10000] uppercase tracking-wider mb-1">Schedule</p>
                <p className="text-base font-extrabold text-[#B10000]">
                  {(() => {
                    const d = new Date(customer.scheduled_date);
                    const days = ['일', '월', '화', '수', '목', '금', '토'];
                    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
                  })()}
                </p>
                <p className="text-xs text-[#434655] mt-0.5">09:00 AM 시작 예정</p>
              </div>
            ) : (
              <div className="bg-[#f2f4f6] px-4 py-3 mb-4 text-sm text-[#434655]">
                {editing ? (
                  <input
                    type="date"
                    value={form.scheduled_date || ''}
                    onChange={(e) => setForm((f) => ({ ...f, scheduled_date: e.target.value }))}
                    className="w-full border border-[#c3c6d7] px-2 py-1 text-sm"
                  />
                ) : (
                  '일정 미정'
                )}
              </div>
            )}

            {teamMembers.length > 0 && (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-[#434655] uppercase tracking-wider mb-2">시공 팀장</p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-[#e0e3e5] flex items-center justify-center text-[#191c1e] font-black text-sm">
                      {teamMembers[0]?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#191c1e]">{teamMembers[0]}</p>
                      <p className="text-[10px] text-[#434655]">배정 1팀</p>
                    </div>
                  </div>
                </div>
                {teamMembers.length > 1 && (
                  <div>
                    <p className="text-[10px] font-bold text-[#434655] uppercase tracking-wider mb-2">배정 팀원</p>
                    <div className="flex items-center gap-1">
                      {teamMembers.slice(1, 4).map((m, i) => (
                        <div key={i} className="w-7 h-7 bg-[#ffdad6] flex items-center justify-center text-[#B10000] font-black text-xs border-2 border-white -ml-1 first:ml-0">
                          {m.charAt(0)}
                        </div>
                      ))}
                      {teamMembers.length > 4 && (
                        <div className="w-7 h-7 bg-[#e0e3e5] flex items-center justify-center text-[#434655] font-bold text-[10px] border-2 border-white -ml-1">
                          +{teamMembers.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 최근 활동 내역 */}
          <div className="bg-white border border-[#c3c6d7]/30 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[#191c1e] mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#0053db]" />
              최근 활동 내역
            </h3>
            <div className="space-y-3">
              {activityLog.map((log, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className={`w-2 h-2 mt-1.5 flex-shrink-0 ${i === 0 ? 'bg-[#B10000]' : 'bg-[#c3c6d7]'}`} />
                  <div>
                    <p className="text-sm font-semibold text-[#191c1e]">{log.text}</p>
                    <p className="text-[10px] text-[#434655] mt-0.5">
                      {fmtDate(log.time)} · {log.who}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[11px] font-semibold text-[#434655] w-16 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm font-medium text-[#191c1e] flex-1">{value}</span>
    </div>
  );
}
