# Ephigenia

Site de uma página da Ephigenia, rooftop no Viaduto Santa Ifigênia, 66 (centro de São Paulo).

Next.js 16 (App Router), React 19, TypeScript e CSS puro em `src/app/globals.css`.
Movimento com GSAP (ScrollTrigger e SplitText) e rolagem suave com Lenis.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

## Onde mexer

| O quê | Arquivo |
| --- | --- |
| Endereço, links, Instagram, cardápio, eventos de reserva | `src/lib/site.ts` |
| Eventos vindos do Sympla | `src/lib/sympla.ts` |
| Cores, fontes e layout | `src/app/globals.css` e `src/app/layout.tsx` |
| Cena 3D (câmera, luz, posição do busto por seção) | `src/components/cena/planos.ts` |
| Cardápio | `public/cardapio.pdf` (ou troque `SITE.cardapio` por uma URL) |

## Cena 3D

A página principal tem um canvas em three.js fixo atrás de tudo: `src/app/page.tsx`, `src/app/cena.css` e
`src/components/cena/`. O three.js é baixado depois da montagem, sem travar o texto.

| O quê | Arquivo |
| --- | --- |
| Câmera, posição do busto, círculo e luz de cada seção (desktop e celular) | `src/components/cena/planos.ts` |
| Cena, luzes, material e desempenho | `src/components/cena/cena3d.ts` |
| Feixe, poeira, cor final e janela vermelha do cardápio | `src/components/cena/shaders.ts` |
| Layout dos textos | `src/app/cena.css` |

Cada seção com `data-plano="nome"` usa o plano de mesmo nome em `planos.ts`. Sem WebGL aparece o busto em pontos;
com `prefers-reduced-motion` a câmera só troca de plano com a rolagem.

Modelo: [Marble Bust 01](https://polyhaven.com/a/marble_bust_01), de Rico Cilliers, Poly Haven, CC0
(sem a textura de cor, porque a escultura fica preta na cena).

## Versão anterior (/dither)

A página com o busto em halftone continua em `/dither`, fora dos buscadores: `src/app/dither/page.tsx`,
`src/components/Hero.tsx`, `src/components/Casa.tsx` e `src/components/reactbits/`. Tamanho e posição do busto dela:
variáveis `--busto-tamanho`, `--busto-x` e `--busto-y` em `.hero__busto` (`globals.css`).

## Agenda e Sympla

Com a variável `SYMPLA_TOKEN`, a agenda e o carrossel puxam os eventos pela API oficial do Sympla,
com as imagens de cada evento. O token é do produtor: Sympla > Minha conta > Integrações.

```bash
# .env.local
SYMPLA_TOKEN=seu-token
```

Sem token (ou se a API falhar), o site usa a lista `EVENTOS` de `src/lib/site.ts`.
A página é regerada a cada hora (`revalidate = 3600`): eventos que já terminaram saem da lista
e vão para o carrossel como "Rolou em".

O `cacheComponents`, que o create-next-app 16 liga por padrão, está desligado em `next.config.ts`,
porque com ele o Next não aceita `revalidate` na página.

## Fontes

- **Imbue**: títulos (didone condensada, com eixo óptico)
- **Host Grotesk**: texto corrido
- **Fragment Mono**: legendas de canto e botões

As três vêm do Google Fonts via `next/font` (licença OFL).

## Componentes do React Bits

`src/components/reactbits/` tem três componentes adaptados do [React Bits](https://reactbits.dev)
(MIT + Commons Clause, licença em `src/components/reactbits/LICENSE.md`):

- `HalftoneBust` (em `/dither`), a partir do HalftoneReveal. É o busto em meio-tom, que se mexe como um GIF a 12 fps
  e revela a foto debaixo do cursor. Se o navegador não tiver WebGL2, cai no `DitherStatue` (canvas 2D).
- `GradientASCII`, o fundo ASCII do hero em `/dither`.
- `LightRays`, o feixe de luz do hero em `/dither`.

Os outros efeitos (títulos que sobem letra por letra, manifesto que acende com a rolagem, carrossel
automático, botões magnéticos e o dither animado do cardápio) foram escritos no projeto, com GSAP e canvas.
Tudo respeita `prefers-reduced-motion`.

## Busto

`public/estatua.png` é uma foto do busto de Marco Aurélio do Château de Hautefort
([Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Marc-Aur%C3%A8le_Ch%C3%A2teau_de_Hautefort_25.jpg),
foto de Jebulon, CC0). A foto foi recortada sem o pedestal e convertida para cinza, com fundo transparente
e contraste realçado. Para trocar, use um PNG com fundo transparente ou preto.

## Pendências (TODO no código)

- `public/cardapio.pdf` é provisório
- CEP do endereço
- Horários de funcionamento
- Confirmar o @ do Instagram
- Confirmar o horário do evento de 20/11 no Sympla
- `metadataBase` e imagem de compartilhamento quando houver domínio
