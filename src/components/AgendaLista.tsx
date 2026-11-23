import { ArrowUpRight } from "./icons";

export type LinhaEvento = {
  slug: string;
  titulo: string;
  lineup: string[];
  formato: string;
  inicio: string;
  dia: string;
  mes: string;
  semana: string;
  horario: string;
  url?: string;
};

/** Lista de datas. No hover, uma linha vermelha cresce na base de cada linha (só CSS). */
export default function AgendaLista({ eventos }: { eventos: LinhaEvento[] }) {
  return (
    <ol className="eventos">
      {eventos.map((e) => (
        <li key={e.slug} className="evento">
          <time className="evento__data" dateTime={e.inicio}>
            <span className="evento__dia">{e.dia}</span>
            <span className="evento__mes">
              <span>{e.mes}</span>
              <span>{e.semana}</span>
            </span>
          </time>

          <p className="evento__tipo canto">{e.formato}</p>

          <div className="evento__info">
            <h3 className="evento__titulo">{e.titulo}</h3>
            {e.lineup.length > 0 && <p className="evento__lineup">{e.lineup.join(" · ")}</p>}
          </div>

          <p className="evento__hora">{e.horario}</p>

          <div className="evento__acao">
            {e.url ? (
              <a
                className="btn btn--red"
                href={e.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Ingressos para ${e.titulo} no Sympla (abre em nova aba)`}
              >
                Ingressos
                <ArrowUpRight className="btn__arrow" />
              </a>
            ) : (
              <span className="btn btn--off" aria-disabled="true">
                Em breve
              </span>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
