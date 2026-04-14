'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUpWithEmail } from '@/lib/supabase';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agreedAll, setAgreedAll] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacyName, setAgreedPrivacyName] = useState(false);
  const [agreedPrivacyPhone, setAgreedPrivacyPhone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const allRequired =
    name.trim() &&
    phone.replace(/\D/g, '').length >= 10 &&
    userId.trim() &&
    password &&
    agreedTerms &&
    agreedPrivacyName &&
    agreedPrivacyPhone;

  const syncAll = (terms: boolean, privName: boolean, privPhone: boolean) => {
    setAgreedAll(terms && privName && privPhone);
  };

  const handleToggleAll = (checked: boolean) => {
    setAgreedAll(checked);
    setAgreedTerms(checked);
    setAgreedPrivacyName(checked);
    setAgreedPrivacyPhone(checked);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!/^[a-zA-Z0-9_]{4,20}$/.test(userId)) {
      setError('아이디는 영문·숫자·밑줄(_) 4~20자로 입력해 주세요.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    const email = `${userId}@zapgo.kr`;
    const { error: signUpError } = await signUpWithEmail(email, password, name);
    setLoading(false);

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('이미 사용 중인 아이디입니다.');
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
          가입이 완료되었습니다.<br />
          아이디로 로그인해 주세요.
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

      <form onSubmit={handleSubmit} className="flex-1 space-y-4">

        {/* 이름 */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            이름 <span className="text-red-500 text-xs font-normal">필수</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            className="w-full px-4 py-3 border border-gray-200 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition"
          />
          <p className="text-xs text-gray-400 mt-1">수집 목적: 서비스 제공 및 회원 식별</p>
        </div>

        {/* 연락처 */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            연락처 <span className="text-red-500 text-xs font-normal">필수</span>
          </label>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
              let formatted = digits;
              if (digits.length > 3 && digits.length <= 7) {
                formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
              } else if (digits.length > 7) {
                formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
              }
              setPhone(formatted);
            }}
            placeholder="010-0000-0000"
            className="w-full px-4 py-3 border border-gray-200 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition"
          />
          <p className="text-xs text-gray-400 mt-1">수집 목적: 견적 안내 및 서비스 연락</p>
        </div>

        {/* 아이디 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">아이디</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
            required
            placeholder="영문·숫자·밑줄(_) 4~20자"
            className="w-full px-4 py-3 border border-gray-200 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition"
          />
        </div>

        {/* 비밀번호 */}
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

        {/* 비밀번호 확인 */}
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

        {/* 약관 동의 */}
        <div className="pt-2 space-y-3">
          <label className="flex items-center gap-3 p-4 bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedAll}
              onChange={(e) => handleToggleAll(e.target.checked)}
              className="w-5 h-5 accent-yellow-400"
            />
            <span className="font-semibold text-gray-900">전체 동의</span>
          </label>

          <div className="border border-gray-100 divide-y divide-gray-100">
            {/* 이용약관 */}
            <label className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => {
                  setAgreedTerms(e.target.checked);
                  syncAll(e.target.checked, agreedPrivacyName, agreedPrivacyPhone);
                }}
                className="w-5 h-5 accent-yellow-400"
              />
              <div className="flex-1">
                <span className="text-sm text-gray-700">
                  <span className="text-yellow-500 font-semibold">[필수]</span> 서비스 이용약관 동의
                </span>
              </div>
              <a
                href="/terms"
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600 shrink-0"
              >
                보기
              </a>
            </label>

            {/* 개인정보 — 이름 (필수) */}
            <div className="px-4 py-3.5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedPrivacyName}
                  onChange={(e) => {
                    setAgreedPrivacyName(e.target.checked);
                    syncAll(agreedTerms, e.target.checked, agreedPrivacyPhone);
                  }}
                  className="w-5 h-5 accent-yellow-400"
                />
                <div className="flex-1">
                  <span className="text-sm text-gray-700">
                    <span className="text-yellow-500 font-semibold">[필수]</span> 개인정보 수집·이용 동의 — 이름
                  </span>
                </div>
                <a
                  href="/privacy"
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600 shrink-0"
                >
                  보기
                </a>
              </label>
              <div className="mt-2 ml-8 text-xs text-gray-400 space-y-0.5">
                <p>· 수집 항목: 이름</p>
                <p>· 수집 조건: 필수 (미동의 시 서비스 이용 불가)</p>
                <p>· 보유 기간: 회원 탈퇴 시까지</p>
              </div>
            </div>

            {/* 개인정보 — 연락처 (필수) */}
            <div className="px-4 py-3.5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedPrivacyPhone}
                  onChange={(e) => {
                    setAgreedPrivacyPhone(e.target.checked);
                    syncAll(agreedTerms, agreedPrivacyName, e.target.checked);
                  }}
                  className="w-5 h-5 accent-yellow-400"
                />
                <div className="flex-1">
                  <span className="text-sm text-gray-700">
                    <span className="text-yellow-500 font-semibold">[필수]</span> 개인정보 수집·이용 동의 — 연락처
                  </span>
                </div>
                <a
                  href="/privacy"
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600 shrink-0"
                >
                  보기
                </a>
              </label>
              <div className="mt-2 ml-8 text-xs text-gray-400 space-y-0.5">
                <p>· 수집 항목: 연락처(전화번호)</p>
                <p>· 수집 조건: 필수 (미동의 시 서비스 이용 불가)</p>
                <p>· 보유 기간: 회원 탈퇴 시까지</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !allRequired}
          className="w-full py-4 bg-[#FEE500] text-[#191919] font-bold text-base disabled:opacity-50 transition-opacity"
        >
          {loading ? '가입 중...' : '동의하고 가입하기'}
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
