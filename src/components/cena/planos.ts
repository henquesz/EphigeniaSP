/*
 * Planos de câmera da página principal. Cada seção da página com data-plano="nome" usa o plano
 * de mesmo nome; entre uma seção e outra a cena interpola todos os números.
 *
 * Unidades: a cabeça do busto fica na origem e tem ~2 unidades de altura.
 *   cam*    posição da câmera          alvo*  ponto para onde ela olha
 *   fov     abertura da lente (graus)  ox/oy  desloca o busto na tela (0.2 = 20% da largura/altura)
 *   giro    rotação do busto em radianos (positivo vira o rosto para a direita da tela)
 *   halo*   posição, tamanho (haloE), rotação (haloRX/RY/RZ) e brilho (haloL) do círculo com cruz
 *   chave*  posição da luz principal   feixe  força do feixe de cima
 *   luz     brilho geral das luzes     recuo  0 = cena normal, 1 = apagada atrás do conteúdo
 */
export const PLANO_BASE = {
  camX: 0,
  camY: -0.15,
  camZ: 7.7,
  alvoX: 0,
  alvoY: -0.42,
  alvoZ: 0,
  fov: 28,
  ox: 0,
  oy: 0,
  giro: 0.16,
  haloX: 0,
  haloY: 0.1,
  haloZ: -1.4,
  haloE: 0.8,
  haloRX: 0,
  haloRY: 0,
  haloRZ: Math.PI / 4,
  haloL: 1,
  chaveX: -1.6,
  chaveY: 5.5,
  chaveZ: 3.2,
  feixe: 1,
  luz: 1,
  recuo: 0,
}

export type Plano = typeof PLANO_BASE
export type NomePlano =
  | 'topo'
  | 'manifesto'
  | 'andares'
  | 'pista'
  | 'varanda'
  | 'agenda'
  | 'cardapio'
  | 'contato'

type Parcial = Partial<Plano>

/** Telas largas. */
const PAISAGEM: Record<NomePlano, Parcial> = {
  // De frente, círculo aceso atrás da cabeça.
  topo: {},
  // Perfil, à direita; o texto fica à esquerda.
  manifesto: {
    camZ: 8.2,
    alvoY: -0.35,
    ox: 0.25,
    giro: -1.12,
    haloX: 0.5,
    haloY: 0.2,
    haloZ: -2.4,
    haloE: 1.08,
    haloRY: 0.5,
    haloRZ: 0.35,
    haloL: 0.55,
    chaveX: -4.2,
    chaveY: 3.2,
    chaveZ: 2.2,
    feixe: 0.55,
  },
  // De cima: o círculo deita e vira um heliponto na cobertura.
  andares: {
    camX: 0.4,
    camY: 6.2,
    camZ: 7.2,
    alvoY: -0.9,
    fov: 30,
    ox: 0.2,
    giro: -0.5,
    haloX: 0,
    haloY: -1.75,
    haloZ: 0,
    haloE: 1.5,
    haloRX: -Math.PI / 2,
    haloRZ: 0.78,
    haloL: 0.9,
    chaveX: -2,
    chaveY: 6,
    chaveZ: 1.5,
    feixe: 0.9,
  },
  // Perto, de baixo para cima, luz dura: a pista.
  pista: {
    camX: 0.7,
    camY: -1.15,
    camZ: 5.4,
    alvoY: 0.12,
    fov: 31,
    ox: -0.24,
    giro: 0.75,
    haloX: -0.25,
    haloY: 0.5,
    haloZ: -2.6,
    haloE: 1.16,
    haloRX: 0.2,
    haloRZ: -0.5,
    haloL: 0.85,
    chaveX: 2.6,
    chaveY: 4.6,
    chaveZ: 2.4,
    feixe: 1.15,
  },
  // Longe, o círculo solto ao lado, como lua.
  varanda: {
    camX: 0.2,
    camY: 0.5,
    camZ: 12,
    alvoY: -0.5,
    ox: 0.2,
    giro: -0.55,
    haloX: 1.8,
    haloY: 0.7,
    haloZ: -3.6,
    haloE: 1.02,
    haloRY: -0.3,
    haloRZ: 0,
    haloL: 1,
    chaveX: -4,
    chaveY: 3.4,
    chaveZ: 1.2,
    feixe: 0.3,
    luz: 0.9,
  },
  agenda: {
    camZ: 14.5,
    alvoY: -0.4,
    giro: 0.35,
    haloY: 0.3,
    haloZ: -2.2,
    haloE: 1.5,
    haloRZ: 0.78,
    haloL: 0.35,
    feixe: 0.35,
    luz: 0.6,
    recuo: 0.65,
  },
  cardapio: {
    camZ: 11.5,
    alvoY: -0.35,
    ox: 0.03,
    giro: -0.5,
    haloY: 0.1,
    haloZ: -1.2,
    haloE: 0.92,
    haloRZ: 0.78,
    haloL: 1,
    feixe: 0.2,
  },
  // Close nos olhos, quase apagado.
  contato: {
    camX: 0.15,
    camY: 0.05,
    camZ: 5.6,
    alvoY: 0.02,
    ox: 0.2,
    giro: -0.28,
    haloX: 0.1,
    haloY: 0.3,
    haloZ: -3,
    haloE: 1.12,
    haloRZ: 0.78,
    haloL: 0.42,
    chaveX: -2.4,
    chaveY: 4,
    feixe: 0.5,
    luz: 0.75,
    recuo: 0.3,
  },
}

/** Celular em pé: o busto fica no meio da tela e o texto ocupa a parte de baixo. */
const RETRATO: Record<NomePlano, Parcial> = {
  topo: { camZ: 8.8, fov: 34, oy: -0.15, alvoY: -0.3, haloE: 0.74 },
  manifesto: { camZ: 9.4, fov: 34, ox: 0.1, oy: 0.18, giro: -1.0 },
  andares: { camZ: 8.6, fov: 36, ox: 0, oy: 0.2, haloE: 1.45 },
  pista: { camZ: 6.6, fov: 36, ox: 0, oy: 0.2, giro: 0.55, haloE: 1.25 },
  varanda: { camZ: 12.5, fov: 34, ox: 0.06, oy: 0.17, haloX: 1.1, haloY: 0.5, haloE: 0.8 },
  agenda: { camZ: 14, fov: 34, oy: 0.1 },
  cardapio: { camZ: 13, fov: 34, ox: 0.37, oy: 0, haloE: 0.85 },
  contato: { camZ: 7.4, fov: 34, ox: 0, oy: 0.2 },
}

export function plano(nome: NomePlano, retrato: boolean): Plano {
  return { ...PLANO_BASE, ...PAISAGEM[nome], ...(retrato ? RETRATO[nome] : {}) }
}

export function ehPlano(nome: string | undefined): nome is NomePlano {
  return !!nome && nome in PAISAGEM
}
