import type { Metadata } from "next";
import Agenda from "@/components/Agenda";
import Cardapio from "@/components/Cardapio";
import Casa from "@/components/Casa";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Motion from "@/components/Motion";
import Nav from "@/components/Nav";
import SectionDots from "@/components/SectionDots";
import { dataLonga } from "@/lib/site";
import { getEventos } from "@/lib/sympla";

// Versão anterior da página, com o busto em dither. Guardada fora dos buscadores.
export const metadata: Metadata = {
  title: "Ephigenia · dither",
  robots: { index: false, follow: false },
};

// Regera a página a cada hora: busca o Sympla de novo e tira os eventos que já terminaram.
export const revalidate = 3600;

export default async function Dither() {
  const { proximos, passados } = await getEventos();
  const proximo = proximos[0];

  return (
    <>
      <Nav />
      <SectionDots />
      <main id="conteudo">
        <Hero proximo={proximo ? { data: dataLonga(proximo.inicio), titulo: proximo.titulo } : null} />
        <Casa />
        <Agenda proximos={proximos} passados={passados} />
        <Cardapio />
      </main>
      <Footer />
      <Motion />
    </>
  );
}
