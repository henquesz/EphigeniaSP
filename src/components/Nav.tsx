"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { getLenis, irPara } from "@/lib/scroll";
import { LogoMark } from "./icons";
import Magnetic from "./Magnetic";

const LINKS = [
  { id: "casa", label: "A casa" },
  { id: "agenda", label: "Agenda" },
  { id: "cardapio", label: "Cardápio" },
  { id: "contato", label: "Como chegar" },
];

export default function Nav() {
  const header = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const [aberto, setAberto] = useState(false);

  // Fundo aparece depois de rolar um pouco.
  useEffect(() => {
    const el = header.current;
    if (!el) return;
    const onScroll = () => el.toggleAttribute("data-rolou", window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Menu do celular: trava a rolagem, anima os links e fecha com Esc.
  useEffect(() => {
    const painel = menu.current;
    if (!aberto || !painel) return;
    const lenis = getLenis();
    lenis?.stop();
    document.body.style.overflow = "hidden";
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduzir) {
      gsap.fromTo(painel, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.7, ease: "expo.inOut" });
      gsap.from(painel.querySelectorAll(".menu__link"), { yPercent: 110, duration: 0.9, ease: "expo.out", stagger: 0.06, delay: 0.25 });
    }
    painel.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", onKey);
    const voltarFoco = botao.current;
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      lenis?.start();
      voltarFoco?.focus();
    };
  }, [aberto]);

  const irDoMenu = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setAberto(false);
    requestAnimationFrame(() => irPara(id));
  };

  return (
    <header ref={header} className="nav">
      <div className="nav__inner">
        <a className="logo" href="#topo" aria-label="Ephigenia, voltar ao início">
          <LogoMark className="logo__mark" />
          <span className="logo__word">ephigenia</span>
        </a>

        <nav className="nav__menu" aria-label="Principal">
          <ul className="nav__links">
            {LINKS.map((l) => (
              <li key={l.id}>
                <a href={`#${l.id}`} className="nav__link">
                  <span className="nav__link-txt" data-txt={l.label}>
                    {l.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="nav__acoes">
          <Magnetic>
            <a className="btn btn--red btn--sm" href="#agenda">
              Ingressos
            </a>
          </Magnetic>
          <button
            ref={botao}
            type="button"
            className="nav__toggle"
            aria-expanded={aberto}
            aria-controls="menu-celular"
            onClick={() => setAberto((v) => !v)}
          >
            {aberto ? "Fechar" : "Menu"}
          </button>
        </div>
      </div>

      {aberto && (
        <div ref={menu} id="menu-celular" className="menu" role="dialog" aria-modal="true" aria-label="Menu">
          <ul>
            {LINKS.map((l) => (
              <li key={l.id} className="menu__item">
                <a className="menu__link" href={`#${l.id}`} onClick={irDoMenu(l.id)}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
