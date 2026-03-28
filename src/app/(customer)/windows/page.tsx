'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEstimateStore } from '@/store/estimateStore';
import {
  WindowInput,
  WindowTypeCode,
  LayoutCode,
  FrameMohairState,
  WindowServiceType,
} from '@/types';
import {
  windowTypeLabel,
  layoutCodeLabel,
  frameMohairLabel,
  isWindowScreenTarget,
  getAutoScreenCountForWindow,
} from '@/lib/estimateCalculator';

// 레이아웃 시각 표현
const LAYOUT_VISUALS: Record<LayoutCode, string> = {
  '2_1_1': '▌▌ (2짝 1:1)',
  '2_1_2': '▌▌▌ (2짝 1:2)',
  '2_2_1': '▌▌▌ (2짝 2:1)',
  '3_1_1_1': '▌▌▌ (3짝 1:1:1)',
  '3_1_2_1': '▌▌▌▌ (3짝 1:2:1)',
  '4_1_1_1_1': '▌▌▌▌ (4짝 1:1:1:1)',
};

const LOCATION_TAGS = ['거실', '방', '베란다', '주방', '세탁실', '화장실'];
const WINDOW_TYPES: { code: WindowTypeCode; label: string; desc: string }[] = [
  { code: 'full_win', label: '완창', desc: '일반 창문 (가장 일반적)' },
  { code: 'half_win', label: '반창', desc: '절반 높이 창문' },
  { code: 'small_win', label: '소형창', desc: '작은 창문 (욕실 등)' },
];
const LAYOUTS: LayoutCode[] = ['2_1_1', '2_1_2', '2_2_1', '3_1_1_1', '3_1_2_1', '4_1_1_1_1'];
const FRAME_STATES: { value: FrameMohairState; desc: string }[] = [
  { value: 'UNKNOWN', desc: '모르겠음 (실측 후 변동)' },
  { value: 'NONE', desc: '없음 (창틀 시공 제외)' },
  { value: 'LINE_1', desc: '1줄 모헤어' },
  { value: 'LINE_2', desc: '2줄 모헤어' },
  { value: 'LINE_3', desc: '3줄 모헤어' },
  { value: 'LINE_4', desc: '4줄 모헤어' },
];

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

type EditorStep = 'location' | 'type' | 'layout' | 'double' | 'frame';

interface WindowEditor {
  data: WindowInput;
  step: EditorStep;
}

