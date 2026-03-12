/**
 * 고객 관리 페이지
 * 
 * 고객 정보를 관리하고 조회하는 페이지입니다.
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { SubscriptionGuard } from '@/components/auth/PermissionGuard';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  MapPin,
  Calendar,
  Edit2,
  Trash2,
  Filter,
  X,
  User
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

/**
 * 고객 정보 타입
 */
interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string; // 주소
  status: '상담대기' | '사진요청' | '부재중' | '견적요청' | '고민중' | '상담종료' | '시공완료';
  issues: string[]; // 문제 목록: 외풍, 벌레유입, 소음, 먼지, 악취, 방충망노후, 먼지날림
  notes?: string; // 메모
  desired_quote_date?: string; // 견적희망일자
  created_at: string;
  tenant_id: string; // 고객이 속한 대리점/지점 ID
  tenant_name?: string; // 대리점/지점 이름
}

export default function CustomersPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading, permissionChecker } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tenantMap, setTenantMap] = useState<Record<string, string>>({}); // tenant_id -> name 매핑
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState({
    statuses: [] as string[],
    tenantIds: [] as string[],
    issues: [] as string[],
    dateRange: 'all' as 'all' | '7d' | '30d' | '90d'
  });
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    status: '상담대기' as Customer['status'],
    issues: [] as string[],
    notes: '',
    desired_quote_date: ''
  });

  // 인증 체크 및 승인 상태 체크
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // 로그인하지 않은 사용자는 로그인 페이지로
        router.replace('/login');
      } else if (userProfile && !userProfile.is_active) {
        // 승인 대기 중인 사용자는 승인 대기 페이지로
        router.replace('/pending-approval');
      }
    }
  }, [user, userProfile, authLoading, router]);

  /**
   * 인증 토큰 가져오기
   */
  const getAuthToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || '';
  };

  /**
   * 대리점/지점 정보 조회
   */
  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name');

      if (error) {
        console.error('대리점 정보 조회 오류:', error);
        return;
      }

      // tenant_id를 키로, tenant_name을 값으로 하는 맵 생성
      const map: Record<string, string> = {};
      data?.forEach((tenant: any) => {
        if (tenant.id && tenant.name) {
          map[tenant.id] = tenant.name;
        }
      });
      
      setTenantMap(map);
    } catch (error) {
      console.error('대리점 정보 조회 오류:', error);
    }
  };

  /**
   * 고객 목록 조회
   * API 라우트를 통해 암호화된 개인정보를 자동으로 복호화하여 조회합니다.
   * 권한에 따라 필터링:
   * - 본사(HQ_ADMIN): 모든 대리점의 고객 조회
   * - 대리점(DEALER_ADMIN, DEALER_STAFF): 본인 소속 대리점 고객만 조회
   * - 직영점(OWNED_BRANCH_ADMIN, OWNED_BRANCH_STAFF): 본인 소속 직영점 고객만 조회
   */
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      if (!userProfile || !permissionChecker) {
        setCustomers([]);
        return;
      }

      // 권한 확인
      const isHqAdmin = permissionChecker.isAdmin();
      const userTenantId = userProfile.tenant_id;

      // 인증 토큰 가져오기
      const token = await getAuthToken();

      // API 라우트를 통해 고객 데이터 조회 (자동 복호화)
      const url = isHqAdmin 
        ? '/api/customers'
        : `/api/customers?tenant_id=${userTenantId}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('고객 정보를 조회할 수 없습니다.');
      }

      const { data } = await response.json();

      console.log(
        isHqAdmin 
          ? `본사 관리자 - 모든 고객 조회: ${data?.length || 0}명`
          : `대리점/직영점 (${userTenantId}) - 소속 고객만 조회: ${data?.length || 0}명`
      );

      setCustomers(data || []);
    } catch (error) {
      console.error('고객 목록 조회 오류:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile && permissionChecker) {
      if (permissionChecker.isAdmin()) {
        fetchTenants();
      }
      fetchCustomers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, permissionChecker]);

  // 모달이 열려있을 때 body 스크롤 방지
  useEffect(() => {
    if (showModal || showDetailModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal, showDetailModal]);

  /**
   * 검색 및 필터링된 고객 목록
   */
  const filteredCustomers = customers.filter(customer => {
    // 1. 검색어 필터
    const matchesSearch = !searchTerm || 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. 상태 필터
    const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(customer.status);
    
    // 3. 지점 필터
    const matchesTenant = filters.tenantIds.length === 0 || filters.tenantIds.includes(customer.tenant_id);
    
    // 4. 문제 필터 (하나라도 일치하면)
    const matchesIssues = filters.issues.length === 0 || 
      filters.issues.some(issue => customer.issues?.includes(issue));
    
    // 5. 날짜 필터
    const matchesDate = (() => {
      if (filters.dateRange === 'all') return true;
      const createdDate = new Date(customer.created_at);
      const now = new Date();
      const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
      const daysAgo = daysMap[filters.dateRange];
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      return createdDate >= cutoffDate;
    })();
    
    return matchesSearch && matchesStatus && matchesTenant && matchesIssues && matchesDate;
  });

  /**
   * 날짜별로 고객 그룹화
   */
  const customersByDate = useMemo(() => {
    const grouped: Record<string, Customer[]> = {};
    
    filteredCustomers.forEach(customer => {
      const dateKey = new Date(customer.created_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(customer);
    });
    
    return grouped;
  }, [filteredCustomers]);

  /**
   * 상태별 색상 반환
   */
  const getStatusColor = (status: Customer['status']) => {
    switch (status) {
      case '상담대기':
        return 'bg-gray-100 text-gray-700';
      case '사진요청':
        return 'bg-blue-100 text-blue-700';
      case '부재중':
        return 'bg-orange-100 text-orange-700';
      case '견적요청':
        return 'bg-purple-100 text-purple-700';
      case '고민중':
        return 'bg-yellow-100 text-yellow-700';
      case '상담종료':
        return 'bg-red-100 text-red-700';
      case '시공완료':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  /**
   * 문제 아이콘 반환
   */
  const getIssueIcon = (issue: string) => {
    const icons: Record<string, string> = {
      '외풍': '🌬️',
      '벌레유입': '🐛',
      '소음': '🔊',
      '먼지': '💨',
      '악취': '🤢',
      '방충망노후': '🪟',
      '먼지날림': '🌫️'
    };
    return icons[issue] || '❓';
  };

  /**
   * 모달 열기 (추가)
   */
  const handleAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      address: '',
      status: '상담대기',
      issues: [],
      notes: '',
      desired_quote_date: ''
    });
    setShowModal(true);
  };

  /**
   * 모달 열기 (수정)
   */
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      address: customer.address || '',
      status: customer.status,
      issues: customer.issues || [],
      notes: customer.notes || '',
      desired_quote_date: customer.desired_quote_date || ''
    });
    setShowModal(true);
  };

  /**
   * 필터 토글
   */
  const toggleFilter = (category: 'statuses' | 'tenantIds' | 'issues' | 'dateRange', value: string) => {
    if (category === 'dateRange') {
      setFilters(prev => ({ ...prev, dateRange: value as any }));
    } else {
      setFilters(prev => ({
        ...prev,
        [category]: prev[category].includes(value)
          ? prev[category].filter((v: string) => v !== value)
          : [...prev[category], value]
      }));
    }
  };

  /**
   * 필터 초기화
   */
  const clearFilters = () => {
    setFilters({
      statuses: [],
      tenantIds: [],
      issues: [],
      dateRange: 'all'
    });
  };

  /**
   * 활성 필터 개수
   */
  const activeFilterCount = filters.statuses.length + filters.tenantIds.length + filters.issues.length + (filters.dateRange !== 'all' ? 1 : 0);

  // 변경 사항 여부 및 유효성 검사
  const { hasChanges, isValid } = useMemo(() => {
    // 1. 필수값 검사 (전화번호만 필수)
    const valid = formData.phone.trim() !== '';
    
    // 2. 변경 사항 검사
    let changed = true;
    if (editingCustomer) {
      changed = (
        formData.name !== editingCustomer.name ||
        formData.phone !== editingCustomer.phone ||
        formData.address !== (editingCustomer.address || '') ||
        formData.status !== editingCustomer.status ||
        formData.notes !== (editingCustomer.notes || '') ||
        formData.desired_quote_date !== (editingCustomer.desired_quote_date || '') ||
        // 배열 비교 (정렬해서 비교)
        JSON.stringify([...formData.issues].sort()) !== JSON.stringify([...(editingCustomer.issues || [])].sort())
      );
    }

    return { hasChanges: changed, isValid: valid };
  }, [formData, editingCustomer]);

  /**
   * 고객 저장 (추가/수정)
   * API 라우트를 통해 개인정보를 자동으로 암호화하여 저장합니다.
   */
  const handleSave = async () => {
    try {
      if (!userProfile) return;

      // 인증 토큰 가져오기
      const token = await getAuthToken();

      if (editingCustomer) {
        // 수정
        const response = await fetch('/api/customers', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: editingCustomer.id,
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            status: formData.status,
            issues: formData.issues,
            notes: formData.notes,
            desired_quote_date: formData.desired_quote_date || null,
            updated_by: user?.id
          }),
        });

        if (!response.ok) {
          throw new Error('고객 정보를 수정할 수 없습니다.');
        }

        alert('고객 정보가 수정되었습니다.');
      } else {
        // 추가
        const response = await fetch('/api/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            status: formData.status,
            issues: formData.issues,
            notes: formData.notes,
            desired_quote_date: formData.desired_quote_date || null,
            tenant_id: userProfile.tenant_id,
            created_by: user?.id
          }),
        });

        if (!response.ok) {
          throw new Error('고객을 추가할 수 없습니다.');
        }

        alert('고객이 추가되었습니다.');
      }

      setShowModal(false);
      fetchCustomers();
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  /**
   * 고객 삭제
   */
  const handleDelete = async (customer: Customer) => {
    if (!confirm(`${customer.name || '이 고객'}을 삭제하시겠습니까?`)) return;

    try {
      // 인증 토큰 가져오기
      const token = await getAuthToken();

      const response = await fetch(`/api/customers?id=${customer.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('고객을 삭제할 수 없습니다.');
      }

      alert('고객이 삭제되었습니다.');
      fetchCustomers();
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  /**
   * 전화번호 포맷팅 (000-0000-0000)
   */
  const formatPhoneNumber = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '');
    
    // 최대 11자리까지만 허용
    const limitedNumbers = numbers.slice(0, 11);
    
    // 포맷팅
    if (limitedNumbers.length <= 3) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 7) {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3)}`;
    } else {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3, 7)}-${limitedNumbers.slice(7)}`;
    }
  };

  /**
   * 전화번호 입력 핸들러
   */
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  /**
   * 문제 토글
   */
  const toggleIssue = (issue: string) => {
    setFormData(prev => ({
      ...prev,
      issues: prev.issues.includes(issue)
        ? prev.issues.filter(i => i !== issue)
        : [...prev.issues, issue]
    }));
  };

  /**
   * 카드 클릭 - 상세보기
   */
  const handleCardClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };

  // 로딩 중
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="relative">
          {/* 외곽 회전 원 */}
          <div className="w-20 h-20 border-4 border-primary/20 rounded-full"></div>
          {/* 회전 애니메이션 원 */}
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
          {/* 중앙 아이콘 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Users className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // 인증되지 않은 사용자 또는 승인 대기 중인 사용자
  if (!user || (userProfile && !userProfile.is_active)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 통일된 헤더 */}
      <PageHeader />

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <SubscriptionGuard>

        {/* 페이지 타이틀과 추가 버튼 */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-korean">고객</h1>
            <p className="text-sm text-gray-500 mt-1">고객 정보를 조회하고 관리합니다</p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center justify-center w-12 h-12 bg-primary text-white rounded-full hover:bg-primary-hover transition-all shadow-md hover:shadow-lg active:scale-95 shrink-0"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* 검색 및 필터 - 모바일 최적화 */}
        <div className="mb-4 sm:mb-6 space-y-3">
          {/* 검색바 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="고객 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border-0 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 font-korean shadow-sm"
              />
            </div>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-korean shadow-sm transition-all ${
                showFilterPanel || activeFilterCount > 0
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700'
              }`}
            >
              <Filter size={18} />
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 bg-white text-primary rounded-full text-xs font-bold min-w-[20px] text-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* 필터 패널 */}
          {showFilterPanel && (
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4 border border-gray-100">
              {/* 상태 필터 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 font-korean">상태</label>
                  {filters.statuses.length > 0 && (
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, statuses: [] }))}
                      className="text-xs text-gray-500 hover:text-primary font-korean"
                    >
                      초기화
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {['상담대기', '사진요청', '부재중', '견적요청', '고민중', '상담종료', '시공완료'].map((status) => (
                    <button
                      key={status}
                      onClick={() => toggleFilter('statuses', status)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-korean transition-all border ${
                        filters.statuses.includes(status)
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* 지점 필터 (본사 관리자만) */}
              {permissionChecker?.isAdmin() && Object.keys(tenantMap).length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 font-korean">지점</label>
                    {filters.tenantIds.length > 0 && (
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, tenantIds: [] }))}
                        className="text-xs text-gray-500 hover:text-primary font-korean"
                      >
                        초기화
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(tenantMap).map(([id, name]) => (
                      <button
                        key={id}
                        onClick={() => toggleFilter('tenantIds', id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-korean transition-all border ${
                          filters.tenantIds.includes(id)
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 문제 필터 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 font-korean">문제 항목</label>
                  {filters.issues.length > 0 && (
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, issues: [] }))}
                      className="text-xs text-gray-500 hover:text-primary font-korean"
                    >
                      초기화
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {['외풍', '벌레유입', '소음', '먼지', '악취', '방충망노후', '먼지날림'].map((issue) => (
                    <button
                      key={issue}
                      onClick={() => toggleFilter('issues', issue)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-korean transition-all border ${
                        filters.issues.includes(issue)
                          ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {getIssueIcon(issue)} {issue}
                    </button>
                  ))}
                </div>
              </div>

              {/* 등록일 필터 */}
              <div>
                <label className="text-sm font-medium text-gray-700 font-korean mb-2 block">등록일</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: '전체' },
                    { value: '7d', label: '최근 7일' },
                    { value: '30d', label: '최근 30일' },
                    { value: '90d', label: '최근 90일' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => toggleFilter('dateRange', option.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-korean transition-all border ${
                        filters.dateRange === option.value
                          ? 'bg-green-600 text-white border-green-600 shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 전체 초기화 버튼 */}
              {activeFilterCount > 0 && (
                <div className="pt-2 border-t border-gray-200">
                  <button
                    onClick={clearFilters}
                    className="w-full py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all font-korean"
                  >
                    모든 필터 초기화
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 고객 목록 - 카드 스타일 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Users className="w-6 h-6 text-primary animate-pulse" />
              </div>
            </div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-korean">
              {searchTerm || activeFilterCount > 0 ? '검색 결과가 없습니다' : '등록된 고객이 없습니다'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(customersByDate).map(([date, customers]) => (
              <div key={date} className="space-y-2">
                {/* 날짜 표시 */}
                <div className="text-xs text-gray-400 font-korean pl-1">
                  {date}
                </div>

                {/* 해당 날짜의 고객 카드들 */}
                <div className="space-y-2.5">
                  {customers.map((customer) => (
                    <div 
                      key={customer.id}
                      className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer"
                      onClick={() => handleCardClick(customer)}
                    >
                      {/* 카드 내용 */}
                      <div className="p-4 sm:p-5 space-y-3 relative">
                        {/* 이름과 상태 */}
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-lg text-gray-900 font-korean">
                            {customer.name}
                          </h4>
                          <span className={`px-3 py-1.5 text-xs font-medium rounded-lg ${getStatusColor(customer.status)}`}>
                            {customer.status}
                          </span>
                        </div>

                        {/* 전화번호 */}
                        <div className="flex items-center gap-3">
                          <Phone size={18} className="text-gray-400 flex-shrink-0" />
                          <a 
                            href={`tel:${customer.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-base text-gray-900 hover:text-primary font-korean hover:underline"
                          >
                            {customer.phone}
                          </a>
                        </div>

                        {/* 주소 */}
                        {customer.address && (
                          <div className="flex items-start gap-3">
                            <MapPin size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <a
                                href={`https://map.naver.com/v5/search/${encodeURIComponent(customer.address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-base text-gray-700 hover:text-primary font-korean hover:underline inline"
                              >
                                {customer.address}
                              </a>
                            </div>
                          </div>
                        )}

                        {/* 관할지점 - 오른쪽 하단 */}
                        {permissionChecker?.isAdmin() && tenantMap[customer.tenant_id] && (
                          <div className="absolute bottom-3 right-4 text-xs text-gray-300 font-korean">
                            {tenantMap[customer.tenant_id]}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        </SubscriptionGuard>
      </main>

      {/* 고객 추가/수정 모달 */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-10"
          onClick={() => {
            setShowModal(false);
            if (editingCustomer) setShowDetailModal(true);
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3.5 flex items-center gap-2.5 rounded-t-xl z-10">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                {editingCustomer ? <Edit2 className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
              </div>
              <h3 className="text-base font-semibold text-gray-900 font-korean">
                {editingCustomer ? '고객 정보 수정' : '새 고객 추가'}
              </h3>
            </div>

            {/* 모달 본문 */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-4">
                {/* 전화번호 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-korean mb-2">
                    전화번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-korean"
                    placeholder="010-0000-0000"
                    maxLength={13}
                  />
                </div>

                {/* 상태 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-korean mb-2">
                    상태 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Customer['status'] })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-korean appearance-none"
                  >
                    <option value="상담대기">상담대기</option>
                    <option value="사진요청">사진요청</option>
                    <option value="부재중">부재중</option>
                    <option value="견적요청">견적요청</option>
                    <option value="고민중">고민중</option>
                    <option value="상담종료">상담종료</option>
                    <option value="시공완료">시공완료</option>
                  </select>
                </div>

                {/* 이름 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-korean mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-korean"
                    placeholder="고객명 입력"
                  />
                </div>

                {/* 주소 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-korean mb-2">
                        주소
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-korean"
                        placeholder="상세 주소 입력"
                      />
                    </div>

                    {/* 견적희망일자 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-korean mb-2">
                        견적희망일자
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={formData.desired_quote_date}
                          onChange={(e) => setFormData({ ...formData, desired_quote_date: e.target.value })}
                          className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-korean [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-clear-button]:hidden"
                          onClick={(e) => e.currentTarget.showPicker?.()}
                        />
                      </div>
                    </div>

                    {/* 문제 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-korean mb-2">
                        문제 항목
                      </label>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex flex-wrap gap-2">
                          {['외풍', '벌레유입', '소음', '먼지', '악취', '방충망노후', '먼지날림'].map((issue) => (
                            <button
                              key={issue}
                              type="button"
                              onClick={() => toggleIssue(issue)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-korean transition-all border ${
                                formData.issues.includes(issue)
                                  ? 'bg-primary text-white border-primary shadow-sm'
                                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              {getIssueIcon(issue)} {issue}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 메모 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-korean mb-2">
                        메모
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={4}
                        className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-korean resize-none"
                        placeholder="고객 관련 특이사항이나 메모를 입력하세요..."
                      />
                    </div>
              </div>
            </div>

            {/* 푸터 */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-5 py-3 flex items-center justify-end gap-2 rounded-b-xl z-10">
              <button
                onClick={() => {
                  setShowModal(false);
                  if (editingCustomer) setShowDetailModal(true);
                }}
                className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-all font-korean border border-gray-200 shadow-sm"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={!isValid || !hasChanges}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-all font-korean shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingCustomer ? '수정 완료' : '고객 추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상세보기 모달 */}
      {showDetailModal && selectedCustomer && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-10"
          onClick={() => setShowDetailModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3.5 flex items-center justify-between rounded-t-xl z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 font-korean">
                  고객 상세정보
                </h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-md"
              >
                <X size={20} />
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-6">
                {/* 기본 정보 섹션 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl text-gray-900 font-korean">
                      {selectedCustomer.name}
                    </h4>
                    <span className={`px-3 py-1.5 text-xs font-medium rounded-lg ${getStatusColor(selectedCustomer.status)}`}>
                      {selectedCustomer.status}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-600 font-korean w-16">등록일</span>
                      <span className="text-sm font-medium text-gray-900 font-korean">
                        {new Date(selectedCustomer.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-600 font-korean w-16">전화번호</span>
                      <a 
                        href={`tel:${selectedCustomer.phone}`}
                        className="text-sm text-gray-900 hover:text-primary font-korean hover:underline"
                      >
                        {selectedCustomer.phone}
                      </a>
                    </div>

                    {selectedCustomer.address && (
                      <div className="flex items-start gap-3">
                        <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600 font-korean w-16">주소</span>
                        <div className="flex-1">
                          <a
                            href={`https://map.naver.com/v5/search/${encodeURIComponent(selectedCustomer.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-gray-900 hover:text-primary font-korean hover:underline inline"
                          >
                            {selectedCustomer.address}
                          </a>
                        </div>
                      </div>
                    )}

                    {selectedCustomer.desired_quote_date && (
                      <div className="flex items-center gap-3">
                        <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600 font-korean w-16">희망일자</span>
                        <span className="text-sm font-medium text-gray-900 font-korean">
                          {new Date(selectedCustomer.desired_quote_date).toLocaleDateString('ko-KR', {
                            year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
                          })}
                        </span>
                      </div>
                    )}

                    {/* 관할지점 - 본사 관리자에게만 표시 */}
                    {permissionChecker?.isAdmin() && tenantMap[selectedCustomer.tenant_id] && (
                      <div className="flex items-center gap-3">
                        <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-600 font-korean w-16">관할지점</span>
                        <span className="text-sm font-medium text-blue-700 font-korean">
                          {tenantMap[selectedCustomer.tenant_id]}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 문제 목록 */}
                {selectedCustomer.issues && selectedCustomer.issues.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold text-gray-900 font-korean">문제 항목</h5>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex flex-wrap gap-2">
                        {selectedCustomer.issues.map((issue, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-md text-sm font-korean shadow-sm"
                          >
                            <span>{getIssueIcon(issue)}</span>
                            <span>{issue}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 메모 */}
                {selectedCustomer.notes && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold text-gray-900 font-korean">메모</h5>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-gray-800 font-korean whitespace-pre-wrap leading-relaxed">
                        {selectedCustomer.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-5 py-3 flex items-center justify-end gap-2 rounded-b-xl z-10">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleEdit(selectedCustomer);
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-all font-korean border border-gray-200 shadow-sm"
              >
                <Edit2 size={16} />
                수정
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleDelete(selectedCustomer);
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-all font-korean border border-red-200 shadow-sm"
              >
                <Trash2 size={16} />
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
