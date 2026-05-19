import { NextRequest, NextResponse } from 'next/server';
import { makeSolapiAuthHeader, SOLAPI_SEND_ENDPOINT } from '@/lib/solapi';

function getSmsFallbackText(link: string) {
  return `[에너지잡고]\n요청하신 맞춤 예상 견적이 준비되었습니다.\n\n아래 링크를 눌러 시공 방식과 옵션을 선택하고 예상 금액을 확인해 주세요.\n${link}`;
}

async function sendSolapiMessage(message: Record<string, unknown>) {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('SOLAPI API 키가 설정되지 않았습니다.');
  }

  return fetch(SOLAPI_SEND_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: makeSolapiAuthHeader(apiKey, apiSecret),
    },
    body: JSON.stringify({
      messages: [message],
      strict: false,
      showMessageList: true,
    }),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, link } = body as { phone?: string; link?: string; refCode?: string; skipLeadSave?: boolean };

    if (!phone || !link) {
      return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
    }

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      return NextResponse.json({ error: '올바르지 않은 전화번호' }, { status: 400 });
    }

    const sender = process.env.SOLAPI_SENDER || '16009195';
    const pfId = process.env.SOLAPI_KAKAO_PF_ID;
    const templateId = process.env.SOLAPI_KAKAO_TEMPLATE_ID;
    const caseVideoLink = process.env.ZAPGO_CASE_VIDEO_URL || 'https://youtu.be/_tq8gXHrhe4';

    const kakaoReady = Boolean(pfId && templateId);
    const message = kakaoReady
      ? {
          to: digits,
          from: sender,
          text: getSmsFallbackText(link),
          kakaoOptions: {
            pfId,
            templateId,
            disableSms: false,
            variables: {
              '#{견적링크}': link,
            },
            buttons: [
              {
                buttonType: 'WL',
                buttonName: '📄 맞춤 견적 보기',
                linkMo: link,
                linkPc: link,
              },
              {
                buttonType: 'WL',
                buttonName: '📹 시공 과정 영상',
                linkMo: caseVideoLink,
                linkPc: caseVideoLink,
              },
            ],
          },
        }
      : {
          to: digits,
          from: sender,
          text: getSmsFallbackText(link),
        };

    const solapiRes = await sendSolapiMessage(message);
    if (!solapiRes.ok) {
      const errBody = await solapiRes.json().catch(() => null);
      console.error('솔라피 견적 링크 발송 실패:', errBody);
      return NextResponse.json({ error: '견적 링크 발송 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true, channel: kakaoReady ? 'kakao' : 'sms' });
  } catch (err) {
    console.error('견적 링크 발송 오류:', err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
