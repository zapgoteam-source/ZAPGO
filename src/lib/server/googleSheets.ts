import crypto from 'crypto';

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FOLLOWUP_HEADERS = [
  '연락상태',
  '담당자',
  '상담메모',
  '마지막 연락일',
  '다음 연락 예정일',
  '연락처',
  '주소',
  '겪고 있는 문제',
  '견적 유형',
  '예상견적',
  '평형',
  '창문수',
  '방충망수',
  '대리점 코드',
  '광고유입코드',
  '견적 요청일시',
  '확인 기준일시',
  '시트 기록일시',
  '세션ID',
];

const CONSULT_HEADERS = [
  '처리상태',
  '담당자',
  '상담메모',
  '마지막 연락일',
  '다음 연락 예정일',
  '상담신청일시',
  '연락처',
  '주소',
  '겪고 있는 문제',
  '견적 유형',
  '선택 시공방식',
  '보양여부',
  '창틀모헤어',
  '방충솔루션',
  '선택 예상견적',
  '평형',
  '창문수',
  '방충망수',
  '대리점 코드',
  '광고유입코드',
  '견적 요청일시',
  '시트 기록일시',
  '세션ID',
];

const LEGACY_FOLLOWUP_HEADERS = [
  '기록일시',
  '견적 요청일시',
  '24시간 경과일시',
  '연락처',
  '주소',
  '겪고 있는 문제',
  '평형',
  '창문수',
  '방충망수',
  '견적 유형',
  '예상견적',
  '대리점 코드',
  '연락상태',
  '상담메모',
  '담당자',
  '최종수정일',
  '세션ID',
];

const FOLLOWUP_STATUSES = new Set(['연락필요', '1차부재', '2차부재', '상담완료', '견적보류', '제외', '복원실패']);
const CONSULT_STATUSES = ['상담접수', '연락완료', '1차부재', '2차부재', '일정조율', '시공확정', '보류', '제외'];

function normalizeFollowupRow(row: string[]) {
  const alreadyNew = FOLLOWUP_STATUSES.has(row[0] || '') && (row.length >= 18 || Boolean(row[5]));
  if (alreadyNew) {
    if (row.length === 18) {
      return [
        ...row.slice(0, 14),
        '',
        ...row.slice(14, 18),
      ];
    }
    return FOLLOWUP_HEADERS.map((_, index) => row[index] || '');
  }

  return [
    row[12] || '연락필요',
    row[14] || '',
    row[13] || '',
    row[15] || '',
    '',
    row[3] || '',
    row[4] || '',
    row[5] || '',
    row[9] || '',
    row[10] || '',
    row[6] || '',
    row[7] || '',
    row[8] || '',
    row[11] || '',
    '',
    row[1] || '',
    row[2] || '',
    row[0] || '',
    row[16] || '',
  ];
}

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function getPrivateKey() {
  const raw = process.env.GOOGLE_PRIVATE_KEY || '';
  return raw.replace(/\\n/g, '\n');
}

async function getAccessToken() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = getPrivateKey();

  if (!clientEmail || !privateKey) {
    throw new Error('Google Sheets 서비스 계정 환경변수가 설정되지 않았습니다.');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: clientEmail,
    scope: SHEETS_SCOPE,
    aud: TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };
  const unsignedJwt = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;
  const signature = crypto.createSign('RSA-SHA256').update(unsignedJwt).sign(privateKey);
  const assertion = `${unsignedJwt}.${base64url(signature)}`;

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Google access token 발급 실패: ${response.status} ${JSON.stringify(payload)}`);
  }

  return String(payload.access_token);
}

export function getFollowupSheetConfig() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID || '1j8CfXMAn09WKzMsnLZvwAInu2d3zELwlWL_uEhFtcL0';
  const sheetName = process.env.GOOGLE_SHEETS_FOLLOWUP_TAB || '미상담고객';
  return { spreadsheetId, sheetName };
}

export function getConsultSheetConfig() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID || '1j8CfXMAn09WKzMsnLZvwAInu2d3zELwlWL_uEhFtcL0';
  const sheetName = process.env.GOOGLE_SHEETS_CONSULT_TAB || '상담신청고객';
  return { spreadsheetId, sheetName };
}

export function getFollowupSheetUrl() {
  const { spreadsheetId } = getFollowupSheetConfig();
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
}

async function sheetsFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Google Sheets API 오류: ${response.status} ${JSON.stringify(payload)}`);
  }
  return payload;
}

