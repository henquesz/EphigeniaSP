import Letras from "./Letras";
import ScrollRevealText from "./ScrollRevealText";
import { SITE } from "@/lib/site";

const ANDARES = [
  {
    nivel: "Andar de baixo",
    nome: "Pista",
    texto:
      "Pista intimista, cercada de janelas. Luz baixa, som alto e a cidade do outro lado do vidro.",
  },
  {
    nivel: "Andar de cima",
    nome: "Lounge e varanda",
    texto:
      "Lounge com varanda quase 360. É onde se toma ar entre um set e outro, com o centro inteiro aceso em volta.",
  },
];

export default function Casa() {
  const { rua, complemento } = SITE.endereco;

  return (
    <section id="casa" className="sec casa" aria-labelledby="casa-titulo">
      <div className="wrap">
        <div className="cantos">
          <p className="canto">A casa</p>
          <p className="canto canto--dir">Centro de São Paulo</p>
        </div>

        <ScrollRevealText className="manifesto">
          Belvedere hedonista no Viaduto Santa Ifigênia. Duas pistas e uma varanda com vista quase 360 da
          cidade.
        </ScrollRevealText>

        <div className="casa__head">
          <h2 id="casa-titulo" className="titulo" data-split>
            Dois andares no alto do viaduto
          </h2>
          <p className="casa__texto" data-reveal>
            A Ephigenia fica na cobertura de um prédio do centro, em cima do Viaduto Santa Ifigênia. Cada
            andar tem sua pista, e muitas noites têm um line-up diferente em cada um.
          </p>
        </div>

        <ul className="andares">
          {ANDARES.map((a) => (
            <li key={a.nome} className="andar">
              <span className="andar__linha" data-line aria-hidden="true" />
              <p className="andar__nivel canto">{a.nivel}</p>
              <h3 className="andar__nome" data-chars>
                <Letras text={a.nome} />
              </h3>
              <p className="andar__texto" data-reveal>
                {a.texto}
              </p>
            </li>
          ))}
        </ul>

        <dl className="infos" data-reveal>
          <div className="infos__item">
            <dt className="canto">Endereço</dt>
            <dd>
              {rua}, {complemento}
            </dd>
          </div>
          <div className="infos__item">
            <dt className="canto">Metrô</dt>
            <dd>{SITE.metro}</dd>
          </div>
          <div className="infos__item">
            <dt className="canto">Domingo</dt>
            <dd>{SITE.domingo}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
