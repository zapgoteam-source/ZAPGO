'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Estimate } from '@/types';
import { formatKRW } from '@/lib/estimateCalculator';

export default function WorkerSignPage() {
  const { role, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!loading && role !== 'WORKER' && role !== 'ADMIN') router.replace('/login');
  }, [role, loading, router]);

  useEffect(() => {
    if (!id || (role !== 'WORKER' && role !== 'ADMIN')) return;
    supabase.from('estimates').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setEstimate(data as Estimate);
    });
  }, [id, role]);

  // Canvas 설정
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // 배경
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPos(e);
    if (pos) lastPos.current = pos;
  }, []);

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const pos = getPos(e);
      if (!pos || !lastPos.current) return;

      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPos.current = pos;
      setHasSignature(true);
    },
    [isDrawing]
  );

  const endDraw = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleConfirm = async () => {
    if (!hasSignature || !estimate) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    setSaving(true);
    try {
      const signatureDataUrl = canvas.toDataURL('image/png');

      // 견적 상태를 COMPLETED로 변경하고 서명 URL 저장, 잠금
      await supabase
        .from('estimates')
        .update({
          status: 'COMPLETED',
          customer_signature_url: signatureDataUrl,
          completed_at: new Date().toISOString(),
          locked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', estimate.id);

      setSaved(true);
    } catch (err) {
      console.error('서명 저장 오류:', err);
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center px-5 text-center bg-white">
        <div className="w-16 h-16 bg-green-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">서명 완료</h1>
        <p className="text-sm text-gray-500 mb-2">견적이 확정되었습니다.</p>
        {estimate && (
          <p className="text-base font-semibold text-gray-800 mb-6">
            {formatKRW(estimate.self_estimated_amount)} (부가세 별도)
          </p>
        )}
        <button
          onClick={() => router.replace('/worker/list')}
          className="px-8 py-4 bg-gray-900 text-white font-semibold"
        >
          목록으로
        </button>
      </div>
    );
  }

  if (loading || !estimate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="px-5 pt-6 pb-4 border-b border-gray-100">
        <button onClick={() => router.back()} className="text-gray-400 text-sm mb-2">
          ← 뒤로
        </button>
        <h1 className="text-xl font-bold text-gray-900">고객 서명</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {estimate.customer_name} · {estimate.housing_area_pyeong}평
        </p>

        {/* 최종 금액 */}
        <div className="mt-3 bg-gray-50 p-3">
          <p className="text-xs text-gray-500">최종 견적 금액 (부가세 별도)</p>
          <p className="text-xl font-bold text-gray-900">{formatKRW(estimate.self_estimated_amount)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            본 견적은 참고용 예상 금액이며, 현장 상황에 따라 변동될 수 있습니다.
          </p>
        </div>
      </div>

      <div className="flex-1 px-5 py-4">
        <p className="text-sm font-semibold text-gray-800 mb-2">아래에 서명해주세요</p>
        <p className="text-xs text-gray-400 mb-3">
          서명 후 확인 버튼을 누르면 견적이 확정되고 수정이 불가합니다.
        </p>

        {/* 서명 패드 */}
        <div className="relative border-2 border-gray-200 overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            width={600}
            height={300}
            className="w-full touch-none"
            style={{ height: '220px', cursor: 'crosshair' }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-gray-300 text-sm">서명하세요</p>
            </div>
          )}
        </div>

        <button
          onClick={clearCanvas}
          className="mt-2 text-sm text-gray-500 underline"
        >
          지우기
        </button>
      </div>

      <div className="px-5 pb-6 pt-3 border-t border-gray-100">
        <button
          onClick={handleConfirm}
          disabled={!hasSignature || saving}
          className="w-full py-4 bg-gray-900 text-white font-semibold text-base disabled:opacity-40 hover:bg-gray-800 transition-colors"
        >
          {saving ? '저장 중...' : '서명 확인 및 견적 확정'}
        </button>
        <p className="text-xs text-gray-400 text-center mt-2">
          확정 후 수정이 불가합니다
        </p>
      </div>
    </div>
  );
}
