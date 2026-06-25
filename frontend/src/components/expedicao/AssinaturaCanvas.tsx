'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Button } from '@/components/ui/button';
import { IconEraser } from '@tabler/icons-react';

export interface AssinaturaCanvasHandle {
  isEmpty: () => boolean;
  exportarBlob: () => Promise<Blob | null>;
  limpar: () => void;
}

export interface AssinaturaCanvasProps {
  disabled?: boolean;
  className?: string;
}

function obterPosicao(
  canvas: HTMLCanvasElement,
  event: React.MouseEvent | React.TouchEvent,
): { x: number; y: number } | null {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  if ('touches' in event) {
    const touch = event.touches[0] ?? event.changedTouches[0];
    if (!touch) return null;
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  }

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

export const AssinaturaCanvas = forwardRef<
  AssinaturaCanvasHandle,
  AssinaturaCanvasProps
>(function AssinaturaCanvas({ disabled = false, className }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const desenhandoRef = useRef(false);
  const teveTracoRef = useRef(false);
  const [teveTraco, setTeveTraco] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  function limpar() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    teveTracoRef.current = false;
    setTeveTraco(false);
  }

  function iniciarDesenho(
    event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) {
    if (disabled) return;
    event.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = obterPosicao(canvas, event);
    if (!pos) return;

    desenhandoRef.current = true;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function continuarDesenho(
    event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) {
    if (!desenhandoRef.current || disabled) return;
    event.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = obterPosicao(canvas, event);
    if (!pos) return;

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    if (!teveTracoRef.current) {
      teveTracoRef.current = true;
      setTeveTraco(true);
    }
  }

  function finalizarDesenho() {
    desenhandoRef.current = false;
  }

  async function exportarBlob(): Promise<Blob | null> {
    const canvas = canvasRef.current;
    if (!canvas || !teveTracoRef.current) return null;

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  }

  useImperativeHandle(ref, () => ({
    isEmpty: () => !teveTracoRef.current,
    exportarBlob,
    limpar,
  }));

  return (
    <div className={className}>
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <canvas
          ref={canvasRef}
          width={560}
          height={180}
          className={`h-44 w-full touch-none ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-crosshair'}`}
          onMouseDown={iniciarDesenho}
          onMouseMove={continuarDesenho}
          onMouseUp={finalizarDesenho}
          onMouseLeave={finalizarDesenho}
          onTouchStart={iniciarDesenho}
          onTouchMove={continuarDesenho}
          onTouchEnd={finalizarDesenho}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {teveTraco
            ? 'Assinatura capturada no canvas.'
            : 'Desenhe a assinatura do recebedor com o mouse ou o dedo.'}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !teveTraco}
          onClick={limpar}
        >
          <IconEraser className="mr-1 h-4 w-4" />
          Limpar
        </Button>
      </div>
    </div>
  );
});
