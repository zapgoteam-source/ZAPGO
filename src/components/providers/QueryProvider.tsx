'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000,   // 2분 캐시 (이 시간 내 재방문 시 네트워크 요청 없음)
            gcTime: 10 * 60 * 1000,     // 10분 후 메모리에서 제거
            retry: 2,                   // 실패 시 2회 재시도
            refetchOnWindowFocus: true, // 탭 복귀 시 자동 갱신
          },
        },
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
