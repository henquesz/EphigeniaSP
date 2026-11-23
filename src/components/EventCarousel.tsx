"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, SEM_MOVIMENTO } from "@/lib/gsap";

export type ItemCarrossel = {
  slug: string;
  titulo: string;
  data: string;
  url?: string;
  imagem: string;
  passado: boolean;
};

const VELOCIDADE = 34; // px por segundo
const MINIMO_POR_GRUPO = 6;

/**
 * Faixa com as artes dos eventos do Sympla passando devagar, sem parar.
 * Para quando o cursor ou o foco entra; a rolagem da página dá um empurrão.
 */
export default function EventCarousel({ itens }: { itens: ItemCarrossel[] }) {
  const root = useRef<HTMLDivElement>(null);

  // Repete os itens até o grupo cobrir bem mais que a tela.
  const repeticoes = Math.max(1, Math.ceil(MINIMO_POR_GRUPO / itens.length));
  const grupo = Array.from({ length: repeticoes }, () => itens).flat();

  useGSAP(
    () => {
      const el = root.current;
      const track = el?.querySelector<HTMLElement>(".carrossel__track");
      const primeiro = el?.querySelector<HTMLElement>(".carrossel__grupo");
      if (!el || !track || !primeiro) return;
      if (window.matchMedia(SEM_MOVIMENTO).matches) return;

      let largura = primeiro.offsetWidth;
      const ro = new ResizeObserver(() => (largura = primeiro.offsetWidth));
      ro.observe(primeiro);

      let x = 0;
      let fator = 1;
      let alvo = 1;
      let empurrao = 0;
      const parar = () => (alvo = 0);
      const seguir = () => (alvo = 1);
      el.addEventListener("pointerenter", parar);
      el.addEventListener("pointerleave", seguir);
      el.addEventListener("focusin", parar);
      el.addEventListener("focusout", seguir);

      const st = ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => (empurrao = Math.min(Math.abs(self.getVelocity()) / 8, 600)),
      });

      const tick = (_t: number, dtMs: number) => {
        const dt = Math.min(dtMs, 50) / 1000;
        fator += (alvo - fator) * 0.06;
        empurrao *= 0.92;
        x -= (VELOCIDADE * fator + empurrao * fator) * dt;
        if (largura > 0) x = gsap.utils.wrap(-largura, 0, x);
        gsap.set(track, { x });
      };
      gsap.ticker.add(tick);

      return () => {
        gsap.ticker.remove(tick);
        st.kill();
        ro.disconnect();
        el.removeEventListener("pointerenter", parar);
        el.removeEventListener("pointerleave", seguir);
        el.removeEventListener("focusin", parar);
        el.removeEventListener("focusout", seguir);
      };
    },
    { scope: root },
  );

  const cartao = (e: ItemCarrossel, i: number, oculto: boolean) => {
    const conteudo = (
      <>
        <span className="card__img">
          <Image
            src={e.imagem}
            alt={oculto ? "" : `Arte do evento ${e.titulo}`}
            fill
            sizes="(max-width: 720px) 82vw, 36vw"
          />
        </span>
        <span className="card__data">{e.passado ? `Rolou em ${e.data}` : e.data}</span>
        <span className="card__titulo">{e.titulo}</span>
      </>
    );
    return (
      <li key={`${e.slug}-${i}`} className="card" aria-hidden={oculto || undefined}>
        {e.url ? (
          <a
            className="card__link"
            href={e.url}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={oculto ? -1 : undefined}
          >
            {conteudo}
          </a>
        ) : (
          <span className="card__link">{conteudo}</span>
        )}
      </li>
    );
  };

  return (
    <div ref={root} className="carrossel" role="region" aria-label="Artes dos eventos no Sympla">
      <div className="carrossel__track">
        <ul className="carrossel__grupo">{grupo.map((e, i) => cartao(e, i, i >= itens.length))}</ul>
        <ul className="carrossel__grupo" aria-hidden="true">
          {grupo.map((e, i) => cartao(e, i, true))}
        </ul>
      </div>
    </div>
  );
}
