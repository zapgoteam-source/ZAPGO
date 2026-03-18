/**
 * 지점 관리 컴포넌트
 * 
 * 지점 추가, 지점 목록 조회, 점주 정보 관리, 견적/고객 리스트 확인 기능을 제공합니다.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { usePermissions } from '@/components/auth/PermissionGuard';
import { UNASSIGNED_TENANT } from '@/lib/constants';
import { useNetworkReconnect } from '@/hooks/useNetworkReconnect';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Building2, 
  Plus, 
  Phone, 
  MapPin, 
  FileText, 
  Users, 
  User,
  Edit3,
  Briefcase,
  Lock,
  XCircle,
  BarChart3,
  MapPinned
} from 'lucide-react';

// 지점 정보 타입 정의 (Supabase 스키마에 맞게 수정)
interface Branch {
  id: string;
  name: string;
  type: 'DEALER' | 'HQ' | null;
  business_number: string | null;
  contact_phone: string | null;
  is_active: boolean;
  contract_start: string | null;
  contract_end: string | null;
  created_at: string;
  updated_at: string;
  owner_name?: string;
  owner_email?: string;
  quotation_count?: number;
  customer_count?: number;
}

// 승인된 사용자 타입
interface ApprovedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant_id: string;
}

// 지점 추가 폼 컴포넌트 (모달 형태)
function AddBranchForm({ onBranchAdded, onCancel }: {
  onBranchAdded: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'DEALER' as 'DEALER' | 'HQ',
    contact_phone: '',
    business_number: '',
    contract_start: '',
    owner_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvedUsers, setApprovedUsers] = useState<ApprovedUser[]>([]);

  // 승인된 사용자 목록 로드
  useEffect(() => {
    const loadApprovedUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, role, tenant_id')
          .eq('is_active', true)
          .order('name');

        if (error) {
          console.error('사용자 목록 로드 오류:', error);
          return;
        }

        if (data) {
          setApprovedUsers(data as ApprovedUser[]);
        }
      } catch (err) {
        console.error('사용자 목록 로드 처리 오류:', err);
      }
    };

    loadApprovedUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('지점명을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 새 지점 생성 (Supabase 스키마에 맞게 수정)
      const { data: newBranch, error: branchError } = await supabase
        .from('tenants')
        .insert({
          name: formData.name,
          type: formData.type,
          contact_phone: formData.contact_phone || null,
          business_number: formData.business_number || null,
          contract_start: formData.contract_start || null
        })
        .select()
        .single();

      if (branchError) {
        throw new Error('지점 생성에 실패했습니다.');
      }

      // 점주가 선택된 경우 해당 사용자의 tenant_id를 새 지점으로 업데이트
      if (formData.owner_id && newBranch) {
        // 지점 타입에 따라 적절한 role 설정
        const adminRole = formData.type === 'DEALER' ? 'DEALER_ADMIN' : 'OWNED_BRANCH_ADMIN';
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            tenant_id: newBranch.id,
            role: adminRole,
            updated_at: new Date().toISOString()
          })
          .eq('id', formData.owner_id);

        if (updateError) {
          console.error('점주 할당 오류:', updateError);
          // 지점은 생성되었지만 점주 할당 실패
          alert('지점은 생성되었으나 점주 할당에 실패했습니다. 사용자 관리에서 수동으로 할당해주세요.');
        }
      }
      
      alert('새 지점이 성공적으로 추가되었습니다.');
      onBranchAdded();
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
        className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[70vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3.5 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 font-korean">
              새 지점 추가
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
            {/* 기본 정보 섹션 */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 font-korean flex items-center gap-2 pb-2 border-b border-gray-200">
                기본 정보
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">
                    지점명 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="예: 서울 강남점"
                    required
                    disabled={loading}
                    className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-50 font-korean"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">
                    지점 형식 *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as 'DEALER' | 'HQ'})}
                    disabled={loading}
                    className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-50 font-korean"
                  >
                    <option value="DEALER">대리점</option>
                    <option value="HQ">직영점</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">
                    전화번호
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                    placeholder="02-1234-5678"
                    disabled={loading}
                    className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-50 font-korean"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">
                    사업자등록번호
                  </label>
                  <input
                    type="text"
                    value={formData.business_number}
                    onChange={(e) => setFormData({...formData, business_number: e.target.value})}
                    placeholder="123-45-67890"
                    disabled={loading}
                    className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-50 font-korean"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">
                    계약시작일
                  </label>
                  <input
                    type="date"
                    value={formData.contract_start}
                    onChange={(e) => setFormData({...formData, contract_start: e.target.value})}
                    disabled={loading}
                    className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-50 font-korean"
                  />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">
                    점주 선택
                </label>
                  <select
                    value={formData.owner_id}
                    onChange={(e) => setFormData({...formData, owner_id: e.target.value})}
                  disabled={loading}
                  className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-50 font-korean"
                  >
                    <option value="">점주 미지정</option>
                    {approvedUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email?.replace('@zapgo.local', '')}) - {
                          user.role === 'DEALER_ADMIN' ? '대리점 관리자' : 
                          user.role === 'DEALER_STAFF' ? '대리점 직원' : 
                          user.role === 'OWNED_BRANCH_ADMIN' ? '직영점 관리자' : 
                          user.role === 'OWNED_BRANCH_STAFF' ? '직영점 직원' : 
                          '미배정'
                        }
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500 font-korean">
                    선택한 사용자가 이 지점의 점주로 지정됩니다
                  </p>
                </div>
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
            {loading ? '생성 중...' : '지점 추가'}
          </button>
        </div>
      </div>
    </div>
  );
}

