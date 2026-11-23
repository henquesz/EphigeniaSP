import Agenda from '@/components/Agenda'
import Cardapio from '@/components/Cardapio'
import Atos from '@/components/cena/Atos'
import Cena from '@/components/cena/Cena'
import Footer from '@/components/Footer'
import Letras from '@/components/Letras'
import Motion from '@/components/Motion'
import Nav from '@/components/Nav'
import ScrollRevealText from '@/components/ScrollRevealText'
import SectionDots from '@/components/SectionDots'
import { SITE, dataLonga } from '@/lib/site'
import { getEventos } from '@/lib/sympla'
import './cena.css'

// Regera a página a cada hora: busca o Sympla de novo e tira os eventos que já terminaram.
export const revalidate = 3600

export default async function Home() {
  const { proximos, passados } = await getEventos()
  const proximo = proximos[0]
  const { rua, complemento } = SITE.endereco

  return (
    <div className="tresd">
      <Cena />
      <span className="guias" aria-hidden="true" />
      <Nav />
      <SectionDots />

      <main id="conteudo">
        <section id="topo" className="ato ato--topo" data-plano="topo" aria-labelledby="hero-titulo">
          <div className="ato__conteudo">
            <div className="hero__cantos">
              <p className="canto" data-intro>
                {proximo ? (
                  <a href="#agenda" className="canto__link">
                    <span className="canto__forte">{dataLonga(proximo.inicio)}</span>
                    <span className="canto__fraco">Próxima noite · {proximo.titulo}</span>
                  </a>
                ) : (
                  <span className="canto__forte">Agenda nova em breve</span>
                )}
              </p>
              <p className="canto canto--dir" data-intro>
                <span className="canto__forte">{rua}</span>
                <span className="canto__fraco">Metrô {SITE.metro}</span>
              </p>
            </div>
            <h1 id="hero-titulo" className="hero__titulo">
              <span className="hero__nome hero__nome--esq">
                <Letras text="Ephigenia" />
              </span>
              <span className="hero__dir">
                <span className="hero__nome">
                  <Letras text="Centro" />
                </span>
                <span className="hero__origem" data-intro>
                  (SP)
                </span>
              </span>
            </h1>
          </div>
        </section>

        <section id="casa" aria-labelledby="casa-titulo">
          <div className="ato ato--longo" data-plano="manifesto">
            <div className="ato__conteudo ato__conteudo--esq">
              <ScrollRevealText className="ato__manifesto" end="bottom 78%">
                Belvedere hedonista no Viaduto Santa Ifigênia. Duas pistas e uma varanda com vista quase 360 da cidade.
              </ScrollRevealText>
            </div>
          </div>

          <div className="ato ato--longo" data-plano="andares">
            <div className="ato__conteudo ato__conteudo--esq">
              <h2 id="casa-titulo" className="ato__titulo" data-split>
                Dois andares no alto do viaduto
              </h2>
              <p className="ato__texto" data-reveal>
                A Ephigenia fica na cobertura de um prédio do centro, em cima do Viaduto Santa Ifigênia. Cada andar
                tem sua pista, e muitas noites têm um line-up diferente em cada um.
              </p>
            </div>
          </div>

          <div className="ato ato--longo" data-plano="pista">
            <div className="ato__conteudo ato__conteudo--dir">
              <p className="canto">Andar de baixo</p>
              <h3 className="ato__titulo ato__titulo--grande" data-chars>
                <Letras text="Pista" />
              </h3>
              <p className="ato__texto" data-reveal>
                Pista intimista, cercada de janelas. Luz baixa, som alto e a cidade do outro lado do vidro.
              </p>
            </div>
          </div>

          <div className="ato ato--longo" data-plano="varanda">
            <div className="ato__conteudo ato__conteudo--esq">
              <p className="canto">Andar de cima</p>
              <h3 className="ato__titulo ato__titulo--grande" data-chars>
                <Letras text="Lounge e varanda" />
              </h3>
              <p className="ato__texto" data-reveal>
                Lounge com varanda quase 360. É onde se toma ar entre um set e outro, com o centro inteiro aceso em
                volta.
              </p>
              <dl className="ato__infos" data-reveal>
                <div>
                  <dt className="canto">Endereço</dt>
                  <dd>
                    {rua}, {complemento}
                  </dd>
                </div>
                <div>
                  <dt className="canto">Metrô</dt>
                  <dd>{SITE.metro}</dd>
                </div>
                <div>
                  <dt className="canto">Domingo</dt>
                  <dd>{SITE.domingo}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <div data-plano="agenda">
          <Agenda proximos={proximos} passados={passados} />
        </div>
        <div data-plano="cardapio" data-faixa>
          <Cardapio />
        </div>
      </main>

      <div data-plano="contato">
        <Footer />
      </div>
      <Motion />
      <Atos />
    </div>
  )
}
