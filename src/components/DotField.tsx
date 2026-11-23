"use client";

import { useEffect, useRef } from "react";

type Props = {
  color?: string;
  /** distância entre pontos, em px */
  gap?: number;
  /** raio máximo, em px */
  size?: number;
  className?: string;
};

// Matriz de Bayer 4x4: limiares do dither ordenado.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const FPS = 15;

/**
 * Dither ordenado em movimento: faixas e manchas atravessam o campo e acendem/apagam
 * os pontos pelo padrão de Bayer, a 15 fps, como um GIF. O cursor abre um clarão.
 * Só anima enquanto está na tela.
 */
export default function DotField({ color = "rgba(10,9,9,0.5)", gap = 14, size = 3.2, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let ultimo = 0;
    let visivel = false;
    const cursor = { x: -1e4, y: -1e4, forca: 0 };

    // Campo de 0 a 1 que se move com o tempo.
    const campo = (x: number, y: number, t: number) => {
      const faixa = Math.sin((x * 0.55 + y) * 0.009 - t * 1.4);
      const onda = Math.sin(x * 0.006 + t * 0.7) * Math.cos(y * 0.011 - t * 0.9);
      const cx = w * (0.65 + 0.25 * Math.sin(t * 0.35));
      const cy = h * (0.5 + 0.35 * Math.cos(t * 0.45));
      const mancha = Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * (w * 0.18) ** 2));
      let v = 0.42 + 0.22 * faixa + 0.18 * onda + 0.45 * mancha;
      if (cursor.forca > 0.01) {
        const d = Math.hypot(x - cursor.x, y - cursor.y);
        if (d < 200) v += cursor.forca * (1 - d / 200) * 0.8;
      }
      return v;
    };

    const desenhar = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      ctx.beginPath();
      const cols = Math.ceil(w / gap) + 1;
      const rows = Math.ceil(h / gap) + 1;
      for (let j = 0; j < rows; j++) {
        const y = j * gap;
        for (let i = 0; i < cols; i++) {
          const x = i * gap;
          const v = campo(x, y, t);
          if (v < BAYER[(i & 3) + ((j & 3) << 2)]) continue;
          const r = size * (0.55 + 0.45 * Math.min(1, v));
          ctx.moveTo(x + r, y);
          ctx.arc(x, y, r, 0, Math.PI * 2);
        }
      }
      ctx.fill();
    };

    const loop = (agora: number) => {
      raf = 0;
      if (!visivel) return;
      if (agora - ultimo >= 1000 / FPS) {
        ultimo = agora;
        cursor.forca *= 0.9;
        // Tempo em passos, para o movimento ter cara de GIF.
        desenhar(Math.floor(agora / (1000 / FPS)) / FPS);
      }
      raf = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(([entry]) => {
      w = entry.contentRect.width;
      h = entry.contentRect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      desenhar(performance.now() / 1000);
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      visivel = entry.isIntersecting;
      if (visivel && !reduzir && !raf) raf = requestAnimationFrame(loop);
    });
    io.observe(canvas);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      cursor.x = e.clientX - r.left;
      cursor.y = e.clientY - r.top;
      cursor.forca = 1;
    };
    const alvo = canvas.parentElement;
    alvo?.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      alvo?.removeEventListener("pointermove", onMove);
    };
  }, [color, gap, size]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
