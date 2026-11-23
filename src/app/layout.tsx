import type { Metadata, Viewport } from "next";
import { Fragment_Mono, Host_Grotesk, Imbue } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

// Títulos: didone condensada, com eixo óptico (fica mais fina e contrastada nos tamanhos grandes).
const imbue = Imbue({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  variable: "--font-imbue",
  display: "swap",
});

// Texto corrido.
const host = Host_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-host",
  display: "swap",
});

// Legendas de canto e botões.
const fragment = Fragment_Mono({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-fragment",
  display: "swap",
});

const description =
  "Casa noturna na cobertura do Viaduto Santa Ifigênia, 66. Pista no andar 22, lounge e varanda no 23, a dois minutos do metrô São Bento.";

export const metadata: Metadata = {
  title: "Ephigenia · Rooftop no centro de São Paulo",
  description,
  // TODO: definir metadataBase com o domínio final e uma imagem de compartilhamento.
  openGraph: {
    title: "Ephigenia · Rooftop no centro de São Paulo",
    description,
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0909",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${imbue.variable} ${host.variable} ${fragment.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Marca que há JS antes da primeira pintura, para a entrada do hero não piscar. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <a className="skip" href="#conteudo">
          Pular para o conteúdo
        </a>
        {children}
        <div className="grain" aria-hidden="true" />
        <SmoothScroll />
      </body>
    </html>
  );
}
