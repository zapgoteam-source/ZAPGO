/**
 * 견적서 페이지
 * 
 * 견적서 관리 기능을 제공하는 페이지입니다.
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { SubscriptionGuard } from '@/components/auth/PermissionGuard';
import { FileText, Plus, Search, Filter } from 'lucide-react';

export default function QuotationPage() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();

  // 인증 체크 및 승인 상태 체크
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // 로그인하지 않은 사용자는 로그인 페이지로
        router.replace('/login');
      } else if (userProfile && !userProfile.is_active) {
        // 승인 대기 중인 사용자는 승인 대기 페이지로
        router.replace('/pending-approval');
      }
    }
  }, [user, userProfile, loading, router]);

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="relative">
          {/* 외곽 회전 원 */}
          <div className="w-20 h-20 border-4 border-primary/20 rounded-full"></div>
          {/* 회전 애니메이션 원 */}
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
          {/* 중앙 아이콘 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <FileText className="w-8 h-8 text-primary animate-pulse" />
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
    <div className="bg-gray-50">
      {/* 통일된 헤더 */}
      <PageHeader />

      {/* 메인 콘텐츠 */}
      <main className="px-4 sm:px-6 lg:px-8 py-6">
        <SubscriptionGuard>
        {/* 상단 액션 영역 */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 font-korean">견적서 목록</h2>
            <p className="text-sm text-gray-600 font-korean">등록된 견적서를 관리하세요</p>
          </div>
          <Button variant="primary" size="sm" className="flex items-center gap-2 font-korean">
            <Plus size={16} />
            새 견적서
          </Button>
        </div>

        {/* 필터 및 검색 */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="견적서 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-korean"
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter size={16} />
            필터
          </Button>
        </div>

        {/* 견적서 목록 */}
        <div className="bg-white rounded-lg shadow">
          {/* 빈 상태 */}
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 font-korean">
              아직 견적서가 없습니다
            </h3>
            <p className="text-gray-600 mb-6 font-korean">
              첫 번째 견적서를 작성해보세요
            </p>
            <Button variant="primary" className="flex items-center gap-2 mx-auto">
              <Plus size={16} />
              견적서 작성하기
            </Button>
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 font-korean">최근 활동</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-center text-gray-500 font-korean">
              최근 활동이 없습니다
            </p>
          </div>
        </div>
        </SubscriptionGuard>
      </main>
    </div>
  );
}
