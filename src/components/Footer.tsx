import Letras from "./Letras";
import { ArrowUpRight } from "./icons";
import { SITE, anoAtual } from "@/lib/site";

export default function Footer() {
  const { rua, complemento, bairro, cidade, uf } = SITE.endereco;

  return (
    <footer id="contato" className="footer">
      <div className="wrap">
        <div className="cantos">
          <p className="canto">Como chegar</p>
          <p className="canto canto--dir">Ephigenia</p>
        </div>

        <div className="footer__cols">
          <div className="footer__col" data-reveal>
            <h2 className="canto rotulo">Endereço</h2>
            <address>
              {rua}
              <br />
              {complemento}
              <br />
              {bairro}, {cidade}, {uf}
            </address>
          </div>

          <div className="footer__col" data-reveal="0.1">
            <h2 className="canto rotulo">Como chegar</h2>
            <p>Metrô {SITE.metro}</p>
            <a className="link" href={SITE.mapa} target="_blank" rel="noopener noreferrer">
              Abrir no Google Maps
              <ArrowUpRight className="link__arrow" />
            </a>
          </div>

          <div className="footer__col" data-reveal="0.2">
            <h2 className="canto rotulo">Acompanhe</h2>
            <a className="link" href={SITE.instagram} target="_blank" rel="noopener noreferrer">
              Instagram {SITE.instagramUser}
              <ArrowUpRight className="link__arrow" />
            </a>
            <a className="link" href={SITE.sympla} target="_blank" rel="noopener noreferrer">
              Sympla
              <ArrowUpRight className="link__arrow" />
            </a>
            <a className="link" href="#agenda">
              Agenda
            </a>
          </div>
        </div>
      </div>

      <div className="footer__marca" aria-hidden="true">
        <p className="footer__marca-txt" data-chars="scrub">
          <Letras text="ephigenia" />
        </p>
      </div>

      <div className="wrap footer__base">
        <p>© {anoAtual()} Ephigenia</p>
        <p>Proibida a entrada de menores de 18 anos. Beba com moderação.</p>
      </div>
    </footer>
  );
}
