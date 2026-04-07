'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEstimateStore } from '@/store/estimateStore';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatKRW, calcServiceCost, calcFrameCosts, calcScreenCosts } from '@/lib/estimateCalculator';

interface SubmitForm {
  name: string;
  phone: string;
  address: string;
  preferred_date: string;
  extra_request: string;
  marketing_consent: boolean;
}

/** 카카오 전화번호 형식을 한국 형식으로 변환 (+82 10-1234-5678 → 010-1234-5678) */
function formatKakaoPhone(phone: string): string {
  if (!phone) return '';
  // +82 접두사 제거 후 0 추가
  let cleaned = phone.replace(/\s/g, '').replace(/^\+82/, '0');
  // 하이픈 없으면 추가 (01012345678 → 010-1234-5678)
  if (/^0\d{10}$/.test(cleaned)) {
    cleaned = cleaned.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1-$2-$3');
  }
  return cleaned;
}

export default function SubmitPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { windows, housingAreaPyeong, materialType, surveyAnswers, getEstimateResult, reset } =
    useEstimateStore();

  const [form, setForm] = useState<SubmitForm>({
    name: '',
    phone: '',
    address: '',
    preferred_date: '',
    extra_request: '',
    marketing_consent: false,
  });

  // 카카오 로그인 정보로 이름/전화번호 자동 입력
  useEffect(() => {
    if (!user) return;
    const meta = user.user_metadata;
    if (!meta) return;

    setForm((prev) => ({
      ...prev,
      name: prev.name || meta.name || meta.full_name || '',
      phone: prev.phone || formatKakaoPhone(meta.phone_number || meta.phone || ''),
    }));
  }, [user]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const result = getEstimateResult();

  const handleChange = (field: keyof SubmitForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone) {
      setError('이름과 연락처는 필수 입력 항목입니다');
      return;
    }
    if (!housingAreaPyeong || !result) {
      setError('견적 정보가 없습니다. 다시 시작해주세요');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // 1. 고객 생성
      const { data: customer, error: custError } = await supabase
        .from('customers')
        .insert({
          name: form.name,
          phone: form.phone,
          address: form.address || null,
          status: 'NEW',
          extra_request: form.extra_request || null,
        })
        .select()
        .single();

      if (custError) throw custError;

      const hasUnknown = windows.some((w) => w.frame_mohair_state === 'UNKNOWN');

      // 2. 견적 생성
      const { data: estimate, error: estError } = await supabase
        .from('estimates')
        .insert({
          customer_id: customer.id,
          status: 'REQUESTED',
          estimate_request_type: 'SELF',
          housing_area_pyeong: housingAreaPyeong,
          material_type: materialType,
          self_estimated_amount: result.total,
          customer_name: form.name,
          customer_phone: form.phone,
          address: form.address || null,
          preferred_date: form.preferred_date || null,
          extra_request: form.extra_request || null,
          marketing_consent: form.marketing_consent,
          warning_unknown_frame: hasUnknown,
          requested_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (estError) throw estError;

      // 3. 설문 저장
      if (Object.values(surveyAnswers).every((v) => v !== null)) {
        await supabase.from('estimate_surveys').insert({
          estimate_id: estimate.id,
          heating_cost_level: surveyAnswers.heating_cost ?? 0,
          draft_level: surveyAnswers.draft ?? 0,
          dust_level: surveyAnswers.dust ?? 0,
          bug_level: surveyAnswers.bug ?? 0,
          noise_level: surveyAnswers.noise ?? 0,
          odor_level: surveyAnswers.odor ?? 0,
        });
      }

      // 4. 창문 데이터 저장
      const windowIdMap = new Map<string, string>(); // store_id → db_id
      for (const w of windows) {
        const { data: winRow, error: winErr } = await supabase
          .from('windows')
          .insert({
            estimate_id: estimate.id,
            location_label: w.location_label,
            window_type_code: w.window_type_code,
            layout_code: w.layout_code,
            is_double_window: w.is_double_window,
            frame_work_selected: w.frame_mohair_state !== 'NONE' && w.frame_mohair_state !== 'UNKNOWN',
            frame_mohair_state: w.frame_mohair_state,
            screen_target: ['베란다', '세탁실', '화장실', '주방'].some((kw) =>
              w.location_label.includes(kw)
            ) || w.is_double_window,
            confirmed_screen_count: w.confirmed_screen_count,
          })
          .select()
          .single();

        if (winErr || !winRow) continue;
        windowIdMap.set(w.id, winRow.id);
      }

      // 5. 서비스 라인 저장 (estimate_window_services)
      const serviceLines = calcServiceCost(windows, housingAreaPyeong, materialType);
      const frameLines = calcFrameCosts(windows, housingAreaPyeong, materialType);
      const screenLines = calcScreenCosts(windows);
      const serviceFamily = materialType === 'FABRIC' ? '패브릭씰러' : '일반모헤어';

      const serviceInserts: Record<string, unknown>[] = [];

      for (const line of serviceLines) {
        serviceInserts.push({
          estimate_id: estimate.id,
          window_id: windowIdMap.get(line.window_id) ?? null,
          service_family: serviceFamily,
          service_type: line.service_type,
          selected: true,
          quantity: line.quantity,
          unit_price: line.unit_price,
          total_price: line.total_price,
        });
      }

      for (const line of frameLines) {
        serviceInserts.push({
          estimate_id: estimate.id,
          window_id: windowIdMap.get(line.window_id) ?? null,
          service_family: '창틀',
          service_type: 'FRAME',
          selected: true,
          quantity: line.quantity,
          unit_price: line.unit_price,
          total_price: line.total_price,
        });
      }

      for (const line of screenLines) {
        if (line.replacement_total > 0) {
          serviceInserts.push({
            estimate_id: estimate.id,
            window_id: windowIdMap.get(line.window_id) ?? null,
            service_family: '방충망 교체',
            service_type: 'SCREEN_REPLACEMENT',
            selected: true,
            quantity: line.screen_count,
            unit_price: line.replacement_unit_price,
            total_price: line.replacement_total,
          });
        }
        if (line.bug_solution_total > 0) {
          serviceInserts.push({
            estimate_id: estimate.id,
            window_id: windowIdMap.get(line.window_id) ?? null,
            service_family: '방충솔루션',
            service_type: 'BUG_SOLUTION',
            selected: true,
            quantity: line.screen_count,
            unit_price: line.bug_solution_unit_price,
            total_price: line.bug_solution_total,
          });
        }
      }

      if (serviceInserts.length > 0) {
        await supabase.from('estimate_window_services').insert(serviceInserts);
      }

      setSubmitted(true);
      // Store 초기화
      reset();
    } catch (err) {
      console.error('제출 오류:', err);
      setError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center px-5 text-center">
        <div className="w-16 h-16 bg-green-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">시공 요청 완료!</h1>
        <p className="text-sm text-gray-500 mb-2">
          접수되었습니다. 담당자가 연락드릴 예정입니다.
        </p>
        {result && (
          <p className="text-base font-semibold text-gray-800 mb-6">
            예상 금액: {formatKRW(result.total)} (부가세 별도)
          </p>
        )}
        <button
          onClick={() => router.push('/login')}
          className="w-full max-w-xs py-4 bg-gray-900 text-white font-semibold"
        >
          홈으로
        </button>
        <div className="mt-4">
          <a href="tel:0000000000" className="text-sm text-blue-600 underline">
            📞 지금 바로 상담원 연결
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-5 pt-6 pb-4">
        <button onClick={() => router.back()} className="text-gray-400 text-sm mb-3">
          ← 뒤로
        </button>
        <h1 className="text-xl font-bold text-gray-900">시공 요청</h1>
        <p className="text-sm text-gray-500 mt-1">고객 정보를 입력해주세요</p>
      </div>

      {/* 견적 요약 */}
      {result && (
        <div className="mx-5 mb-4 bg-gray-50 p-4">
          <p className="text-sm text-gray-500 mb-1">예상 견적 금액</p>
          <p className="text-2xl font-bold text-gray-900">{formatKRW(result.total)}</p>
          <p className="text-xs text-gray-400">부가세 별도 · 참고용 금액</p>
        </div>
      )}

      <div className="flex-1 px-5 space-y-4">
        {/* 이름 */}
        <FormField label="이름" required>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="홍길동"
            className="w-full py-3 px-4 border-2 border-gray-200 text-sm focus:outline-none focus:border-gray-900"
          />
        </FormField>

        {/* 연락처 */}
        <FormField label="연락처" required>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="010-0000-0000"
            className="w-full py-3 px-4 border-2 border-gray-200 text-sm focus:outline-none focus:border-gray-900"
          />
        </FormField>

        {/* 주소 */}
        <FormField label="주소">
          <input
            type="text"
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="시공 주소를 입력해주세요"
            className="w-full py-3 px-4 border-2 border-gray-200 text-sm focus:outline-none focus:border-gray-900"
          />
        </FormField>

        {/* 희망 시공일 */}
        <FormField label="희망 시공일">
          <input
            type="date"
            value={form.preferred_date}
            onChange={(e) => handleChange('preferred_date', e.target.value)}
            className="w-full py-3 px-4 border-2 border-gray-200 text-sm focus:outline-none focus:border-gray-900"
          />
        </FormField>

        {/* 추가 요청사항 */}
        <FormField label="추가 요청사항">
          <textarea
            value={form.extra_request}
            onChange={(e) => handleChange('extra_request', e.target.value)}
            placeholder="특이사항이나 요청사항을 입력해주세요"
            rows={3}
            className="w-full py-3 px-4 border-2 border-gray-200 text-sm focus:outline-none focus:border-gray-900 resize-none"
          />
        </FormField>

        {/* 마케팅 동의 */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.marketing_consent}
            onChange={(e) => handleChange('marketing_consent', e.target.checked)}
            className="mt-0.5 w-5 h-5 border-gray-300"
          />
          <span className="text-sm text-gray-600">
            마케팅 정보 수신에 동의합니다 (선택)
          </span>
        </label>

        {error && (
          <div className="bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      <div className="px-5 pb-6 pt-3 space-y-3 border-t border-gray-100 bg-white">
        <button
          onClick={handleSubmit}
          disabled={submitting || !form.name || !form.phone}
          className="w-full py-4 bg-gray-900 text-white font-semibold text-base disabled:opacity-40 hover:bg-gray-800 transition-colors"
        >
          {submitting ? '제출 중...' : '시공 요청 제출'}
        </button>
        <div className="flex gap-2">
          <a
            href="tel:0000000000"
            className="flex-1 py-3 border border-gray-200 text-sm font-medium text-gray-600 text-center hover:bg-gray-50"
          >
            📞 상담원 연결
          </a>
          <a
            href="/visit-request"
            className="flex-1 py-3 border border-gray-200 text-sm font-medium text-gray-600 text-center hover:bg-gray-50"
          >
            방문 견적 요청
          </a>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-800 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}
