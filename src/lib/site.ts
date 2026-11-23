// Dados da casa e da agenda, num lugar só.

export const TZ = "America/Sao_Paulo";

export const SITE = {
  nome: "Ephigenia",
  endereco: {
    rua: "Viaduto Santa Ifigênia, 66",
    complemento: "Cobertura, andares 22 e 23",
    bairro: "Centro",
    cidade: "São Paulo",
    uf: "SP",
    // TODO: incluir o CEP quando a casa confirmar.
  },
  metro: "São Bento, 2 min a pé",
  domingo: "Sunset e roda de samba à tarde",
  // TODO: horários de funcionamento por dia (ainda não informados).
  mapa: "https://www.google.com/maps/search/?api=1&query=Viaduto+Santa+Ifig%C3%AAnia%2C+66%2C+S%C3%A3o+Paulo",
  // TODO: confirmar @ do Instagram.
  instagram: "https://www.instagram.com/ephigeniasp/",
  instagramUser: "@ephigeniasp",
  sympla: "https://www.sympla.com.br/produtor/ephigenia",
  // Troque pelo arquivo final em /public ou por uma URL externa.
  cardapio: "/cardapio.pdf",
} as const;

export type Formato = "Noite" | "Sunset" | "Samba";

export type Evento = {
  slug: string;
  titulo: string;
  lineup: string[];
  formato: Formato;
  /** ISO 8601 com fuso -03:00 */
  inicio: string;
  /** ISO 8601 com fuso -03:00 */
  fim: string;
  /** Página do evento no Sympla. Sem url, o botão aparece como "Em breve". */
  url?: string;
  /** Imagem do evento (a mesma do Sympla). */
  imagem?: string;
};

/**
 * Usado quando não há SYMPLA_TOKEN (ver src/lib/sympla.ts) ou quando a API falha.
 */
export const EVENTOS: Evento[] = [
  {
    slug: "gabe-bixbita-es",
    titulo: "Gabe + Bixbita (ES)",
    lineup: ["Meriva", "Halfcab", "Alirio"],
    formato: "Noite",
    // horário a confirmar no Sympla
    inicio: "2026-11-20T23:00:00-03:00",
    fim: "2026-11-21T06:00:00-03:00",
    url: "https://www.sympla.com.br/evento/gabe-bixbita-es-ephigenia/3619237",
    imagem: "https://images.sympla.com.br/6aee02ca4e272-lg.png",
  },
];

/** Separa os eventos em próximos (do mais perto ao mais longe) e passados (do mais recente). */
export function separarEventos(lista: Evento[], agora: Date = new Date()) {
  const t = agora.getTime();
  const proximos = lista
    .filter((e) => Date.parse(e.fim) > t)
    .sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
  const passados = lista
    .filter((e) => Date.parse(e.fim) <= t)
    .sort((a, b) => Date.parse(b.inicio) - Date.parse(a.inicio));
  return { proximos, passados };
}

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, ...opts });

const fDia = fmt({ day: "2-digit" });
const fMes = fmt({ month: "short" });
const fSemana = fmt({ weekday: "short" });
const fLonga = fmt({ day: "numeric", month: "long" });
const fHora = fmt({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const fAno = fmt({ year: "numeric" });

const semPonto = (s: string) => s.replace(/\./g, "").trim().toLowerCase();

/** Dia, mês e dia da semana no fuso de São Paulo. Ex.: { dia: "20", mes: "nov", semana: "sex" } */
export function partesData(iso: string) {
  const d = new Date(iso);
  return {
    dia: fDia.format(d),
    mes: semPonto(fMes.format(d)),
    semana: semPonto(fSemana.format(d)),
  };
}

/** "20 de novembro" */
export function dataLonga(iso: string): string {
  return fLonga.format(new Date(iso));
}

/** "23h", "6h" ou "22h30" */
export function hora(iso: string): string {
  const partes = fHora.formatToParts(new Date(iso));
  const h = Number(partes.find((p) => p.type === "hour")?.value ?? 0);
  const m = partes.find((p) => p.type === "minute")?.value ?? "00";
  return m === "00" ? `${h}h` : `${h}h${m}`;
}

/** "23h às 6h" */
export function horario(e: Pick<Evento, "inicio" | "fim">): string {
  return `${hora(e.inicio)} às ${hora(e.fim)}`;
}

export function anoAtual(): string {
  return fAno.format(new Date());
}