async function getOrCreateSheetId(spreadsheetId: string, sheetName: string) {
  const metadata = await sheetsFetch(`${spreadsheetId}?fields=sheets.properties`);
  const sheets = metadata?.sheets || [];
  let sheetId = sheets.find((sheet: { properties?: { title?: string; sheetId?: number } }) => sheet.properties?.title === sheetName)?.properties?.sheetId;

  if (sheetId === undefined) {
    const createResponse = await sheetsFetch(`${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({
        requests: [{ addSheet: { properties: { title: sheetName } } }],
      }),
    });
    sheetId = createResponse?.replies?.[0]?.addSheet?.properties?.sheetId;
  }

  return sheetId;
}

async function applySheetUsabilityFormatting({
  spreadsheetId,
  sheetId,
  columnCount,
  statuses,
}: {
  spreadsheetId: string;
  sheetId?: number;
  columnCount: number;
  statuses: string[];
}) {
  if (sheetId === undefined) return;

  await sheetsFetch(`${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          updateSheetProperties: {
            properties: {
              sheetId,
              gridProperties: { frozenRowCount: 1 },
            },
            fields: 'gridProperties.frozenRowCount',
          },
        },
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                backgroundColor: { red: 0.69, green: 0, blue: 0 },
                horizontalAlignment: 'CENTER',
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment)',
          },
        },
        {
          setDataValidation: {
            range: { sheetId, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: 1 },
            rule: {
              condition: {
                type: 'ONE_OF_LIST',
                values: statuses.map((status) => ({ userEnteredValue: status })),
              },
              strict: false,
              showCustomUi: true,
            },
          },
        },
        {
          autoResizeDimensions: {
            dimensions: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: columnCount },
          },
        },
      ],
    }),
  });
}

export async function ensureFollowupSheet() {
  const { spreadsheetId, sheetName } = getFollowupSheetConfig();
  const sheetId = await getOrCreateSheetId(spreadsheetId, sheetName);

  const escapedAllRange = encodeURIComponent(`'${sheetName}'!A:S`);
  const current = await sheetsFetch(`${spreadsheetId}/values/${escapedAllRange}?majorDimension=ROWS`);
  const values = current?.values || [];
  const firstRow = values[0] || [];

  const isSingleAttributionFollowupHeader = firstRow.length === 18 && firstRow[13] === '유입코드';

  if (firstRow.join('|') === LEGACY_FOLLOWUP_HEADERS.join('|') || isSingleAttributionFollowupHeader) {
    const migratedRows = values.slice(1).map((row: string[]) => normalizeFollowupRow(row));
    await sheetsFetch(`${spreadsheetId}/values/${escapedAllRange}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      body: JSON.stringify({ values: [FOLLOWUP_HEADERS, ...migratedRows] }),
    });
  } else if (firstRow.join('|') !== FOLLOWUP_HEADERS.join('|')) {
    const escapedHeaderRange = encodeURIComponent(`'${sheetName}'!A1:S1`);
    await sheetsFetch(`${spreadsheetId}/values/${escapedHeaderRange}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      body: JSON.stringify({ values: [FOLLOWUP_HEADERS] }),
    });
  } else {
    const rows = values.slice(1);
    const hasLegacyRows = rows.some((row: string[]) => row.some(Boolean) && !FOLLOWUP_STATUSES.has(row[0] || ''));
    if (hasLegacyRows) {
      const migratedRows = rows.map((row: string[]) => normalizeFollowupRow(row));
      await sheetsFetch(`${spreadsheetId}/values/${escapedAllRange}?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        body: JSON.stringify({ values: [FOLLOWUP_HEADERS, ...migratedRows] }),
      });
    }
  }

  await applySheetUsabilityFormatting({
    spreadsheetId,
    sheetId,
    columnCount: FOLLOWUP_HEADERS.length,
    statuses: Array.from(FOLLOWUP_STATUSES),
  });
}

export async function ensureConsultSheet() {
  const { spreadsheetId, sheetName } = getConsultSheetConfig();
  const sheetId = await getOrCreateSheetId(spreadsheetId, sheetName);
  const escapedAllRange = encodeURIComponent(`'${sheetName}'!A:W`);
  const current = await sheetsFetch(`${spreadsheetId}/values/${escapedAllRange}?majorDimension=ROWS`);
  const values = current?.values || [];
  const firstRow = values[0] || [];

  if (firstRow.join('|') !== CONSULT_HEADERS.join('|')) {
    const migratedRows =
      firstRow.length === 22 && firstRow[18] === '유입코드'
        ? values.slice(1).map((row: string[]) => [
            ...row.slice(0, 19),
            '',
            ...row.slice(19, 22),
          ])
        : values.slice(1);
    await sheetsFetch(`${spreadsheetId}/values/${escapedAllRange}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      body: JSON.stringify({ values: [CONSULT_HEADERS, ...migratedRows] }),
    });
  }

  await applySheetUsabilityFormatting({
    spreadsheetId,
    sheetId,
    columnCount: CONSULT_HEADERS.length,
    statuses: CONSULT_STATUSES,
  });
}

