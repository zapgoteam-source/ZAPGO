/**
 * 404 Not Found 페이지
 * 
 * 사용자가 존재하지 않는 페이지에 접근했을 때 표시되는 페이지입니다.
 * 친근한 메시지와 함께 홈으로 돌아갈 수 있는 링크를 제공합니다.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-primary p-8 max-w-md">
          {/* 로고 */}
          <div className="mb-6">
            <Logo size="lg" />
          </div>
          
          {/* 404 숫자 */}
          <div className="text-8xl font-bold mb-4 opacity-20 font-english">
            404
          </div>
          
          {/* 제목 */}
          <h1 className="text-3xl font-bold mb-6 font-korean">
            페이지를 찾을 수 없습니다
          </h1>
          
          {/* 설명 */}
          <p className="text-lg mb-8 font-korean leading-relaxed text-gray-600">
            요청하신 페이지가 존재하지 않거나 
            이동되었을 수 있습니다.
          </p>
          
          {/* 홈으로 돌아가기 버튼 */}
          <Link href="/">
            <Button variant="primary" size="lg">
              홈으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
