/**
 * 탭바 컴포넌트
 * 
 * 화면 하단에 고정되는 네비게이션 탭바입니다.
 * 메인 색상과 전체적인 디자인에 맞는 스타일을 적용합니다.
 */

'use client';

import React, { useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, 
  User, 
  Users,
  Settings, 
  FileText,
  Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/permissions';

/**
 * 탭 아이템 인터페이스
 */
interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: string;
  /** 특정 권한이 필요한 탭인지 여부 */
  requiresRole?: UserRole[];
}

/**
 * 탭바 컴포넌트 Props
 */
interface TabBarProps {
  /** 탭바를 숨길지 여부 */
  hidden?: boolean;
}

/**
 * 기본 탭 목록
 */
const defaultTabs: TabItem[] = [
  {
    id: 'home',
    label: '홈',
    icon: Home,
    path: '/home',
  },
  {
    id: 'quotation',
    label: '견적',
    icon: FileText,
    path: '/quotation',
  },
  {
    id: 'customers',
    label: '고객',
    icon: Users,
    path: '/customers',
  },
  {
    id: 'admin',
    label: '관리',
    icon: Shield,
    path: '/admin',
    requiresRole: [UserRole.HQ_ADMIN, UserRole.OWNED_BRANCH_ADMIN, UserRole.DEALER_ADMIN],
  },
  {
    id: 'settings',
    label: '설정',
    icon: Settings,
    path: '/settings',
  },
];

/**
 * 탭바 컴포넌트
 * 
 * @param hidden - 탭바를 숨길지 여부
 */
function TabBarComponent({ hidden = false }: TabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { userProfile } = useAuth();

  // 사용자 권한에 따라 탭 필터링 (메모이제이션)
  const visibleTabs = useMemo(() => defaultTabs.filter(tab => {
    if (!tab.requiresRole) return true;
    if (!userProfile) return false;
    return tab.requiresRole.includes(userProfile.role);
  }), [userProfile]);

  /**
   * 탭 클릭 핸들러
   * 현재 페이지와 동일한 탭을 클릭하면 소프트 리프레시합니다.
   */
  const handleTabClick = (path: string) => {
    const currentPath = pathname === '/' ? '/home' : pathname;

    // 현재 활성화된 탭을 다시 클릭한 경우 데이터만 소프트 리프레시
    if (currentPath === path || currentPath.startsWith(path)) {
      router.refresh();
    } else {
      // 다른 탭을 클릭한 경우 일반 네비게이션
      router.push(path);
    }
  };

  /**
   * 현재 활성 탭 확인
   */
  const isActiveTab = (path: string): boolean => {
    if (path === '/home') {
      return pathname === '/home' || pathname === '/';
    }
    return pathname.startsWith(path);
  };

  // 탭바 숨김 처리
  if (hidden) {
    return null;
  }

  return (
    <>
      {/* 탭바 높이만큼 하단 패딩 추가를 위한 스페이서 */}
      <div className="h-16" />
      
      {/* 탭바 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-inset">
        <div className="flex justify-around items-center h-16 px-1">
          {visibleTabs.map((tab) => {
            const isActive = isActiveTab(tab.path);
            const IconComponent = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.path)}
                className={`
                  flex flex-col items-center justify-center 
                  px-2 py-1 rounded-lg transition-all duration-200
                  min-w-0 flex-1 max-w-16
                  ${isActive 
                    ? 'text-primary bg-primary/5' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }
                `}
                aria-label={tab.label}
              >
                {/* 아이콘 */}
                <div className={`
                  mb-0.5 transition-transform duration-200
                  ${isActive ? 'scale-105' : 'scale-100'}
                `}>
                  <IconComponent 
                    size={20} 
                    className={`
                      ${isActive ? 'text-primary' : 'text-current'}
                    `}
                  />
                </div>
                
                {/* 라벨 */}
                <span className={`
                  text-xs font-korean font-medium leading-tight
                  ${isActive ? 'text-primary' : 'text-current'}
                `}>
                  {tab.label}
                </span>
                
              </button>
            );
          })}
        </div>
        
        {/* iOS Safari safe area 대응 */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </>
  );
}

/**
 * 탭바 아이템 컴포넌트 (개별 탭을 위한)
 */
interface TabBarItemProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export function TabBarItem({ icon: IconComponent, label, isActive, onClick }: TabBarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center 
        px-2 py-1 rounded-lg transition-all duration-200
        min-w-0 flex-1 max-w-16
        ${isActive 
          ? 'text-primary bg-primary/5' 
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }
      `}
      aria-label={label}
    >
      {/* 아이콘 */}
      <div className={`
        mb-0.5 transition-transform duration-200
        ${isActive ? 'scale-105' : 'scale-100'}
      `}>
        <IconComponent 
          size={20} 
          className={`
            ${isActive ? 'text-primary' : 'text-current'}
          `}
        />
      </div>
      
      {/* 라벨 */}
      <span className={`
        text-xs font-korean font-medium leading-tight
        ${isActive ? 'text-primary' : 'text-current'}
      `}>
        {label}
      </span>
      
    </button>
  );
}

export const TabBar = React.memo(TabBarComponent);
export default TabBar;
