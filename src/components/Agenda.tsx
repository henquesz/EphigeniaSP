import AgendaLista, { type LinhaEvento } from "./AgendaLista";
import EventCarousel, { type ItemCarrossel } from "./EventCarousel";
import { SITE, dataLonga, horario, partesData, type Evento } from "@/lib/site";

type Props = { proximos: Evento[]; passados: Evento[] };

export default function Agenda({ proximos, passados }: Props) {
  const carrossel: ItemCarrossel[] = [
    ...proximos.map((e) => ({ e, passado: false })),
    ...passados.slice(0, 10).map((e) => ({ e, passado: true })),
  ]
    .filter(({ e }) => e.imagem)
    .map(({ e, passado }) => ({
      slug: e.slug,
      titulo: e.titulo,
      data: dataLonga(e.inicio),
      url: e.url,
      imagem: e.imagem as string,
      passado,
    }));

  const linhas: LinhaEvento[] = proximos.map((e) => ({
    slug: e.slug,
    titulo: e.titulo,
    lineup: e.lineup,
    formato: e.formato,
    inicio: e.inicio,
    ...partesData(e.inicio),
    horario: horario(e),
    url: e.url,
  }));

  return (
    <section id="agenda" className="sec agenda" aria-labelledby="agenda-titulo">
      <div className="wrap">
        <div className="cantos">
          <p className="canto">Agenda</p>
          <p className="canto canto--dir">
            <a className="canto__link" href={SITE.sympla} target="_blank" rel="noopener noreferrer">
              Ephigenia no Sympla
            </a>
          </p>
        </div>

        <div className="agenda__head">
          <h2 id="agenda-titulo" className="titulo" data-split>
            Próximas datas
          </h2>
          <p className="agenda__nota" data-reveal>
            Ingressos pelo Sympla. Horários podem mudar, confira na página de cada evento.
          </p>
        </div>
      </div>

      {carrossel.length > 0 && <EventCarousel itens={carrossel} />}

      <div className="wrap">
        {linhas.length > 0 ? (
          <AgendaLista eventos={linhas} />
        ) : (
          <p className="agenda__vazia" data-reveal>
            Agenda nova sai em breve. Acompanhe pelo{" "}
            <a className="link" href={SITE.instagram} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            .
          </p>
        )}
      </div>
    </section>
  );
}
