"use client";

import { useEffect, useRef } from "react";
import { preload } from "react-dom";

type Props = {
  /** Imagem da estátua. PNG com fundo transparente ou preto. */
  src?: string;
  /** Distância entre os centros dos pontos, em px. */
  cell?: number;
  /** Cor dos pontos. */
  color?: string;
  /** Cor dos pontos mais claros (brilho acima de 0.84). */
  highlight?: string;
  /** Curva aplicada ao brilho antes de virar raio. */
  gamma?: number;
  label?: string;
  className?: string;
};

const RAIO_CURSOR = 90; // px de alcance do cursor
const DESLOCAMENTO = 14; // px de deslocamento máximo
const FADE = 0.18; // fração final da altura em que os pontos somem
const LIMIAR_DESTAQUE = 0.84;
const RAIO_MINIMO = 0.3;

/**
 * Um ponto por pixel da imagem reduzida: raio = (cell/2) · brilho^gamma · alfa,
 * sumindo nos últimos 18% da altura. Retorna [x, y, raio, destaque] por ponto.
 */
function amostrar(
  data: Uint8ClampedArray,
  cols: number,
  rows: number,
  o: { cell: number; gamma: number; left: number; top: number },
): Float32Array {
  const maxR = o.cell / 2;
  const fadeFrom = rows * (1 - FADE);
  const out = new Float32Array(cols * rows * 4);
  let n = 0;

  for (let y = 0; y < rows; y++) {
    const fade = y < fadeFrom ? 1 : Math.max(0, 1 - (y + 0.5 - fadeFrom) / (rows - fadeFrom));
    for (let x = 0; x < cols && fade > 0; x++) {
      const i = (y * cols + x) * 4;
      const a = data[i + 3] / 255;
      const lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
      const r = maxR * Math.pow(lum, o.gamma) * a * fade;
      if (r < RAIO_MINIMO) continue;
      out[n++] = o.left + x * o.cell;
      out[n++] = o.top + y * o.cell;
      out[n++] = r;
      out[n++] = lum > LIMIAR_DESTAQUE ? 1 : 0;
    }
  }

  return out.slice(0, n);
}

export default function DitherStatue({
  src = "/estatua.png",
  cell = 5,
  color = "#d4161c",
  highlight = "#ece5da",
  gamma = 1.25,
  label = "Busto clássico de mármore desenhado em pontos",
  className,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  // Começa a baixar a imagem antes da hidratação.
  preload(src, { as: "image", crossOrigin: "anonymous" });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const sampler = document.createElement("canvas");
    const sctx = sampler.getContext("2d", { willReadFrequently: true });
    if (!ctx || !sctx) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motion.matches;

    let img: HTMLImageElement | null = null;
    // [x, y, raio, destaque] por ponto
    let dots: Float32Array = new Float32Array(0);
    let count = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let px = 0;
    let py = 0;
    let active = false;
    let frame = 0;

    // Reduz em etapas de 1/2 para a média por célula ficar correta em qualquer navegador.
    const reduzir = (source: HTMLImageElement, cols: number, rows: number) => {
      let el: CanvasImageSource = source;
      let sw = source.naturalWidth;
      let sh = source.naturalHeight;
      while (sw > cols * 2 && sh > rows * 2) {
        const tw = Math.ceil(sw / 2);
        const th = Math.ceil(sh / 2);
        const tmp = document.createElement("canvas");
        tmp.width = tw;
        tmp.height = th;
        const t = tmp.getContext("2d");
        if (!t) break;
        t.drawImage(el, 0, 0, sw, sh, 0, 0, tw, th);
        el = tmp;
        sw = tw;
        sh = th;
      }
      sampler.width = cols;
      sampler.height = rows;
      sctx.clearRect(0, 0, cols, rows);
      sctx.imageSmoothingEnabled = true;
      sctx.imageSmoothingQuality = "high";
      sctx.drawImage(el, 0, 0, sw, sh, 0, 0, cols, rows);
      return sctx.getImageData(0, 0, cols, rows).data;
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const base = new Path2D();
      const destaque = new Path2D();
      const empurra = active && !reduced;
      const r2 = RAIO_CURSOR * RAIO_CURSOR;

      for (let k = 0; k < count; k++) {
        const j = k * 4;
        let x = dots[j];
        let y = dots[j + 1];
        const r = dots[j + 2];

        if (empurra) {
          const dx = x - px;
          const dy = y - py;
          const d2 = dx * dx + dy * dy;
          if (d2 < r2 && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const f = 1 - d / RAIO_CURSOR;
            const s = (DESLOCAMENTO * f * f * (3 - 2 * f)) / d;
            x += dx * s;
            y += dy * s;
          }
        }

        const path = dots[j + 3] ? destaque : base;
        path.moveTo(x + r, y);
        path.arc(x, y, r, 0, Math.PI * 2);
      }

      ctx.fillStyle = color;
      ctx.fill(base);
      ctx.fillStyle = highlight;
      ctx.fill(destaque);
    };

    const build = () => {
      if (!img || w < 1 || h < 1) return;

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      // Imagem inteira dentro do canvas, alinhada embaixo e no centro.
      const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
      const cols = Math.max(1, Math.floor((img.naturalWidth * scale) / cell));
      const rows = Math.max(1, Math.floor((img.naturalHeight * scale) / cell));
      const left = (w - cols * cell) / 2 + cell / 2;
      const top = h - rows * cell + cell / 2;

      let data: Uint8ClampedArray;
      try {
        data = reduzir(img, cols, rows);
      } catch {
        // Imagem de outra origem sem CORS: não dá para ler os pixels.
        return;
      }

      dots = amostrar(data, cols, rows, { cell, gamma, left, top });
      count = dots.length / 4;
      draw();
      canvas.dataset.ready = "true";
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        draw();
      });
    };

    const onMove = (e: PointerEvent) => {
      if (reduced || !count) return;
      px = e.offsetX;
      py = e.offsetY;
      active = true;
      schedule();
    };

    const onLeave = () => {
      if (!active) return;
      active = false;
      schedule();
    };

    const onMotionChange = () => {
      reduced = motion.matches;
      if (reduced) onLeave();
    };

    // O callback já roda uma vez por frame; mudar canvas.width não altera o tamanho CSS, então não há laço.
    const ro = new ResizeObserver(([entry]) => {
      w = entry.contentRect.width;
      h = entry.contentRect.height;
      build();
    });
    ro.observe(canvas);

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => {
      img = image;
      build();
    };
    image.src = src;

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointercancel", onLeave);
    motion.addEventListener("change", onMotionChange);

    return () => {
      image.onload = null;
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointercancel", onLeave);
      motion.removeEventListener("change", onMotionChange);
      cancelAnimationFrame(frame);
    };
  }, [src, cell, color, highlight, gamma]);

  return (
    <canvas ref={ref} className={className} role="img" aria-label={label}>
      {label}
    </canvas>
  );
}
