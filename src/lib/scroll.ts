import type Lenis from "lenis";

// Instância única do Lenis, criada em SmoothScroll.tsx.
let lenis: Lenis | null = null;

export function setLenis(instancia: Lenis | null) {
  lenis = instancia;
}

export function getLenis() {
  return lenis;
}

/** Rola até a seção e leva o foco junto, para teclado e leitor de tela. */
export function irPara(id: string) {
  const alvo = document.getElementById(id);
  if (!alvo) return;

  if (lenis) {
    lenis.scrollTo(id === "topo" ? 0 : alvo, { duration: 1.4 });
  } else {
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    alvo.scrollIntoView({ behavior: reduzir ? "auto" : "smooth" });
  }

  if (!alvo.hasAttribute("tabindex")) alvo.setAttribute("tabindex", "-1");
  alvo.focus({ preventScroll: true });
  history.replaceState(null, "", `#${id}`);
}