// 지점 카드 컴포넌트
function BranchCard({ branch, onViewDetails }: {
  branch: Branch;
  onViewDetails: (branch: Branch) => void;
}) {
  return (
    <div 
      onClick={() => onViewDetails(branch)}
      className="bg-white rounded-md border border-gray-200 p-4 cursor-pointer hover:border-primary hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* 지점 정보 헤더 */}
          <div className="flex items-center gap-2 mb-3">
            <div className="font-semibold text-gray-900 font-korean">
              {branch.name}
            </div>
            <span className={`px-2 py-0.5 text-xs font-medium rounded flex-shrink-0 ${
              branch.type === 'HQ' 
                ? 'bg-primary/10 text-primary' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {branch.type === 'HQ' ? '직영점' : '대리점'}
            </span>
          </div>

          {/* 점주 정보 */}
          <div className="space-y-1.5">
            {branch.owner_name ? (
              <div className="flex items-center gap-1.5 text-sm text-gray-600 font-korean">
                <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                {branch.owner_name}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-sm text-gray-500 font-korean">
                <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                점주 미지정
              </div>
            )}
            {branch.contact_phone ? (
              <div className="flex items-center gap-1.5 text-sm text-gray-600 font-korean">
                <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                {branch.contact_phone}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-sm text-gray-500 font-korean">
                <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                연락처 미등록
              </div>
            )}
          </div>
        </div>

        {/* 화살표 아이콘 */}
        <div className="flex-shrink-0 pt-1">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// 지점 상세 정보 모달
function BranchDetailModal({ branch, onClose, onUpdate }: {
  branch: Branch | null;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    type: 'DEALER' as 'DEALER' | 'HQ',
    contact_phone: '',
    business_number: '',
    contract_start: '',
  });
  const [originalData, setOriginalData] = useState({
    name: '',
    type: 'DEALER' as 'DEALER' | 'HQ',
    contact_phone: '',
    business_number: '',
    contract_start: '',
  });
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 모달이 열릴 때 데이터 초기화
  useEffect(() => {
    if (branch) {
      const initialData = {
        name: branch.name,
        type: (branch.type || 'DEALER') as 'DEALER' | 'HQ',
        contact_phone: branch.contact_phone || '',
        business_number: branch.business_number || '',
        contract_start: branch.contract_start ? branch.contract_start.split('T')[0] : '',
      };
      setEditData(initialData);
      setOriginalData(initialData);
      setIsEditing(false);
      setError(null);
    }
  }, [branch]);

  // 변경사항 감지
  const hasChanges = 
    editData.name !== originalData.name ||
    editData.type !== originalData.type ||
    editData.contact_phone !== originalData.contact_phone ||
    editData.business_number !== originalData.business_number ||
    editData.contract_start !== originalData.contract_start;

  if (!branch) return null;

  // 수정 저장
  const handleSave = async () => {
    if (!editData.name.trim()) {
      setError('지점명을 입력해주세요.');
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const updateData: Record<string, unknown> = {
        name: editData.name,
        type: editData.type,
        contact_phone: editData.contact_phone || null,
        business_number: editData.business_number || null,
        contract_start: editData.contract_start || null,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('tenants')
        .update(updateData)
        .eq('id', branch.id);

      if (updateError) {
        console.error('지점 업데이트 오류:', updateError);
        throw new Error('지점 정보 수정에 실패했습니다.');
      }

      alert('지점 정보가 성공적으로 수정되었습니다.');
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      console.error('지점 저장 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  // 수정 취소
  const handleCancel = () => {
    setEditData(originalData);
    setIsEditing(false);
    setError(null);
  };

  // 지점 삭제
  const handleDelete = async () => {
    if (!confirm(`정말로 "${branch.name}" 지점을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 해당 지점과 연결된 모든 데이터가 영향을 받을 수 있습니다.`)) {
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      // 지점에 소속된 사용자가 있는지 확인
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name')
        .eq('tenant_id', branch.id);

      if (usersError) {
        throw new Error('지점 사용자 확인 중 오류가 발생했습니다.');
      }

      if (usersData && usersData.length > 0) {
        alert(`이 지점에 ${usersData.length}명의 사용자가 소속되어 있습니다.\n먼저 사용자들을 다른 지점으로 이동시키거나 삭제해주세요.`);
        setUpdating(false);
        return;
      }

      // 지점 삭제 (하드 삭제)
      const { error: deleteError } = await supabase
        .from('tenants')
        .delete()
        .eq('id', branch.id);

      if (deleteError) {
        console.error('지점 삭제 오류:', deleteError);
        throw new Error('지점 삭제에 실패했습니다.');
      }

      alert('지점이 성공적으로 삭제되었습니다.');
      onUpdate();
      onClose();
    } catch (err) {
      console.error('지점 삭제 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-20"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 font-korean">
              지점 상세 정보 - {branch.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-korean">{error}</p>
            </div>
          )}

          {/* 기본 정보 섹션 */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 font-korean flex items-center gap-2 pb-2 border-b border-gray-200">
              기본 정보
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-korean">지점명</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    className="w-full text-sm text-black border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-korean"
                    disabled={updating}
                  />
                ) : (
                  <div className="text-sm font-medium text-gray-900 font-korean">{branch.name}</div>
                )}
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1 font-korean">지점 형식</label>
                {isEditing ? (
                  <select
                    value={editData.type}
                    onChange={(e) => setEditData({...editData, type: e.target.value as 'DEALER' | 'HQ'})}
                    className="w-full text-sm text-black border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-korean"
                    disabled={updating}
                  >
                    <option value="DEALER">대리점</option>
                    <option value="HQ">직영점</option>
                  </select>
                ) : (
                  <div className="text-sm text-gray-900 font-korean">
                    {branch.type === 'HQ' ? '직영점' : '대리점'}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-korean">생성일</label>
                <div className="text-sm text-gray-900">
                  {new Date(branch.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-korean">계약시작일</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editData.contract_start}
                    onChange={(e) => setEditData({...editData, contract_start: e.target.value})}
                    className="w-full text-sm text-black border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-korean"
                    disabled={updating}
                  />
                ) : (
                  <div className="text-sm text-gray-900">
                    {branch.contract_start ? new Date(branch.contract_start).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : '미설정'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 연락처 정보 섹션 */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 font-korean flex items-center gap-2 pb-2 border-b border-gray-200">
              연락처 정보
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-korean">점주명</label>
                {branch.owner_name ? (
                  <div className="text-sm text-gray-900 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    {branch.owner_name}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    미지정
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-korean">전화번호</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.contact_phone}
                    onChange={(e) => setEditData({...editData, contact_phone: e.target.value})}
                    placeholder="02-1234-5678"
                    className="w-full text-sm text-black border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-korean"
                    disabled={updating}
                  />
                ) : (
                  <div className="text-sm text-gray-900 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {branch.contact_phone || '미등록'}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-korean">사업자번호</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.business_number}
                    onChange={(e) => setEditData({...editData, business_number: e.target.value})}
                    placeholder="123-45-67890"
                    className="w-full text-sm text-black border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-korean"
                    disabled={updating}
                  />
                ) : (
                  <div className="text-sm text-gray-900 flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                    {branch.business_number || '미등록'}
                  </div>
                )}
              </div>
                  </div>
          </div>

          {/* 운영 현황 섹션 */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 font-korean flex items-center gap-2 pb-2 border-b border-gray-200">
              운영 현황
            </h4>
            
            <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{branch.quotation_count || 0}</p>
                    <p className="text-xs text-gray-600 font-korean">견적서</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{branch.customer_count || 0}</p>
                    <p className="text-xs text-gray-600 font-korean">고객</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between rounded-b-xl">
          <div>
            {!isEditing && (
              <button
                onClick={handleDelete}
                disabled={updating}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition-all font-korean border border-red-200 disabled:opacity-50"
              >
                지점 삭제
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={updating}
                  className="px-4 py-2 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-100 transition-all font-korean border border-gray-200 disabled:opacity-50"
                >
                  취소
                </button>
                {hasChanges && (
                  <button
                    onClick={handleSave}
                    disabled={updating}
                    className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-all font-korean disabled:opacity-50"
                  >
                    {updating ? '저장 중...' : '저장'}
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-100 transition-all font-korean border border-gray-200 flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  수정
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-100 transition-all font-korean border border-gray-200"
                >
                  닫기
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 메인 지점 관리 컴포넌트
export default function BranchManagement({ 
  showAddForm: externalShowAddForm, 
  setShowAddForm: externalSetShowAddForm 
}: { 
  showAddForm?: boolean; 
  setShowAddForm?: (show: boolean) => void; 
}) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { isAdmin } = usePermissions();
  const { validateAndRefreshSession } = useAuth();

  // 외부에서 showAddForm이 true로 변경되면 모달 열기
  React.useEffect(() => {
    if (externalShowAddForm) {
      setShowAddForm(true);
      externalSetShowAddForm?.(false); // 부모 상태 리셋
    }
  }, [externalShowAddForm, externalSetShowAddForm]);

  /**
   * 모달 열릴 때 body 스크롤 비활성화
   */
  useEffect(() => {
    if (selectedBranch || showAddForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedBranch, showAddForm]);

  /**
   * 지점 목록 로드
   * useCallback으로 메모이제이션하여 재사용
   */
  const loadBranches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 지점 기본 정보 조회 (기존 스키마 사용, 미배정 제외)
      const { data: branchData, error: branchError } = await supabase
        .from('tenants')
        .select(`
          *,
          users(name, email, role)
        `)
        .neq('id', UNASSIGNED_TENANT.ID)
        .order('created_at', { ascending: false });

      if (branchError) {
        console.error('지점 조회 오류:', branchError);
        throw new Error(`지점 정보를 불러오는데 실패했습니다: ${branchError.message}`);
      }

      if (!branchData) {
        setBranches([]);
        return;
      }

      // 각 지점의 견적서 수와 고객 수 조회
      const branchesWithStats = await Promise.all(
        branchData.map(async (branch) => {
          let quotationCount = 0;
          let customerCount = 0;

          try {
            // 견적서 수 조회 (기존 스키마 사용)
            const quotationResult = await supabase
              .from('quotes')
              .select('*', { count: 'exact', head: true })
              .eq('tenant_id', branch.id);
            
            quotationCount = quotationResult.count || 0;
          } catch (quotationError) {
            console.warn('견적서 수 조회 실패:', quotationError);
            // 테이블이 없는 경우 0으로 설정
          }

          try {
            // 고객 수 조회 (테이블이 존재하지 않을 수 있으므로 에러 처리)
            const customerResult = await supabase
              .from('customers')
              .select('*', { count: 'exact', head: true })
              .eq('tenant_id', branch.id);
            
            customerCount = customerResult.count || 0;
          } catch (customerError) {
            console.warn('고객 수 조회 실패:', customerError);
            // 테이블이 없는 경우 0으로 설정
          }

          // 점주 정보 찾기 (대리점 관리자 또는 직영점 관리자)
          const owner = branch.users?.find((user: { role: string }) =>
            user.role === 'DEALER_ADMIN' || user.role === 'OWNED_BRANCH_ADMIN'
          );

          return {
            ...branch,
            owner_name: owner?.name,
            owner_email: owner?.email,
            quotation_count: quotationCount,
            customer_count: customerCount
          };
        })
      );

      setBranches(branchesWithStats);
    } catch (err) {
      console.error('지점 로드 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 네트워크 재연결 시 세션 검증 및 데이터 재로드
  useNetworkReconnect({
    onReconnect: async () => {
      console.log('🔄 [지점 관리] 재연결 감지 - 세션 검증 및 데이터 재로드');
      
      // 1. 세션 검증 및 복구
      const isValid = await validateAndRefreshSession();
      
      // 2. 세션이 유효하면 데이터 재로드
      if (isValid) {
        await loadBranches();
      }
    },
    debounceMs: 2000, // 2초 디바운스
  });

  // 초기 데이터 로드
  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <div className="flex justify-center mb-4">
          <Lock className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 font-korean mb-2">
          관리자 권한 필요
        </h3>
        <p className="text-sm text-gray-600 font-korean">
          이 기능은 본사 관리자만 사용할 수 있습니다
        </p>
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
            <Building2 className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="flex justify-center mb-4">
          <XCircle className="w-12 h-12 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 font-korean mb-2">
          오류 발생
        </h3>
        <p className="text-sm text-gray-600 font-korean mb-4">{error}</p>
        <Button
          variant="primary"
          onClick={loadBranches}
        >
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 지점 상세 정보 모달 */}
      <BranchDetailModal
        branch={selectedBranch}
        onClose={() => setSelectedBranch(null)}
        onUpdate={() => {
          loadBranches();
          setSelectedBranch(null);
        }}
      />

      {/* 통계 카드 */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm">
        <div className="px-3 py-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 font-korean">
              지점 현황
            </h3>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-md p-2.5 text-center border border-gray-200">
              <div className="text-lg font-bold text-gray-900">{branches.length}</div>
              <div className="text-xs text-gray-500 font-korean">전체 지점</div>
            </div>

            <div className="bg-primary/5 rounded-md p-2.5 text-center border border-primary/20">
              <div className="text-lg font-bold text-primary">
                {branches.filter(b => b.type === 'HQ').length}
              </div>
              <div className="text-xs text-primary/70 font-korean">직영점</div>
            </div>

            <div className="bg-blue-50 rounded-md p-2.5 text-center border border-blue-200">
              <div className="text-lg font-bold text-blue-800">
                {branches.filter(b => b.type === 'DEALER').length}
              </div>
              <div className="text-xs text-blue-600 font-korean">대리점</div>
            </div>
          </div>
        </div>
      </div>

      {/* 지점 추가 폼 */}
      {showAddForm && (
        <AddBranchForm
          onBranchAdded={() => {
            setShowAddForm(false);
            loadBranches();
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* 지점 목록 */}
      <div className="bg-white rounded-md border border-gray-200 shadow-sm">
        <div className="px-3 py-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <MapPinned className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 font-korean">
              지점 목록 ({branches.filter(branch => 
                branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                branch.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                branch.contact_phone?.includes(searchTerm)
              ).length})
            </h3>
          </div>

          {/* 검색 영역 */}
          <div className="mb-3">
            <div className="relative">
              <input
                type="text"
                placeholder="지점명, 점주명, 전화번호로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-korean"
              />
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {branches.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <h3 className="text-base font-semibold text-gray-900 font-korean mb-2">
                등록된 지점이 없습니다
              </h3>
              <p className="text-sm text-gray-600 font-korean mb-4">
                첫 번째 지점을 추가해서 시작해보세요
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary/90 transition-all font-korean inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                지점 추가하기
              </button>
            </div>
          ) : (() => {
            // 검색 필터링
            const filteredBranches = branches.filter(branch => 
              branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              branch.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              branch.contact_phone?.includes(searchTerm)
            );

            // 가나다순 정렬
            const sortedBranches = [...filteredBranches].sort((a, b) => 
              a.name.localeCompare(b.name, 'ko-KR')
            );

            return sortedBranches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedBranches.map((branch) => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  onViewDetails={setSelectedBranch}
                />
              ))}
            </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
                <div className="flex justify-center mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
        </div>
                <h3 className="text-base font-semibold text-gray-900 font-korean mb-2">
                  검색 결과가 없습니다
                </h3>
                <p className="text-sm text-gray-600 font-korean">
                  다른 검색어를 입력해보세요
                </p>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

