import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const PLAN_LABEL: Record<string, string> = {
  main: '패브릭씰러 탈거 4면',
  alt1: '일반 모헤어 4면',
  alt2: '패브릭씰러 측면만',
};

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
    } = body;

    const options = [
      premiumProtection && '프리미엄 보양',
      pestSolution && `방충솔루션 (${pestScreenCount}개)`,
    ].filter(Boolean).join(', ');

    const { error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'zapgoteam@gmail.com',
      subject: `[에너지잡고] 시공 요청 — ${name} (${phone})`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #111; border-bottom: 2px solid #b10000; padding-bottom: 8px;">
            새 시공 요청이 접수되었습니다
          </h2>

          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr style="background: #f9f9f9;">
              <td style="padding: 10px 12px; font-weight: bold; width: 120px; color: #555;">이름</td>
              <td style="padding: 10px 12px;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; font-weight: bold; color: #555;">연락처</td>
              <td style="padding: 10px 12px;">${phone}</td>
            </tr>
            <tr style="background: #f9f9f9;">
              <td style="padding: 10px 12px; font-weight: bold; color: #555;">주소</td>
              <td style="padding: 10px 12px;">${address || '미입력'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; font-weight: bold; color: #555;">희망 시공일</td>
              <td style="padding: 10px 12px;">${preferredDate || '미정'}</td>
            </tr>
            <tr style="background: #f9f9f9;">
              <td style="padding: 10px 12px; font-weight: bold; color: #555;">평형</td>
              <td style="padding: 10px 12px;">${housingAreaPyeong}평</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; font-weight: bold; color: #555;">창짝 수</td>
              <td style="padding: 10px 12px;">${windowSashCount}짝</td>
            </tr>
            <tr style="background: #f9f9f9;">
              <td style="padding: 10px 12px; font-weight: bold; color: #555;">시공 방식</td>
              <td style="padding: 10px 12px;">${PLAN_LABEL[selectedPlan] ?? selectedPlan}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; font-weight: bold; color: #555;">추가 옵션</td>
              <td style="padding: 10px 12px;">${options || '없음'}</td>
            </tr>
            <tr style="background: #f9f9f9;">
              <td style="padding: 10px 12px; font-weight: bold; color: #555;">추가 요청</td>
              <td style="padding: 10px 12px;">${extraRequest || '없음'}</td>
            </tr>
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
