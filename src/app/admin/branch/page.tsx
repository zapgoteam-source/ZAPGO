/**
 * 지점 관리 페이지
 * 
 * 지점(테넌트) 등록, 수정, 삭제 기능을 제공합니다.
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminGuard } from '@/components/guards/PermissionGuard';
import { PageHeader } from '@/components/layout/PageHeader';
import BranchManagement from '@/components/admin/BranchManagement';
import { Building2, ArrowLeft, Plus } from 'lucide-react';

/**
 * 지점 관리 페이지 컴포넌트
 */
export default function BranchManagementPage() {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);

  // 인증 체크 및 리다이렉션
  React.useEffect(() => {
    // 로그아웃 중이면 리다이렉션 중단
    if (typeof window !== 'undefined' && (window as any).__LOGOUT_IN_PROGRESS__) {
      return;
    }
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* 통일된 헤더 */}
      <PageHeader />

      {/* 메인 컨텐츠 */}
      <main className="px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* 뒤로가기 + 페이지 제목 */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 text-gray-600 hover:text-primary active:scale-95 transition-all mb-4 select-none"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium font-korean">관리자 대시보드</span>
            </button>
            
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-korean">
                    지점 관리
                  </h1>
                  <p className="text-sm text-gray-600 font-korean mt-1">
                    지점(테넌트)을 등록, 수정, 삭제할 수 있습니다
                  </p>
                </div>
              </div>
              
              {/* 추가 버튼 */}
              <button
                onClick={() => setShowAddForm(true)}
                className="flex-shrink-0 p-2.5 bg-primary hover:bg-primary/90 active:scale-95 transition-all"
              >
                <Plus size={20} className="text-white" />
              </button>
            </div>
          </div>

          {/* 관리자 권한 체크 */}
          <AdminGuard 
            fallback={
              <div className="bg-white border border-gray-200 p-6 text-center">
                <div className="flex justify-center mb-4">
                  <Building2 className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 font-korean mb-2">
                  관리자 권한 필요
                </h3>
                <p className="text-sm text-gray-600 font-korean">
                  이 기능은 본사 관리자만 사용할 수 있습니다
                </p>
              </div>
            }
          >
            {/* 지점 관리 컴포넌트 */}
            <BranchManagement 
              showAddForm={showAddForm}
              setShowAddForm={setShowAddForm}
            />
          </AdminGuard>
        </div>
      </main>
    </div>
  );
}