export async function appendFollowupRows(rows: Array<Array<string | number>>) {
  if (rows.length === 0) return;
  const { spreadsheetId, sheetName } = getFollowupSheetConfig();
  await ensureFollowupSheet();
  const escapedRange = encodeURIComponent(`'${sheetName}'!A:S`);
  await sheetsFetch(`${spreadsheetId}/values/${escapedRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: 'POST',
    body: JSON.stringify({ values: rows }),
  });
}

export async function appendConsultRows(rows: Array<Array<string | number>>) {
  if (rows.length === 0) return;
  const { spreadsheetId, sheetName } = getConsultSheetConfig();
  await ensureConsultSheet();

  const escapedReadRange = encodeURIComponent(`'${sheetName}'!A:W`);
  const current = await sheetsFetch(`${spreadsheetId}/values/${escapedReadRange}?majorDimension=ROWS`);
  const existingSessionIds = new Set(
    (current?.values || [])
      .slice(1)
      .map((row: string[]) => row[22] || row[21])
      .filter(Boolean)
  );
  const rowsToAppend = rows.filter((row) => !existingSessionIds.has(String(row[22] || row[21] || '')));
  if (rowsToAppend.length === 0) return;

  const escapedRange = encodeURIComponent(`'${sheetName}'!A:W`);
  await sheetsFetch(`${spreadsheetId}/values/${escapedRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: 'POST',
    body: JSON.stringify({ values: rowsToAppend }),
  });
}

export async function backfillAttributionCodes(codeBySessionId: Record<string, string>, adCodeBySessionId: Record<string, string> = {}) {
  const results = { followupUpdated: 0, consultUpdated: 0 };
  const entries = [
    ...Object.entries(codeBySessionId).filter(([, code]) => Boolean(code)),
    ...Object.entries(adCodeBySessionId).filter(([, code]) => Boolean(code)),
  ];
  if (entries.length === 0) return results;

  const updateSheet = async ({
    spreadsheetId,
    sheetName,
    range,
    sessionIdIndex,
    codeIndex,
    adCodeIndex,
    resultKey,
  }: {
    spreadsheetId: string;
    sheetName: string;
    range: string;
    sessionIdIndex: number;
    codeIndex: number;
    adCodeIndex: number;
    resultKey: 'followupUpdated' | 'consultUpdated';
  }) => {
    const escapedRange = encodeURIComponent(`'${sheetName}'!${range}`);
    const current = await sheetsFetch(`${spreadsheetId}/values/${escapedRange}?majorDimension=ROWS`);
    const values: string[][] = current?.values || [];
    if (values.length === 0) return;

    let updated = 0;
    const nextValues = values.map((row, rowIndex) => {
      if (rowIndex === 0) return row;
      const sessionId = row[sessionIdIndex];
      const code = sessionId ? codeBySessionId[sessionId] : '';
      const adCode = sessionId ? adCodeBySessionId[sessionId] : '';
      if (!code && !adCode) return row;
      const next = [...row];
      while (next.length <= Math.max(sessionIdIndex, codeIndex, adCodeIndex)) next.push('');
      if (code && next[codeIndex] !== code) {
        next[codeIndex] = code;
        updated += 1;
      }
      if (adCode && next[adCodeIndex] !== adCode) {
        next[adCodeIndex] = adCode;
        updated += 1;
      }
      return next;
    });

    if (updated > 0) {
      await sheetsFetch(`${spreadsheetId}/values/${escapedRange}?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        body: JSON.stringify({ values: nextValues }),
      });
      results[resultKey] = updated;
    }
  };

  const followup = getFollowupSheetConfig();
  await ensureFollowupSheet();
  await updateSheet({
    spreadsheetId: followup.spreadsheetId,
    sheetName: followup.sheetName,
    range: 'A:S',
    sessionIdIndex: 18,
    codeIndex: 13,
    adCodeIndex: 14,
    resultKey: 'followupUpdated',
  });

  const consult = getConsultSheetConfig();
  await ensureConsultSheet();
  await updateSheet({
    spreadsheetId: consult.spreadsheetId,
    sheetName: consult.sheetName,
    range: 'A:W',
    sessionIdIndex: 22,
    codeIndex: 18,
    adCodeIndex: 19,
    resultKey: 'consultUpdated',
  });

  return results;
}
