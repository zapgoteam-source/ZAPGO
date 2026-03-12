/**
 * 견적 관리 컴포넌트 (에너지잡고 버전)
 * 
 * 가격 정책 관리 기능을 제공합니다.
 * 모든 지점에서 견적을 낼 때 사용되는 공통 가격 정책을 관리합니다.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { usePermissions } from '@/components/auth/PermissionGuard';
import { useNetworkReconnect } from '@/hooks/useNetworkReconnect';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Settings, 
  Plus, 
  Edit3,
  X,
  Shield,
  FileText,
  Receipt,
  Calculator,
  Search,
  AlertCircle,
  RefreshCw,
  Grid3x3,
  List
} from 'lucide-react';

// 견적 기준 정보 타입 정의
interface PricePolicy {
  id: string;
  tenant_id: string | null;
  item_name: string;              // 항목명 (자유 입력)
  work_category: string | null;   // 작업 구분 (자유 입력, 선택사항)
  supply_price: number;           // 공급가액
  total_amount: number;           // 총금액
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tenant_name?: string;
}

// 견적 기준 추가/수정 폼 컴포넌트
function PricePolicyForm({ policy, onSaved, onCancel }: {
  policy?: PricePolicy | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    item_name: policy?.item_name || '',
    work_category: policy?.work_category || '',
    supply_price: policy?.supply_price?.toString() || '',
    total_amount: policy?.total_amount?.toString() || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.item_name.trim() || !formData.supply_price.trim() || !formData.total_amount.trim()) {
      setError('필수 항목을 모두 입력해주세요.');
      return;
    }

    const supplyPrice = parseFloat(formData.supply_price);
    const totalAmount = parseFloat(formData.total_amount);
    
    if (isNaN(supplyPrice) || supplyPrice < 0) {
      setError('올바른 공급가액을 입력해주세요.');
      return;
    }

    if (isNaN(totalAmount) || totalAmount < 0) {
      setError('올바른 총금액을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 본사 테넌트 ID 가져오기 (HQ 타입의 본사)
      const { data: hqTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('type', 'HQ')
        .single();

      const policyData = {
        tenant_id: hqTenant?.id || null,
        item_name: formData.item_name.trim(),
        work_category: formData.work_category.trim() || null,
        supply_price: supplyPrice,
        total_amount: totalAmount
      };

      if (policy) {
        // 기존 가격 정책 수정
        const { error: updateError } = await supabase
          .from('price_policies')
          .update(policyData)
          .eq('id', policy.id);

        if (updateError) {
          throw new Error('견적 기준 수정에 실패했습니다.');
        }
      } else {
        // 새 견적 기준 추가
        const { error: insertError } = await supabase
          .from('price_policies')
          .insert(policyData);

        if (insertError) {
          throw new Error('견적 기준 추가에 실패했습니다.');
        }
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-10"
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[70vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3.5 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 font-korean">
              {policy ? '견적 기준 수정' : '새 견적 기준 추가'}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-md"
            disabled={loading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-korean">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 font-korean mb-2">
              항목명 *
            </label>
            <input
              type="text"
              value={formData.item_name}
              onChange={(e) => setFormData({...formData, item_name: e.target.value})}
              placeholder="예: 출장비, 인건비, 1인작업창 등"
              className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-50 font-korean"
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 font-korean mb-2">
              작업 구분
            </label>
            <input
              type="text"
              value={formData.work_category}
              onChange={(e) => setFormData({...formData, work_category: e.target.value})}
              placeholder="예: 탈거·사면시공 (선택사항)"
              className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-50 font-korean"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 font-korean mb-2">
              공급가액 *
            </label>
            <input
              type="number"
              value={formData.supply_price}
              onChange={(e) => setFormData({...formData, supply_price: e.target.value})}
              placeholder="50000"
              min="0"
              step="1"
              className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-50 font-korean"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 font-korean mb-2">
              총금액 *
            </label>
            <input
              type="number"
              value={formData.total_amount}
              onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
              placeholder="55000"
              min="0"
              step="1"
              className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-50 font-korean"
              disabled={loading}
              required
            />
          </div>
        </div>
          </form>
        </div>

        {/* 모달 푸터 */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-5 py-3 flex items-center justify-end gap-2 rounded-b-xl">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-all font-korean border border-gray-200 disabled:opacity-50"
          >
            취소
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-all font-korean disabled:opacity-50"
          >
            {loading ? '저장 중...' : (policy ? '수정' : '추가')}
          </button>
        </div>
      </div>
    </div>
  );
}

