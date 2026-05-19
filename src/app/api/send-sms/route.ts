import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const response = await fetch(`${request.nextUrl.origin}/api/send-estimate-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  return NextResponse.json(payload ?? { error: '견적 링크 발송 실패' }, { status: response.status });
}
