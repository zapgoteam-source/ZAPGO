import { NextRequest, NextResponse } from 'next/server';

type JusoItem = {
  roadAddr?: string;
  roadAddrPart1?: string;
  roadAddrPart2?: string;
  jibunAddr?: string;
  zipNo?: string;
  bdNm?: string;
};

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get('keyword')?.trim();

  if (!keyword || keyword.length < 2) {
    return NextResponse.json({ error: '검색어는 두 글자 이상 입력해주세요.' }, { status: 400 });
  }

  const confmKey = process.env.JUSO_CONFM_KEY;
  if (!confmKey) {
    return NextResponse.json(
      { error: '도로명주소 API 승인키가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  const url = new URL('https://business.juso.go.kr/addrlink/addrLinkApi.do');
  url.searchParams.set('confmKey', confmKey);
  url.searchParams.set('currentPage', '1');
  url.searchParams.set('countPerPage', '10');
  url.searchParams.set('keyword', keyword);
  url.searchParams.set('resultType', 'json');

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      return NextResponse.json({ error: '주소 검색에 실패했습니다.' }, { status: 502 });
    }

    const payload = await response.json();
    const common = payload?.results?.common;
    const items = (payload?.results?.juso ?? []) as JusoItem[];

    if (common?.errorCode && common.errorCode !== '0') {
      return NextResponse.json(
        { error: common.errorMessage || '주소 검색에 실패했습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: items.map((item) => ({
        roadAddr: item.roadAddr || item.roadAddrPart1 || '',
        roadAddrPart1: item.roadAddrPart1 || '',
        roadAddrPart2: item.roadAddrPart2 || '',
        jibunAddr: item.jibunAddr || '',
        zipNo: item.zipNo || '',
        buildingName: item.bdNm || '',
      })),
    });
  } catch (error) {
    console.error('도로명주소 검색 오류:', error);
    return NextResponse.json({ error: '주소 검색 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
