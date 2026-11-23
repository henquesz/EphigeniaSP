"use client";

import { gsap, ScrollTrigger, SplitText, useGSAP, COM_MOVIMENTO } from "@/lib/gsap";

/**
 * Animações de entrada por atributo, para componentes de servidor:
 * - data-split: título sobe letra por letra, dentro de máscaras por linha
 * - data-chars: letras de um <Letras> sobem ("scrub" acompanha a rolagem)
 * - data-reveal: bloco sobe e aparece
 * - data-line: linha cresce da esquerda
 */
export default function Motion() {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add(COM_MOVIMENTO, () => {
      const splits = gsap.utils.toArray<HTMLElement>("[data-split]").map((el) =>
        SplitText.create(el, {
          type: "lines,chars",
          mask: "lines",
          aria: "auto",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.chars, {
              yPercent: 120,
              rotate: 6,
              duration: 1.2,
              ease: "expo.out",
              stagger: 0.022,
              scrollTrigger: { trigger: el, start: "top 86%" },
            }),
        }),
      );

      gsap.utils.toArray<HTMLElement>("[data-chars]").forEach((el) => {
        const letras = el.querySelectorAll("[data-ch]");
        const scrub = el.dataset.chars === "scrub";
        gsap.from(letras, {
          yPercent: 90,
          opacity: 0,
          duration: 1.1,
          ease: scrub ? "none" : "expo.out",
          stagger: 0.04,
          scrollTrigger: scrub
            ? { trigger: el, start: "top 98%", end: "top 55%", scrub: 0.8 }
            : { trigger: el, start: "top 88%" },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          y: 56,
          autoAlpha: 0,
          duration: 1.2,
          ease: "power3.out",
          delay: Number(el.dataset.reveal) || 0,
          scrollTrigger: { trigger: el, start: "top 90%" },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-line]").forEach((el) => {
        gsap.from(el, {
          scaleX: 0,
          transformOrigin: "left center",
          duration: 1.6,
          ease: "expo.inOut",
          scrollTrigger: { trigger: el, start: "top 94%" },
        });
      });

      // Mede de novo quando as fontes terminam de carregar.
      void document.fonts?.ready.then(() => ScrollTrigger.refresh());

      return () => splits.forEach((s) => s.revert());
    });

    return () => mm.revert();
  });

  return null;
}
