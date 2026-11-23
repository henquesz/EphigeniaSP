import { EVENTOS, separarEventos, type Evento, type Formato } from "./site";

/*
 * Eventos pela API oficial do Sympla (https://developers.sympla.com.br).
 * O token é do produtor: Sympla > Minha conta > Integrações > Gerar token.
 * Guarde em SYMPLA_TOKEN (.env.local ou nas variáveis do deploy). Sem token,
 * ou se a API falhar, o site usa a lista de EVENTOS em site.ts.
 */

const API = "https://api.sympla.com.br/public/v4/events";

type SymplaEvento = {
  id: number;
  name: string;
  start_date: string; // "2026-11-20 23:00:00", horário de São Paulo
  end_date: string;
  image?: string;
  url?: string;
  cancelled?: number | boolean;
  private_event?: number | boolean;
};

const paraIso = (data: string) => (data.includes("T") ? data : `${data.replace(" ", "T")}-03:00`);

function formatoPeloNome(nome: string): Formato {
  if (/samba|roda/i.test(nome)) return "Samba";
  if (/sunset|p[ôo]r do sol/i.test(nome)) return "Sunset";
  return "Noite";
}

function slug(nome: string, id: number) {
  const base = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${id}`;
}

async function daApi(token: string): Promise<Evento[] | null> {
  try {
    const params = new URLSearchParams({
      published: "true",
      page_size: "100",
      field_sort: "start_date",
      sort: "DESC",
    });
    const res = await fetch(`${API}?${params}`, {
      headers: { s_token: token },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: SymplaEvento[] };
    const lista = (json.data ?? [])
      .filter((e) => !e.cancelled && !e.private_event)
      .map<Evento>((e) => ({
        slug: slug(e.name, e.id),
        titulo: e.name.trim(),
        lineup: [],
        formato: formatoPeloNome(e.name),
        inicio: paraIso(e.start_date),
        fim: paraIso(e.end_date),
        url: e.url,
        imagem: e.image,
      }));
    return lista.length > 0 ? lista : null;
  } catch {
    return null;
  }
}

export async function getEventos(agora: Date = new Date()) {
  const token = process.env.SYMPLA_TOKEN;
  const lista = (token ? await daApi(token) : null) ?? EVENTOS;
  return separarEventos(lista, agora);
}
