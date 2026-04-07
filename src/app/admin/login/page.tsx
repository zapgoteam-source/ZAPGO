'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLoginPage() {
  const { signInWithEmail, user, role, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    if (role === 'ADMIN') {
      router.replace('/admin/dashboard');
    } else if (role === 'WORKER') {
      router.replace('/worker/list');
    } else if (role === 'AGENCY') {
      router.replace('/agency/dashboard');
    } else if (role !== null) {
      setError('접근 권한이 없는 계정입니다.');
    }
  }, [user, role, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        return;
      }
      // role은 onAuthStateChange 후 로드됨 — useEffect에서 리다이렉트 처리
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gray-900 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-white">Z</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">에너지잡고</h1>
          <p className="text-sm text-gray-500 mt-1">직원 로그인</p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@example.com"
              className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="비밀번호 입력"
              className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="w-full py-3.5 bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="text-center mt-6">
          <a href="/login" className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2">
            고객 로그인으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
