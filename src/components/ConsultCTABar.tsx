'use client';

import { CONTACT_CHANNELS } from '@/lib/constants';

export default function ConsultCTABar({ compact = false }: { compact?: boolean }) {
  const base =
    'flex-1 border border-gray-200 text-xs font-medium text-gray-700 text-center hover:bg-gray-50 flex items-center justify-center';
  const h = compact ? 'py-2.5' : 'py-3';

  return (
    <div className="flex gap-2">
      <a
        href={CONTACT_CHANNELS.KAKAO_CHANNEL}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} ${h}`}
      >
        카톡상담
      </a>
      <a href={`tel:${CONTACT_CHANNELS.PHONE}`} className={`${base} ${h}`}>
        전화상담
      </a>
      <a href={CONTACT_CHANNELS.VISIT_REQUEST_PATH} className={`${base} ${h}`}>
        방문견적요청
      </a>
    </div>
  );
}
