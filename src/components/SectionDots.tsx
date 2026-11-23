"use client";

import { useEffect, useState } from "react";

const SECOES = [
  { id: "topo", label: "Início" },
  { id: "casa", label: "A casa" },
  { id: "agenda", label: "Agenda" },
  { id: "cardapio", label: "Cardápio" },
  { id: "contato", label: "Como chegar" },
];

/** Coluna de círculos com cruz, como a do flyer. Marca a seção visível. */
export default function SectionDots() {
  const [ativa, setAtiva] = useState("topo");

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setAtiva(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const s of SECOES) {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  return (
    <nav className={`dots${ativa === "cardapio" ? " dots--sobre-vermelho" : ""}`} aria-label="Seções">
      <ul>
        {SECOES.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="dots__item"
              aria-label={s.label}
              aria-current={ativa === s.id ? "true" : undefined}
            >
              <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
                <circle className="dots__fill" cx="10" cy="10" r="7.5" />
                <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <path d="M10 2.5v15M2.5 10h15" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              <span className="dots__label">{s.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
