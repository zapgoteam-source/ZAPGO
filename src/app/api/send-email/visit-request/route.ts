import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { phone, address, issues, notes, refCode } = await request.json();

    const row = (bg: boolean, label: string, value: string) => `
      <tr${bg ? ' style="background: #f9f9f9;"' : ''}>
        <td style="padding: 10px 12px; font-weight: bold; width: 140px; color: #555;">${label}</td>
        <td style="padding: 10px 12px;">${value}</td>
      </tr>`;

    const { error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'zapgoteam@gmail.com',
      subject: `[에너지잡고] 방문 견적 요청 — ${phone}${refCode ? ` [${refCode}]` : ''}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #111; border-bottom: 2px solid #b10000; padding-bottom: 8px;">
            새 방문 견적 요청이 접수되었습니다
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            ${row(true,  '연락처', phone)}
            ${row(false, '주소',   address || '미입력')}
            ${row(true,  '문제',   issues?.join(', ') || '미입력')}
            ${row(false, '메모',   notes || '없음')}
            ${row(true,  '대리점 코드', refCode || '직접 유입')}
          </table>
          <p style="margin-top: 24px; color: #888; font-size: 12px;">
            접수 시각: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend 오류:', error);
      return NextResponse.json({ error: '메일 발송 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('visit-request 이메일 오류:', err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
