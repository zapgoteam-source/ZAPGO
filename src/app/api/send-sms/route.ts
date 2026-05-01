import { NextRequest, NextResponse } from 'next/server';
import { SolapiMessageService } from 'solapi';

const messageService = new SolapiMessageService(
  process.env.SOLAPI_API_KEY!,
  process.env.SOLAPI_API_SECRET!
);

const SENDER = process.env.SOLAPI_SENDER!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, link } = body as { phone?: string; link?: string };

    if (!phone || !link) {
      return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
    }

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      return NextResponse.json({ error: '올바르지 않은 전화번호' }, { status: 400 });
    }

    await messageService.send({
      to: digits,
      from: SENDER,
      text: `[에너지잡고] 셀프견적 결과 다시보기\n${link}`,
    });

    // 고객 테이블에 리드로 저장
    try {
      const base = request.nextUrl.origin;
      await fetch(`${base}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '',
          phone,
          address: '',
          status: 'NEW',
          issues: [],
          notes: `결과 다시보기 링크 요청 / ${link}`,
          desired_quote_date: null,
          tenant_id: null,
          created_by: null,
        }),
      });
    } catch (err) {
      console.error('리드 저장 실패:', err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('SMS 발송 오류:', err);
    return NextResponse.json({ error: 'SMS 발송 실패' }, { status: 500 });
  }
}
