'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUpWithEmail } from '@/lib/supabase';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    const { error: signUpError } = await signUpWithEmail(email, password, name);
    setLoading(false);

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('이미 가입된 이메일입니다.');
      } else {
        setError(signUpError.message);
      }
      return;
    }

    setDone(true);
  };

  if (done) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-white max-w-md mx-auto px-6 text-center">
        <div className="w-16 h-16 bg-yellow-100 flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#CA8A04" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">가입 완료!</h2>
        <p className="text-sm text-gray-500 mb-6">
          입력하신 이메일로 확인 메일을 보냈습니다.<br />
          메일 확인 후 로그인해 주세요.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="w-full py-3.5 bg-[#FEE500] text-[#191919] font-bold text-sm"
        >
          로그인하러 가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-white max-w-md mx-auto px-6">
      {/* 헤더 */}
      <div className="flex flex-col items-center pt-12 pb-8">
        <Link href="/">
          <img src="/LOGO_BK.webp" alt="에너지잡고" className="h-12 w-auto" draggable={false} />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 mt-5">회원가입</h1>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="flex-1 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="홍길동"
            className="w-full px-4 py-3 border border-gray-200 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="example@email.com"
            className="w-full px-4 py-3 border border-gray-200 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="8자 이상"
            className="w-full px-4 py-3 border border-gray-200 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호 확인</label>
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            placeholder="비밀번호 재입력"
            className="w-full px-4 py-3 border border-gray-200 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <p className="text-xs text-gray-400">
          가입 시{' '}
          <Link href="/terms" className="underline underline-offset-2 hover:text-gray-600">이용약관</Link>
          {' '}및{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-gray-600">개인정보 처리방침</Link>
          에 동의합니다.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[#FEE500] text-[#191919] font-bold text-base disabled:opacity-50 transition-opacity"
        >
          {loading ? '가입 중...' : '가입하기'}
        </button>
      </form>

      <div className="py-8 text-center">
        <p className="text-sm text-gray-500">
          이미 회원이신가요?{' '}
          <Link href="/login" className="font-semibold text-gray-800 underline underline-offset-2">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
