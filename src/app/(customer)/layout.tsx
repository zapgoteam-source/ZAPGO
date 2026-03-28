/**
 * 고객 라우트 그룹 레이아웃
 * 사이드바 없는 단순 레이아웃
 */

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-sm">
        {children}
      </div>
    </div>
  );
}
