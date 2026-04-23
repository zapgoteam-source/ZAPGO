import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const PLAN_LABEL: Record<string, string> = {
  main: '패브릭씰러 시공 (창문 탈거)',
  alt1: '일반 모헤어 시공 (평형 기준 간편 견적)',
  alt2: '측면 시공 (창문 미탈거)',
};

function formatKRW(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return amount.toLocaleString('ko-KR') + '원';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      phone,
      address,
      preferredDate,
      extraRequest,
      housingAreaPyeong,
      windowSashCount,
      selectedPlan,
      premiumProtection,
      pestSolution,
      pestScreenCount,
      issues,
      mainTotal,
      alt1Total,
      alt2Total,
      refCode,
    } = body;

    const options = [
      premiumProtection && '프리미엄 보양',
      pestSolution && `방충솔루션 (${pestScreenCount}개)`,
    ].filter(Boolean).join(', ');

    const row = (bg: boolean, label: string, value: string) => `
      <tr${bg ? ' style="background: #f9f9f9;"' : ''}>
        <td style="padding: 10px 12px; font-weight: bold; width: 140px; color: #555;">${label}</td>
        <td style="padding: 10px 12px;">${value}</td>
      </tr>`;

    const { error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'zapgoteam@gmail.com',
      subject: `[에너지잡고] 시공 요청 — ${name} (${phone})${refCode ? ` [${refCode}]` : ''}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #111; border-bottom: 2px solid #b10000; padding-bottom: 8px;">
            새 시공 요청이 접수되었습니다
          </h2>

          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            ${row(true,  '이름',           name)}
            ${row(false, '연락처',         phone)}
            ${row(true,  '주소',           address || '미입력')}
            ${row(false, '희망 시공일',    preferredDate || '미정')}
            ${row(true,  '겪고있는 문제',  issues || '미입력')}
            ${row(false, '평형',           `${housingAreaPyeong}평`)}
            ${row(true,  '창짝 개수',      `${windowSashCount}개`)}
            ${row(false, '선택 시공방식',  `${PLAN_LABEL[selectedPlan] ?? selectedPlan} · ${formatKRW(selectedPlan === 'alt1' ? alt1Total : selectedPlan === 'alt2' ? alt2Total : mainTotal)}`)}
            ${row(true,  '추가 옵션',      options || '없음')}
            ${row(false, '패씰 견적 (VAT포함)',       formatKRW(mainTotal))}
            ${row(true,  '일반모헤어 견적 (간편/VAT 미포함)', formatKRW(alt1Total))}
            ${row(false, '측면시공 견적 (VAT포함)',   formatKRW(alt2Total))}
            ${row(true,  '추가 요청',      extraRequest || '없음')}
            ${row(false, '대리점 코드',    refCode || '직접 유입')}
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
    console.error('send-email 오류:', err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
