import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Strict Mode 비활성화 (개발 모드에서 2번 렌더링 방지)
  reactStrictMode: false,
  
  // 개발 서버 설정
  // 참고: Cross-origin 경고는 현재 버전에서는 무시해도 됩니다
  // 향후 Next.js 버전에서 allowedDevOrigins 설정이 정식 지원될 예정입니다
};

export default nextConfig;

