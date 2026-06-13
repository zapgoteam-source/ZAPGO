'use client';

import { useEffect, useState } from 'react';
import { formatKRW, type IssueKey } from '@/lib/selfEstimate';

type Mode = 'idle' | 'pest_only' | 'window_seal';

const ISSUES: { key: IssueKey; label: string; icon: string }[] = [
  { key: 'dust', label: '먼지날림', icon: '🌫️' },
  { key: 'draft', label: '외풍유입', icon: '💨' },
  { key: 'bug', label: '벌레유입', icon: '🐛' },
  { key: 'heating', label: '냉난방비', icon: '🌡️' },
  { key: 'noise', label: '소음유입', icon: '🔊' },
  { key: 'odor', label: '악취유입', icon: '🌀' },
];

function getMode(issues: Set<IssueKey>): Mode {
  if (issues.size === 0) return 'idle';
  if (issues.size === 1 && issues.has('bug')) return 'pest_only';
  return 'window_seal';
}

function getPestEstimate(count: number) {
  return 110_000 + Math.max(1, count) * 33_000;
}

export default function SelfEstimateSingleFlowPrototype() {
  const [issues, setIssues] = useState<Set<IssueKey>>(new Set());
  const [pyeong, setPyeong] = useState('25');
  const [sashCount, setSashCount] = useState('10');
  const [pestCount, setPestCount] = useState(3);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [sent, setSent] = useState(false);
  const [previewResult, setPreviewResult] = useState(false);
  const [showCountGuide, setShowCountGuide] = useState(false);

  const mode = getMode(issues);
  const pyeongNum = Number(pyeong) || 0;
  const sashNum = Number(sashCount) || 0;
  const pestEstimate = getPestEstimate(pestCount);
  const canSend =
    mode !== 'idle' &&
    phone.replace(/\D/g, '').length >= 10 &&
    address.trim().length > 0 &&
    privacyAgreed &&
    (mode === 'pest_only' ? pestCount > 0 : pyeongNum > 0 && sashNum > 0);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('result') === 'pest') {
      setPreviewResult(true);
    }
  }, []);

  const toggleIssue = (key: IssueKey) => {
    setSent(false);
    setPreviewResult(false);
    const next = new Set(issues);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setIssues(next);
  };


  const showPestResult = previewResult;

  if (showPestResult) {
    return (
      <div className="min-h-screen bg-[#f7f2ef] text-[#222222]">
        <div className="mx-auto min-h-screen max-w-md bg-white">
          <header className="px-6 pt-6">
            <img src="/LOGO_BK.webp" alt="에너지잡고" className="h-20 w-20 object-contain" />
            <div className="mt-4 rounded-full bg-[#fff1ee] px-4 py-2 text-xs font-bold text-[#b10000]">
              방충솔루션 맞춤견적 링크 화면
            </div>
          </header>

          <main className="space-y-6 px-6 pb-10 pt-6">
            <section>
              <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-[#b10000]">맞춤 예상 견적</p>
              <h1 className="text-[28px] font-bold leading-tight">방충솔루션 예상 견적</h1>
              <p className="mt-3 text-sm leading-6 text-[#6a6a6a]">
                입력하신 방충망 수량 기준으로 예상 금액을 계산했어요.
              </p>
            </section>

            <section className="rounded-[20px] border border-[#f0d6d1] bg-[#fff8f6] p-5">
              <p className="text-sm text-[#6a6a6a]">현재 선택 기준 예상 견적</p>
              <p className="mt-2 text-4xl font-black text-[#b10000]">{formatKRW(pestEstimate)}</p>
              <p className="mt-3 text-xs leading-5 text-[#8d8178]">
                창호 구조와 현장 상태에 따라 최종 금액은 달라질 수 있습니다.
              </p>
            </section>

            <section className="space-y-3 rounded-[18px] border border-[#eeeeee] p-4">
              <div>
                <h2 className="text-lg font-bold">방충망 수량을 조정해보세요</h2>
              </div>
              <div className="flex items-center justify-between rounded-[14px] border border-[#dddddd] bg-white p-4">
                <button onClick={() => setPestCount((v) => Math.max(1, v - 1))} className="h-10 w-10 border border-[#dddddd] text-xl">−</button>
                <div className="text-center">
                  <p className="text-3xl font-bold">{pestCount}</p>
                </div>
                <button onClick={() => setPestCount((v) => v + 1)} className="h-10 w-10 border border-[#dddddd] text-xl">+</button>
              </div>
            </section>

            <section className="space-y-3 rounded-[18px] border border-[#eeeeee] bg-[#fafafa] p-4">
              <h2 className="text-lg font-bold">견적 계산 내역</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[#6a6a6a]">출장비</span><span className="font-bold">110,000원</span></div>
                <div className="flex justify-between"><span className="text-[#6a6a6a]">방충솔루션</span><span className="font-bold">33,000원 × {pestCount}개</span></div>
                <div className="border-t border-[#dddddd] pt-3 flex justify-between text-base"><span className="font-bold">예상 견적</span><span className="font-black text-[#b10000]">{formatKRW(pestEstimate)}</span></div>
              </div>
            </section>


            <section className="space-y-3 rounded-[18px] border border-[#eeeeee] p-4">
              <h2 className="text-lg font-bold">이 조건으로 상담받기</h2>
              <div className="rounded-[14px] bg-[#f7f7f7] p-3 text-sm">연락처 <span className="ml-2 font-bold">{phone || '01012345678'}</span></div>
              <div className="rounded-[14px] bg-[#f7f7f7] p-3 text-sm">주소 <span className="ml-2 font-bold">{`${address} ${detailAddress}`.trim() || '서울특별시 강남구 테헤란로 123'}</span></div>
              <textarea placeholder="벌레가 주로 들어오는 위치나 요청사항을 남겨주세요." rows={4} className="w-full rounded-[14px] border border-[#dddddd] px-4 py-4 outline-none" />
              <button className="w-full bg-[#b10000] py-4 text-base font-medium text-white">이 조건으로 상담 신청하기</button>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold">자주 묻는 질문</h2>
              {[
                ['어떻게 벌레를 막아주는 건가요?', '에너지잡고의 전용 풍지판, 틈새막이 등을 사용하여 확인된 벌레유입통로를 차단해 드립니다.'],
                ['방충솔루션 후에 벌레가 나오면 어떻게 하죠?', '현장에서 벌레유입통로를 설명해 드리고 막힌 부분까지 확인시켜드릴 것입니다. 벌레는 생물이기 때문에 예상치 못한 곳으로 들어올 수 있고, 실내에서 밖으로 나가는 벌레가 창틀에서 죽는 경우도 있습니다. 방충솔루션으로 100% 차단된다고 말하기는 어렵지만 95% 이상의 창문 벌레 문제는 해결된다고 보시면 됩니다.'],
                ['방충망 교체도 가능한가요?', '원하신다면 방충망 교체도 가능합니다. 방충망은 종류와 크기에 따라 견적금액에 차이가 커서 상담할 때 물어보시면 자세히 안내해 드리겠습니다.'],
              ].map(([q, a]) => (
                <div key={q} className="border border-[#dddddd] bg-white p-4">
                  <p className="font-bold">{q}</p>
                  <p className="mt-2 text-sm leading-6 text-[#6a6a6a]">{a}</p>
                </div>
              ))}
            </section>

            <button onClick={() => setPreviewResult(false)} className="w-full border border-[#dddddd] py-3 text-sm font-bold text-[#6a6a6a]">
              첫 화면으로 돌아가기
            </button>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f2ef] text-[#222222]">
      <div className="mx-auto min-h-screen max-w-md bg-white">
        <header className="flex items-center justify-between px-6 pt-6">
          <img src="/LOGO_BK.webp" alt="에너지잡고" className="h-20 w-20 object-contain" />
          <span className="text-xs font-medium text-[#6a6a6a]">프로토타입</span>
        </header>

        <main className="space-y-7 px-6 pb-10 pt-6">
          <section>
            <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-[#b10000]">STEP 1</p>
            <h1 className="text-[28px] font-bold leading-tight">30초면 충분해요</h1>
            <p className="mt-3 text-sm leading-6 text-[#6a6a6a]">
              우리 집 시공 예상 비용을 간편하게 확인하세요.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold">어떤 점이 불편한가요?</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {ISSUES.map((issue) => {
                const active = issues.has(issue.key);
                return (
                  <button
                    key={issue.key}
                    onClick={() => toggleIssue(issue.key)}
                    className={`flex items-center gap-2 border px-3 py-3 text-sm font-medium transition ${
                      active ? 'border-[#b10000] bg-[#b10000] text-white' : 'border-[#dddddd] bg-white text-[#463c36]'
                    }`}
                  >
                    <span>{issue.icon}</span>
                    {issue.label}
                  </button>
                );
              })}
            </div>
          </section>

          {mode === 'idle' && (
            <section className="rounded-[18px] border border-dashed border-[#dddddd] bg-[#fafafa] p-5 text-sm leading-6 text-[#6a6a6a]">
불편한 문제를 선택하면 견적 계산에 필요한 정보가 이어서 나타납니다.
            </section>
          )}

          {mode === 'pest_only' && (
            <section className="space-y-4 rounded-[18px] border border-[#eeeeee] bg-[#fafafa] p-4">
              <div>
                <h2 className="text-sm font-bold">견적 계산에 필요한 정보예요</h2>
              </div>
              <div className="rounded-[14px] border border-[#dddddd] bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">방충망 수량</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPestCount((v) => Math.max(1, v - 1))} className="h-9 w-9 border border-[#dddddd] text-lg">−</button>
                    <span className="w-8 text-center text-lg font-bold">{pestCount}</span>
                    <button onClick={() => setPestCount((v) => v + 1)} className="h-9 w-9 border border-[#dddddd] text-lg">+</button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {mode === 'window_seal' && (
            <section className="space-y-4 rounded-[18px] border border-[#eeeeee] bg-[#fafafa] p-4">
              <div>
                <h2 className="text-sm font-bold">견적 계산에 필요한 정보예요</h2>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-xs text-[#6a6a6a]">평형</span>
                <div className="flex items-center rounded-[14px] border border-[#dddddd] bg-white">
                  <input value={pyeong} onChange={(e) => setPyeong(e.target.value)} inputMode="numeric" className="w-full bg-transparent px-4 py-4 text-lg outline-none" />
                  <span className="pr-4 text-sm text-[#6a6a6a]">평</span>
                </div>
              </label>
              <label className="block">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="block text-xs text-[#6a6a6a]">유리창 개수</span>
                  <button
                    onClick={() => setShowCountGuide(true)}
                    className="text-xs font-semibold text-[#b10000]"
                  >
                    유리창 개수 세는 법 보기
                  </button>
                </div>
                <div className="flex items-center rounded-[14px] border border-[#dddddd] bg-white">
                  <input value={sashCount} onChange={(e) => setSashCount(e.target.value)} inputMode="numeric" className="w-full bg-transparent px-4 py-4 text-lg outline-none" />
                  <span className="pr-4 text-sm text-[#6a6a6a]">개</span>
                </div>
                <p className="mt-1.5 text-xs leading-5 text-[#6a6a6a]">
                  유리창 한 판씩 세어서 총개수를 입력해 주세요
                </p>
              </label>
            </section>
          )}

          {mode !== 'idle' && (
            <section className="space-y-3 rounded-[18px] border border-[#eeeeee] p-4">
              <div>
                <h2 className="text-lg font-bold leading-7">
                  출장비를 포함한 맞춤 견적 링크를 보내 드릴게요
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#6a6a6a]">
                  직접 시공 방식과 옵션을 바꿔가며 금액을 조정해 보세요.
                </p>
              </div>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="견적 링크를 받을 휴대폰 번호" className="w-full rounded-[14px] border border-[#dddddd] bg-white px-4 py-4 outline-none" />
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="도로명 주소를 입력해주세요" className="w-full rounded-[14px] border border-[#dddddd] bg-white px-4 py-4 outline-none" />
              <input value={detailAddress} onChange={(e) => setDetailAddress(e.target.value)} placeholder="상세주소 (선택)" className="w-full rounded-[14px] border border-[#dddddd] bg-white px-4 py-4 outline-none" />
              <label className="flex items-start gap-2 text-sm leading-6 text-[#6a6a6a]">
                <input type="checkbox" checked={privacyAgreed} onChange={(e) => setPrivacyAgreed(e.target.checked)} className="mt-1" />
                <span>
                  견적 안내 및 상담을 위해 개인정보 수집·이용에 동의합니다
                  <span className="block text-xs text-[#8d8178]">수집 항목: 연락처, 도로명 주소, 상세주소 / 이용 목적: 견적 안내 및 상담 응대</span>
                </span>
              </label>
              <button
                disabled={!canSend}
                onClick={() => { setSent(true); if (mode === 'pest_only') setPreviewResult(true); }}
                className="w-full bg-[#b10000] py-4 text-base font-medium text-white disabled:opacity-40"
              >
                {mode === 'pest_only' ? '방충솔루션 맞춤 견적 링크 받기' : '맞춤 견적 링크 받기'}
              </button>
              {sent && (
                <div className="rounded-[14px] border border-[#c7eadf] bg-[#f0fbf7] p-4 text-sm font-semibold text-[#145c4c]">
                  프로토타입입니다. 실제 발송 대신, 이 자리에서 “링크 발송 완료” 상태만 보여줍니다.
                </div>
              )}
            </section>
          )}
        </main>
      </div>
      {showCountGuide && <CountGuideModal onClose={() => setShowCountGuide(false)} />}
    </div>
  );
}

function CountGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">유리창 개수 세는 법 보기</h2>
          <button onClick={onClose} className="text-sm text-[#6a6a6a]">
            닫기
          </button>
        </div>
        <div className="mt-4 aspect-video bg-black">
          <iframe
            className="h-full w-full"
            src="https://www.youtube.com/embed/mxnY3c9pPrc"
            title="유리창 개수 세는 방법"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
