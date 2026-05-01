'use client';

import { CONTACT_CHANNELS } from '@/lib/constants';

const BRAND_RED = '#b10000';

export default function ConsultCTABar({
  compact = false,
  page3Colors = false,
}: {
  compact?: boolean;
  page3Colors?: boolean;
}) {
  const h = compact ? 'py-2.5' : 'py-3';

  if (page3Colors) {
    return (
      <div className="flex gap-2">
        <a
          href={CONTACT_CHANNELS.KAKAO_CHANNEL}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 text-xs font-medium text-gray-800 text-center flex items-center justify-center ${h}`}
          style={{ backgroundColor: '#FEE500' }}
        >
          카톡문의
        </a>
        <a
          href={`tel:${CONTACT_CHANNELS.PHONE}`}
          className={`flex-1 text-xs font-medium text-gray-800 text-center flex items-center justify-center ${h}`}
          style={{ backgroundColor: '#D1F2EB' }}
        >
          전화문의
        </a>
        <a
          href={CONTACT_CHANNELS.VISIT_REQUEST_PATH}
          className={`flex-1 text-xs font-medium text-gray-800 text-center flex items-center justify-center ${h}`}
          style={{ backgroundColor: '#E5E5E5' }}
        >
          방문견적요청
        </a>
      </div>
    );
  }

  const base = `flex-1 border border-gray-200 text-xs font-medium text-gray-700 text-center hover:bg-gray-50 flex items-center justify-center ${h}`;

  return (
    <div className="flex gap-2">
      <a
        href={CONTACT_CHANNELS.KAKAO_CHANNEL}
        target="_blank"
        rel="noopener noreferrer"
        className={base}
      >
        카톡문의
      </a>
      <a href={`tel:${CONTACT_CHANNELS.PHONE}`} className={base}>
        전화문의
      </a>
      <a href={CONTACT_CHANNELS.VISIT_REQUEST_PATH} className={base}>
        방문견적요청
      </a>
    </div>
  );
}
