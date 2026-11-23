"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP, COM_MOVIMENTO } from "@/lib/gsap";

type Props = {
  children: string;
  className?: string;
  /** Onde o texto termina de acender (ScrollTrigger). */
  end?: string;
};

/**
 * Texto que acende palavra por palavra conforme a rolagem
 * (como o ScrollReveal do React Bits, feito com SplitText + ScrollTrigger).
 */
export default function ScrollRevealText({ children, className, end = "bottom 50%" }: Props) {
  const ref = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(COM_MOVIMENTO, () => {
        const split = SplitText.create(el, { type: "words", aria: "auto" });
        gsap.fromTo(
          split.words,
          { opacity: 0.1, filter: "blur(8px)", yPercent: 20 },
          {
            opacity: 1,
            filter: "blur(0px)",
            yPercent: 0,
            ease: "none",
            stagger: 0.06,
            scrollTrigger: { trigger: el, start: "top 82%", end, scrub: 0.6 },
          },
        );
        return () => split.revert();
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [end] },
  );

  return (
    <p ref={ref} className={className}>
      {children}
    </p>
  );
}
