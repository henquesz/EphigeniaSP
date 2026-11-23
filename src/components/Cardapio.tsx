import DotField from "./DotField";
import Magnetic from "./Magnetic";
import Letras from "./Letras";
import { ArrowUpRight } from "./icons";
import { SITE } from "@/lib/site";

export default function Cardapio() {
  return (
    <section id="cardapio" className="cardapio" aria-labelledby="cardapio-titulo">
      <DotField className="cardapio__dots" color="rgba(10, 9, 9, 0.5)" gap={16} size={3.4} />
      <div className="wrap cardapio__inner">
        <div className="cantos">
          <p className="canto">Bar</p>
          <p className="canto canto--dir">Ephigenia</p>
        </div>

        <h2 id="cardapio-titulo" className="cardapio__titulo" data-chars>
          <Letras text="Cardápio" />
        </h2>

        <div className="cardapio__base">
          <span className="cardapio__linha" data-line aria-hidden="true" />
          <p className="cardapio__texto" data-reveal>
            O que sai do bar, com preço. Abre em PDF.
          </p>
          <Magnetic>
            <a
              className="btn btn--preto btn--lg"
              href={SITE.cardapio}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Abrir cardápio em PDF (abre em nova aba)"
            >
              Abrir cardápio
              <ArrowUpRight className="btn__arrow" />
            </a>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