export default function WindowsPage() {
  const router = useRouter();
  const { windows, addWindow, updateWindow, removeWindow, housingAreaPyeong } = useEstimateStore();

  const [editor, setEditor] = useState<WindowEditor | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const openAdd = () => {
    setEditingId(null);
    setEditor({
      data: {
        id: generateId(),
        location_label: '',
        window_type_code: 'full_win',
        layout_code: '2_1_1',
        is_double_window: false,
        frame_mohair_state: 'UNKNOWN',
        service_type: 'FOUR_SIDE',
        confirmed_screen_count: 0,
      },
      step: 'location',
    });
  };

  const openEdit = (w: WindowInput) => {
    setEditingId(w.id);
    setEditor({ data: { ...w }, step: 'location' });
  };

  const handleSave = () => {
    if (!editor) return;
    const w = editor.data;
    // 방충망 자동 카운트 설정
    const autoCount = isWindowScreenTarget(w) ? getAutoScreenCountForWindow(w.layout_code) : 0;
    const finalW = {
      ...w,
      confirmed_screen_count: w.confirmed_screen_count || autoCount,
    };
    if (editingId) {
      updateWindow(editingId, finalW);
    } else {
      addWindow(finalW);
    }
    setEditor(null);
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditor(null);
    setEditingId(null);
  };

  const nextStep = (current: EditorStep): EditorStep => {
    const steps: EditorStep[] = ['location', 'type', 'layout', 'double', 'frame'];
    const idx = steps.indexOf(current);
    return steps[idx + 1] || 'frame';
  };

  const isLastStep = editor?.step === 'frame';

  if (editor) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="px-5 pt-6 pb-4">
          <button onClick={handleCancel} className="text-gray-400 text-sm mb-3">
            ← 취소
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            {editingId ? '창문 수정' : '창문 추가'}
          </h1>
        </div>

        <div className="flex-1 px-5 space-y-5">
          {/* Step: 위치 */}
          {editor.step === 'location' && (
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-3">창문 위치를 선택하거나 입력해주세요</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {LOCATION_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() =>
                      setEditor((e) => e && { ...e, data: { ...e.data, location_label: tag } })
                    }
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      editor.data.location_label === tag
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={editor.data.location_label}
                onChange={(e) =>
                  setEditor((e2) => e2 && { ...e2, data: { ...e2.data, location_label: e.target.value } })
                }
                placeholder="직접 입력 (예: 거실 큰창)"
                className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900"
              />
            </div>
          )}

          {/* Step: 창문 유형 */}
          {editor.step === 'type' && (
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-3">창문 유형을 선택해주세요</p>
              <div className="space-y-2">
                {WINDOW_TYPES.map((wt) => (
                  <button
                    key={wt.code}
                    onClick={() =>
                      setEditor((e) => e && { ...e, data: { ...e.data, window_type_code: wt.code } })
                    }
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      editor.data.window_type_code === wt.code
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 bg-white text-gray-800'
                    }`}
                  >
                    <p className="font-semibold">{wt.label}</p>
                    <p className={`text-xs mt-0.5 ${editor.data.window_type_code === wt.code ? 'text-gray-300' : 'text-gray-500'}`}>
                      {wt.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step: 구조 */}
          {editor.step === 'layout' && (
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-3">창문 구조를 선택해주세요</p>
              <div className="space-y-2">
                {LAYOUTS.map((lc) => (
                  <button
                    key={lc}
                    onClick={() =>
                      setEditor((e) => e && { ...e, data: { ...e.data, layout_code: lc } })
                    }
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      editor.data.layout_code === lc
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 bg-white text-gray-800'
                    }`}
                  >
                    <p className="font-semibold">{layoutCodeLabel(lc)}</p>
                    <p className={`text-sm font-mono mt-1 ${editor.data.layout_code === lc ? 'text-gray-300' : 'text-gray-400'}`}>
                      {LAYOUT_VISUALS[lc]}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step: 단창/이중창 */}
          {editor.step === 'double' && (
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-3">단창/이중창을 선택해주세요</p>
              <div className="space-y-3">
                <button
                  onClick={() =>
                    setEditor((e) => e && { ...e, data: { ...e.data, is_double_window: false } })
                  }
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    !editor.data.is_double_window
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-800'
                  }`}
                >
                  <p className="font-semibold">단창</p>
                  <p className={`text-xs mt-0.5 ${!editor.data.is_double_window ? 'text-gray-300' : 'text-gray-500'}`}>
                    창문이 1겹
                  </p>
                </button>
                <button
                  onClick={() =>
                    setEditor((e) => e && { ...e, data: { ...e.data, is_double_window: true } })
                  }
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    editor.data.is_double_window
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-800'
                  }`}
                >
                  <p className="font-semibold">이중창</p>
                  <p className={`text-xs mt-0.5 ${editor.data.is_double_window ? 'text-gray-300' : 'text-gray-500'}`}>
                    창문이 2겹 (안쪽+바깥쪽 각각 과금)
                  </p>
                </button>
                {/* 시공 유형 선택 */}
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-800 mb-2">시공 방법</p>
                  <div className="flex gap-2">
                    {(['FOUR_SIDE', 'SIDE_ONLY'] as WindowServiceType[]).map((st) => (
                      <button
                        key={st}
                        onClick={() =>
                          setEditor((e) => e && { ...e, data: { ...e.data, service_type: st } })
                        }
                        className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          editor.data.service_type === st
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-gray-200 bg-white text-gray-700'
                        }`}
                      >
                        {st === 'FOUR_SIDE' ? '탈거 4면' : '측면 시공'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step: 창틀 모헤어 */}
          {editor.step === 'frame' && (
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-1">창틀 모헤어 상태를 선택해주세요</p>
              <p className="text-xs text-gray-400 mb-3">창틀에 붙어있는 털 재질의 줄 수를 확인해주세요</p>
              <div className="space-y-2">
                {FRAME_STATES.map((fs) => (
                  <button
                    key={fs.value}
                    onClick={() =>
                      setEditor((e) => e && { ...e, data: { ...e.data, frame_mohair_state: fs.value } })
                    }
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      editor.data.frame_mohair_state === fs.value
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 bg-white text-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{frameMohairLabel(fs.value)}</p>
                      {fs.value === 'UNKNOWN' && (
                        <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                          경고
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${editor.data.frame_mohair_state === fs.value ? 'text-gray-300' : 'text-gray-500'}`}>
                      {fs.desc}
                    </p>
                  </button>
                ))}
              </div>

              {/* 방충망 자동 계산 표시 */}
              {(() => {
                const screenTarget = isWindowScreenTarget(editor.data);
                const autoCount = screenTarget ? getAutoScreenCountForWindow(editor.data.layout_code) : 0;
                return screenTarget ? (
                  <div className="mt-4 bg-blue-50 rounded-xl p-3">
                    <p className="text-sm font-semibold text-blue-800 mb-1">방충망 자동 계산</p>
                    <p className="text-xs text-blue-600">
                      위치(베란다/세탁실/화장실/주방) 또는 이중창으로 방충망 대상입니다
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      자동 추천 수량: <strong>{autoCount}개</strong>
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-blue-600">수량 조정:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setEditor((e) =>
                              e && {
                                ...e,
                                data: {
                                  ...e.data,
                                  confirmed_screen_count: Math.max(
                                    0,
                                    (e.data.confirmed_screen_count || autoCount) - 1
                                  ),
                                },
                              }
                            )
                          }
                          className="w-7 h-7 rounded-full bg-blue-200 text-blue-800 font-bold text-sm"
                        >
                          -
                        </button>
                        <span className="text-sm font-bold text-blue-900 w-6 text-center">
                          {editor.data.confirmed_screen_count || autoCount}
                        </span>
                        <button
                          onClick={() =>
                            setEditor((e) =>
                              e && {
                                ...e,
                                data: {
                                  ...e.data,
                                  confirmed_screen_count: (e.data.confirmed_screen_count || autoCount) + 1,
                                },
                              }
                            )
                          }
                          className="w-7 h-7 rounded-full bg-blue-200 text-blue-800 font-bold text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="px-5 pb-6 pt-3 border-t border-gray-100 bg-white">
          {isLastStep ? (
            <button
              onClick={handleSave}
              disabled={!editor.data.location_label}
              className="w-full py-4 bg-gray-900 text-white font-semibold rounded-xl disabled:opacity-40"
            >
              저장
            </button>
          ) : (
            <button
              onClick={() => {
                if (editor.step === 'location' && !editor.data.location_label) return;
                setEditor((e) => e && { ...e, step: nextStep(e.step) });
              }}
              disabled={editor.step === 'location' && !editor.data.location_label}
              className="w-full py-4 bg-gray-900 text-white font-semibold rounded-xl disabled:opacity-40"
            >
              다음
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-5 pt-6 pb-4">
        <button onClick={() => router.back()} className="text-gray-400 text-sm mb-3">
          ← 뒤로
        </button>
        <p className="text-xs text-gray-400 mb-1">STEP 3 / 4</p>
        <h1 className="text-xl font-bold text-gray-900">창문 정보 입력</h1>
        <p className="text-sm text-gray-500 mt-1">시공할 창문을 모두 추가해주세요</p>
        {housingAreaPyeong && (
          <p className="text-xs text-gray-400 mt-1">주택 평형: {housingAreaPyeong}평</p>
        )}
      </div>

      <div className="flex-1 px-5">
        {windows.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">아직 추가된 창문이 없습니다</p>
            <p className="text-gray-400 text-xs mt-1">아래 버튼을 눌러 창문을 추가하세요</p>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {windows.map((w) => {
              const screenTarget = isWindowScreenTarget(w);
              const screenCount = w.confirmed_screen_count || (screenTarget ? getAutoScreenCountForWindow(w.layout_code) : 0);
              return (
                <div key={w.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">{w.location_label}</span>
                        {w.is_double_window && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            이중창
                          </span>
                        )}
                        {w.frame_mohair_state === 'UNKNOWN' && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                            창틀 미확인
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {windowTypeLabel(w.window_type_code)} · {layoutCodeLabel(w.layout_code)} ·{' '}
                        {w.service_type === 'FOUR_SIDE' ? '탈거 4면' : '측면 시공'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        창틀: {frameMohairLabel(w.frame_mohair_state)}
                        {screenTarget && ` · 방충망 ${screenCount}개`}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => openEdit(w)}
                        className="text-xs text-blue-600 px-2 py-1 border border-blue-200 rounded-lg"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => removeWindow(w.id)}
                        className="text-xs text-red-500 px-2 py-1 border border-red-200 rounded-lg"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={openAdd}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
        >
          + 창문 추가
        </button>
      </div>

      <div className="px-5 pb-6 pt-3 space-y-3 border-t border-gray-100 bg-white">
        <button
          onClick={() => router.push('/estimate')}
          disabled={windows.length === 0}
          className="w-full py-4 bg-gray-900 text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-gray-800 transition-colors"
        >
          견적 확인
        </button>
        <div className="flex gap-2">
          <a
            href="tel:0000000000"
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 text-center hover:bg-gray-50"
          >
            📞 상담원 연결
          </a>
          <a
            href="/visit-request"
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 text-center hover:bg-gray-50"
          >
            방문 견적 요청
          </a>
        </div>
      </div>
    </div>
  );
}
