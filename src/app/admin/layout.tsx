'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  HardHat,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/customers', label: '고객 관리', icon: Users },
  { href: '/admin/estimate', label: '견적 목록', icon: FileText },
  { href: '/worker/list', label: '시공 현황', icon: HardHat },
];

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': '대시보드',
  '/admin/customers': '고객 관리',
  '/admin/estimate': '견적 목록',
  '/admin/users': '사용자 관리',
  '/admin/subscription': '구독 관리',
  '/worker/list': '시공 현황',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, role, loading, profileReady, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);

  // 프로필 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pageTitle = Object.entries(PAGE_TITLES).find(([key]) =>
    pathname === key || pathname.startsWith(key + '/')
  )?.[1] ?? '관리자';

  const displayName = userProfile?.name || user?.email?.split('@')[0] || '관리자';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  // 로그인 페이지는 가드 제외
  const isLoginPage = pathname === '/admin/login';

  // auth 세션 + 프로필 양쪽 모두 확인될 때까지 로딩 처리
  const isGenuinelyLoading = loading || !profileReady;

  useEffect(() => {
    if (isLoginPage || isGenuinelyLoading) return;
    if (!user || role !== 'ADMIN') {
      // 이미 로그인 페이지면 재진입 방지
      if (pathname !== '/admin/login') router.replace('/admin/login');
    }
  }, [user, role, isGenuinelyLoading, isLoginPage, pathname, router]);

  const handleLogout = async () => {
    await signOut();
    router.replace('/admin/login');
  };

  // 로그인 페이지는 사이드바 없이 렌더
  if (isLoginPage) return <>{children}</>;

  // 진짜 로딩 중이거나, 권한이 없을 때만 스피너
  if (isGenuinelyLoading || !user || role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? '' : ''}`}>
      {/* 로고 */}
      <div className="px-6 py-4 border-b border-gray-100">
        <img src="/LOGO_BK.webp" alt="에너지잡고" className="h-8 w-auto" draggable={false} />
        <p className="text-xs text-gray-400 mt-1.5">관리자</p>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* 로그아웃 */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} />
          로그아웃
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 데스크탑 사이드바 */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-30">
        <Sidebar />
      </aside>

      {/* 모바일 사이드바 오버레이 */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex flex-col w-64 bg-white z-50">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <Sidebar mobile />
          </aside>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">

        {/* 상단 헤더 (모바일 + 데스크탑 공용) */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3 px-4 md:px-6 h-14">

            {/* 모바일 햄버거 */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1 text-gray-600 hover:text-gray-900"
            >
              <Menu size={22} />
            </button>

            {/* 페이지 타이틀 (데스크탑) */}
            <h1 className="hidden md:block text-base font-bold text-gray-900 shrink-0">
              {pageTitle}
            </h1>
            {/* 페이지 타이틀 (모바일) */}
            <h1 className="md:hidden text-sm font-bold text-gray-900 shrink-0">
              {pageTitle}
            </h1>

            {/* 검색창 */}
            <div className="flex-1 max-w-sm mx-2 md:mx-4 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="고객명, 연락처 검색..."
                className="w-full pl-8 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-100 transition"
              />
            </div>

            <div className="flex items-center gap-1 ml-auto">
              {/* 알림 버튼 */}
              <button className="relative p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell size={18} />
              </button>

              {/* 프로필 드롭다운 */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">
                    {avatarLetter}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown size={14} className={`hidden md:block text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={15} />
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
