import { Fragment } from "react";

/**
 * Texto com cada letra num span ([data-ch]), para as animações de entrada.
 * Leitores de tela leem a frase inteira; as letras ficam escondidas deles.
 */
export default function Letras({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="pt">
        {text.split(" ").map((palavra, p) => (
          <Fragment key={p}>
            {p > 0 && " "}
            {/* Letras agrupadas por palavra: a linha só quebra nos espaços. */}
            <span className="pt__w">
              {Array.from(palavra).map((ch, i) => (
                <span key={i} data-ch="" className="pt__ch">
                  {ch}
                </span>
              ))}
            </span>
          </Fragment>
        ))}
      </span>
    </span>
  );
}
