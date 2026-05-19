import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { formatKoreanDateTime, getRegionFromAddress, translateIssues } from '@/lib/selfEstimate';

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function row(index: number, label: string, value: unknown) {
  return `
    <tr style="background:${index % 2 === 0 ? '#f7f7f7' : '#ffffff'};">
      <td style="padding:14px 16px;font-weight:700;width:170px;color:#4a4a4a;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:14px 16px;color:#222;line-height:1.6;">${escapeHtml(value || '미입력')}</td>
    </tr>`;
}

function buildTable(rows: Array<[string, unknown]>) {
  return rows.map(([label, value], index) => row(index, label, value)).join('');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type = 'consult',
      buttonClickedAt,
      submittedAt,
      phone,
      address,
      issues,
      pyeong,
      sash,
      selectedPlan,
      protectionOption,
      includeRailMohair,
      pestSolution,
      selectedEstimate,
      fabricBaseEstimate,
      mohairBaseEstimate,
      sideBaseEstimate,
      notes,
      refCode,
    } = body;

    const region = getRegionFromAddress(address || '');
    const isFollowup = type === 'followup';
    const title = isFollowup ? '상담 미신청 고객 정보가 접수되었습니다' : '새 상담 요청이 접수되었습니다';
    const subject = isFollowup ? `[미상담고객] ${region} / ${phone || '연락처 미입력'}` : `[상담요청] ${region} / ${phone || '연락처 미입력'}`;

    const consultRows: Array<[string, unknown]> = [
      ['버튼을 누른 일자와 시간', buttonClickedAt ? formatKoreanDateTime(buttonClickedAt) : '미입력'],
      ['상담 신청 일자와 시간', submittedAt ? formatKoreanDateTime(submittedAt) : formatKoreanDateTime()],
      ['연락처', phone],
      ['주소', address],
      ['겪고 있는 문제', Array.isArray(issues) ? translateIssues(issues) : issues],
      ['평형', pyeong ? `${pyeong}평` : '미입력'],
      ['창문수', sash ? `${sash}개` : '미입력'],
      ['시공방식', selectedPlan],
      ['보양여부', protectionOption],
      ['창틀모헤어 여부', includeRailMohair],
      ['방충솔루션', pestSolution],
      ['선택 기준 예상견적', selectedEstimate],
      ['메모', notes || '없음'],
      ['대리점 코드', refCode || '직접 유입'],
    ];

    const followupRows: Array<[string, unknown]> = [
      ['버튼을 누른 일자와 시간', buttonClickedAt ? formatKoreanDateTime(buttonClickedAt) : '미입력'],
      ['연락처', phone],
      ['도로명주소', address],
      ['겪고 있는 문제', Array.isArray(issues) ? translateIssues(issues) : issues],
      ['평형', pyeong ? `${pyeong}평` : '미입력'],
      ['창문수', sash ? `${sash}개` : '미입력'],
      ['패브릭씰러 기본견적', fabricBaseEstimate],
      ['일반모헤어 기본견적', mohairBaseEstimate],
      ['측면시공 기본견적', sideBaseEstimate],
      ['대리점 코드', refCode || 'zapgoself'],
    ];

    const { error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'zapgoteam@gmail.com',
      subject,
      html: `
        <div style="font-family:Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;max-width:760px;margin:0 auto;padding:28px;color:#222;">
          <h1 style="font-size:28px;line-height:1.3;margin:0 0 14px;font-weight:800;">${escapeHtml(title)}</h1>
          <div style="height:3px;background:#b10000;margin:0 0 24px;"></div>
          <table style="width:100%;border-collapse:collapse;border:1px solid #eeeeee;font-size:16px;">
            ${buildTable(isFollowup ? followupRows : consultRows)}
          </table>
          <p style="margin-top:22px;color:#888;font-size:13px;line-height:1.6;">
            이 메일은 에너지잡고 셀프견적 앱에서 자동 발송되었습니다.
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