// 견적 기준 카드 컴포넌트
function PricePolicyCard({ policy, onEdit, onDelete }: {
  policy: PricePolicy;
  onEdit: (policy: PricePolicy) => void;
  onDelete: (policy: PricePolicy) => void;
}) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  // 작업 구분에 따른 색상 결정
  const getCategoryStyle = (category: string | null) => {
    if (!category) return 'bg-gray-100 text-gray-700';
    
    const normalized = category.trim();
    if (normalized.includes('탈거') && normalized.includes('사면')) {
      return 'bg-green-100 text-green-700';
    } else if (normalized.includes('미탈거') && normalized.includes('측면')) {
      return 'bg-pink-100 text-pink-700';
    } else if (normalized.includes('미탈거') && normalized.includes('창틀')) {
      return 'bg-blue-100 text-blue-700';
    }
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="bg-white rounded-md border border-gray-200 p-4 transition-all duration-200 hover:border-primary hover:shadow-md">
      <div className="flex flex-col gap-3">
        {/* 상단: 제목 */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-base text-gray-900 font-korean">
                {policy.item_name}
              </span>
              {policy.work_category && (
                <span className={`inline-block px-2.5 py-1 text-sm font-medium rounded ${getCategoryStyle(policy.work_category)}`}>
                  {policy.work_category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 가격 정보 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm text-gray-600 font-korean">
            <span>공급가액</span>
            <span className="font-medium text-gray-900">
              {formatPrice(policy.supply_price)}원
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 font-korean">
            <span>총금액</span>
            <span className="font-bold text-primary">
              {formatPrice(policy.total_amount)}원
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-korean">
              {new Date(policy.updated_at).toLocaleDateString('ko-KR')} 수정
            </span>
          </div>
        </div>

        {/* 버튼들 */}
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => onEdit(policy)}
            className="flex-1 px-3 py-1.5 bg-white text-gray-700 border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-50 transition-all font-korean"
          >
            수정
          </button>
          <button
            onClick={() => onDelete(policy)}
            className="flex-1 px-3 py-1.5 bg-white text-primary border border-primary rounded-md text-xs font-medium hover:bg-primary/5 transition-all font-korean"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

// 메인 견적 관리 컴포넌트
export default function QuotationManagement({ 
  showAddForm, 
  setShowAddForm 
}: { 
  showAddForm?: boolean; 
  setShowAddForm?: (show: boolean) => void; 
}) {
  const [policies, setPolicies] = useState<PricePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PricePolicy | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grouped' | 'all'>('grouped'); // 보기 모드
  const { isAdmin } = usePermissions();
  const { validateAndRefreshSession } = useAuth();

  // 외부에서 showAddForm이 true로 변경되면 모달 열기
  React.useEffect(() => {
    if (showAddForm) {
      setEditingPolicy(null);
      setShowForm(true);
      setShowAddForm?.(false); // 부모 상태 리셋
    }
  }, [showAddForm, setShowAddForm]);

  /**
   * 견적 기준 목록 로드
   * useCallback으로 메모이제이션하여 재사용
   */
  const loadPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: policyData, error: policyError } = await supabase
        .from('price_policies')
        .select(`
          *,
          tenants(name)
        `)
        .order('item_name', { ascending: true })
        .order('created_at', { ascending: false });

      if (policyError) {
        console.error('견적 기준 조회 오류:', policyError);
        throw new Error(`견적 기준 정보를 불러오는데 실패했습니다: ${policyError.message}`);
      }

      const policiesWithTenantName = policyData?.map(policy => ({
        ...policy,
        tenant_name: policy.tenants?.name || '미지정'
      })) || [];

      setPolicies(policiesWithTenantName);
    } catch (err) {
      console.error('견적 기준 로드 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 네트워크 재연결 시 세션 검증 및 데이터 재로드
  useNetworkReconnect({
    onReconnect: async () => {
      console.log('🔄 [견적 관리] 재연결 감지 - 세션 검증 및 데이터 재로드');
      
      // 1. 세션 검증 및 복구
      const isValid = await validateAndRefreshSession();
      
      // 2. 세션이 유효하면 데이터 재로드
      if (isValid) {
        await loadPolicies();
      }
    },
    debounceMs: 2000, // 2초 디바운스
  });

  // 견적 기준 삭제
  const deletePolicy = async (policy: PricePolicy) => {
    if (!confirm(`"${policy.item_name}" 항목을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('price_policies')
        .delete()
        .eq('id', policy.id);

      if (error) {
        throw new Error('견적 기준 삭제에 실패했습니다.');
      }

      await loadPolicies();
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    }
  };


  // 초기 데이터 로드
  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  /**
   * 모달 열릴 때 body 스크롤 비활성화
   */
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showForm]);

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-8 border border-red-200 max-w-md mx-auto">
          <div className="p-4 bg-red-100 rounded-full w-fit mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 font-korean mb-2">
            관리자 권한 필요
          </h3>
          <p className="text-sm text-gray-600 font-korean">
            이 기능은 본사 관리자만 사용할 수 있습니다
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative">
          {/* 외곽 회전 원 */}
          <div className="w-20 h-20 border-4 border-primary/20 rounded-full"></div>
          {/* 회전 애니메이션 원 */}
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
          {/* 중앙 아이콘 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Calculator className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-8 border border-red-200 max-w-md mx-auto">
          <div className="p-4 bg-red-100 rounded-full w-fit mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 font-korean mb-2">
            오류 발생
          </h3>
          <p className="text-sm text-gray-600 font-korean mb-6">{error}</p>
          <Button
            variant="primary"
            onClick={loadPolicies}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </div>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 견적 기준 목록 */}
      <div className="bg-white rounded-md border border-gray-200 shadow-sm">
        <div className="px-3 py-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <Calculator className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 font-korean">
              견적 목록 ({policies.filter(policy => 
                policy.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                policy.work_category?.toLowerCase().includes(searchTerm.toLowerCase())
              ).length})
            </h3>
          </div>

          {/* 검색 및 보기 모드 */}
          <div className="mb-3 space-y-3">
            {/* 검색 입력 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="항목명, 작업 구분으로 검색..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-korean"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 보기 모드 토글 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-korean">보기:</span>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('grouped')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all font-korean ${
                    viewMode === 'grouped'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  그룹별
                </button>
                <button
                  onClick={() => setViewMode('all')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all font-korean ${
                    viewMode === 'all'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid3x3 className="w-3.5 h-3.5" />
                  전체
                </button>
              </div>
            </div>
          </div>

          {policies.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Settings className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <h3 className="text-base font-semibold text-gray-900 font-korean mb-2">
                등록된 견적 기준이 없습니다
              </h3>
              <p className="text-sm text-gray-600 font-korean mb-4">
                첫 번째 견적 기준을 추가해보세요
              </p>
              <button
                onClick={() => {
                  setEditingPolicy(null);
                  setShowForm(true);
                }}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary/90 transition-all font-korean inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                기준 추가하기
              </button>
            </div>
          ) : (
            <>
              {policies.filter(policy => 
                policy.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                policy.work_category?.toLowerCase().includes(searchTerm.toLowerCase())
              ).length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 font-korean mb-2">
                    검색 결과가 없습니다
                  </h3>
                  <p className="text-sm text-gray-600 font-korean">
                    다른 검색어로 시도해보세요
                  </p>
                </div>
              ) : (
                <>
                  {viewMode === 'grouped' ? (
                    // 그룹별 보기
                    <div className="space-y-6">
                      {(() => {
                        // 필터링된 정책 목록
                        const filteredPolicies = policies.filter(policy => 
                          policy.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          policy.work_category?.toLowerCase().includes(searchTerm.toLowerCase())
                        );

                        // 작업 구분별로 그룹화
                        const groupedPolicies = filteredPolicies.reduce((acc, policy) => {
                          const category = policy.work_category || '기타';
                          if (!acc[category]) {
                            acc[category] = [];
                          }
                          acc[category].push(policy);
                          return acc;
                        }, {} as Record<string, PricePolicy[]>);

                        // 그룹 순서 정의
                        const categoryOrder = ['탈거·사면시공', '미탈거·측면시공', '미탈거·창틀시공'];
                        const sortedCategories = Object.keys(groupedPolicies).sort((a, b) => {
                          const indexA = categoryOrder.indexOf(a);
                          const indexB = categoryOrder.indexOf(b);
                          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                          if (indexA !== -1) return -1;
                          if (indexB !== -1) return 1;
                          return a.localeCompare(b);
                        });

                        // 카테고리별 색상
                        const getCategoryHeaderStyle = (category: string) => {
                          if (category.includes('탈거') && category.includes('사면')) {
                            return 'bg-green-50 border-green-200 text-green-800';
                          } else if (category.includes('미탈거') && category.includes('측면')) {
                            return 'bg-pink-50 border-pink-200 text-pink-800';
                          } else if (category.includes('미탈거') && category.includes('창틀')) {
                            return 'bg-blue-50 border-blue-200 text-blue-800';
                          }
                          return 'bg-gray-50 border-gray-200 text-gray-800';
                        };

                        return sortedCategories.map(category => (
                          <div key={category}>
                            {/* 카테고리 헤더 */}
                            <div className={`mb-3 px-4 py-2 rounded-lg border ${getCategoryHeaderStyle(category)}`}>
                              <h4 className="text-sm font-bold font-korean">
                                {category} ({groupedPolicies[category].length})
                              </h4>
                            </div>
                            
                            {/* 해당 카테고리의 카드들 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {groupedPolicies[category].map((policy) => (
                                <PricePolicyCard
                                  key={policy.id}
                                  policy={policy}
                                  onEdit={(policy) => {
                                    setEditingPolicy(policy);
                                    setShowForm(true);
                                  }}
                                  onDelete={deletePolicy}
                                />
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  ) : (
                    // 전체 보기
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {policies
                        .filter(policy => 
                          policy.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          policy.work_category?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((policy) => (
                          <PricePolicyCard
                            key={policy.id}
                            policy={policy}
                            onEdit={(policy) => {
                              setEditingPolicy(policy);
                              setShowForm(true);
                            }}
                            onDelete={deletePolicy}
                          />
                        ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* 모달: 견적 기준 추가/수정 폼 */}
      {showForm && (
        <PricePolicyForm
          policy={editingPolicy}
          onSaved={() => {
            setShowForm(false);
            setEditingPolicy(null);
            loadPolicies();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingPolicy(null);
          }}
        />
      )}
    </>
  );
}






