/*
 * Cena em three.js da página principal. Este arquivo só é baixado quando a página monta
 * (import dinâmico em Cena.tsx), para o three.js não pesar no carregamento inicial.
 *
 * Modelo: "Marble Bust 01", de Rico Cilliers, Poly Haven, CC0.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { ehPlano, plano, PLANO_BASE, type NomePlano, type Plano } from './planos'
import { ACABAMENTO, CLARAO, COPIA, FEIXE, POEIRA } from './shaders'

const MODELO = '/modelos/marble_bust_01/marble_bust_01_2k.gltf'
const ESCALA = 8
// Altura do centro da cabeça no modelo (metros), para ela cair na origem da cena.
const CABECA_Y = 0.395
const RAIO_HALO = 1.5

const VERMELHO = new THREE.Color('#ff1f1c')
const CHAVES = Object.keys(PLANO_BASE) as (keyof Plano)[]

type Marco = { nome: NomePlano; inicio: number; fim: number }

type Opcoes = {
  /** Chamado quando o busto está pronto para aparecer. */
  aoIniciar: () => void
  /** Chamado se o WebGL ou o modelo falhar. */
  aoFalhar: () => void
}

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const suave = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

/** Estúdio preto com painéis de luz, para os reflexos da escultura. */
function criarAmbiente(renderer: THREE.WebGLRenderer) {
  const estudio = new THREE.Scene()
  estudio.background = new THREE.Color(0x020101)
  const painel = (
    largura: number,
    altura: number,
    pos: [number, number, number],
    cor: [number, number, number],
  ) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(largura, altura),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(...cor), side: THREE.DoubleSide }),
    )
    m.position.set(...pos)
    m.lookAt(0, 0, 0)
    estudio.add(m)
  }
  // Contraluz vermelho dos dois lados, por trás
  painel(1.6, 7, [-5.5, 1, -4.2], [16, 0.9, 0.8])
  painel(1.6, 7, [5.5, 1, -4.2], [16, 0.9, 0.8])
  // Teto: pequeno e quente, desenha o cabelo
  painel(2.4, 1.6, [0.4, 7, 1.2], [7, 5.2, 4.6])
  // Duas tiras finas na frente: dão o brilho comprido no rosto e no peito
  painel(1.1, 6, [-5.2, 1.2, 4.2], [3.4, 3, 2.75])
  painel(0.5, 5, [5.8, 0.4, 3.2], [3.4, 0.7, 0.6])
  // Chão levemente vermelho
  painel(7, 4, [0, -6, 1], [0.5, 0.02, 0.02])

  const pmrem = new THREE.PMREMGenerator(renderer)
  const alvo = pmrem.fromScene(estudio, 0.02)
  pmrem.dispose()
  estudio.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose()
      ;(o.material as THREE.Material).dispose()
    }
  })
  return alvo
}

function criarHalo() {
  const grupo = new THREE.Group()
  const neon = new THREE.MeshBasicMaterial({ color: 0xffffff, depthWrite: false, toneMapped: false })
  const fio = new THREE.MeshBasicMaterial({ color: 0xffffff, depthWrite: false, toneMapped: false })
  const anel = new THREE.Mesh(new THREE.TorusGeometry(RAIO_HALO, 0.042, 20, 220), neon)
  const braco = new THREE.CylinderGeometry(0.011, 0.011, RAIO_HALO * 2, 8, 1)
  const vertical = new THREE.Mesh(braco, fio)
  const horizontal = new THREE.Mesh(braco, fio)
  horizontal.rotation.z = Math.PI / 2
  grupo.add(anel, vertical, horizontal)

  const luzes: THREE.PointLight[] = []
  for (let i = 0; i < 2; i++) {
    const a = i * Math.PI + 0.35
    const l = new THREE.PointLight(VERMELHO, 0, 9, 2)
    l.position.set(Math.cos(a) * RAIO_HALO * 1.25, Math.sin(a) * RAIO_HALO * 1.25, -0.5)
    luzes.push(l)
    grupo.add(l)
  }

  const clarao = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 11),
    new THREE.ShaderMaterial({
      ...CLARAO,
      uniforms: { uCor: { value: new THREE.Color(0.62, 0.012, 0.016) }, uForca: { value: 0 } },
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    }),
  )
  return { grupo, neon, fio, luzes, clarao }
}

function criarPoeira(quantidade: number) {
  const pos = new Float32Array(quantidade * 3)
  const fase = new Float32Array(quantidade)
  const tam = new Float32Array(quantidade)
  for (let i = 0; i < quantidade; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 9
    pos[i * 3 + 1] = (Math.random() - 0.5) * 8
    pos[i * 3 + 2] = (Math.random() - 0.5) * 6
    fase[i] = Math.random()
    tam[i] = 0.012 + Math.random() ** 3 * 0.05
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aFase', new THREE.BufferAttribute(fase, 1))
  g.setAttribute('aTam', new THREE.BufferAttribute(tam, 1))
  const m = new THREE.ShaderMaterial({
    ...POEIRA,
    uniforms: {
      uTempo: { value: 0 },
      uPx: { value: 1 },
      uForca: { value: 0 },
      uCor: { value: new THREE.Color(1.1, 0.16, 0.12) },
    },
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  })
  const pontos = new THREE.Points(g, m)
  pontos.frustumCulled = false
  return { pontos, material: m }
}

export function criarCena(container: HTMLElement, { aoIniciar, aoFalhar }: Opcoes) {
  const canvas = document.createElement('canvas')
  canvas.className = 'cena__canvas'
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      stencil: false,
      powerPreference: 'high-performance',
    })
  } catch {
    aoFalhar()
    return () => {}
  }
  container.append(canvas)

  const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const toque = window.matchMedia('(pointer: coarse)').matches
  const dprMax = toque ? 1.5 : 1.75
  let dpr = Math.min(window.devicePixelRatio || 1, dprMax)

  renderer.setClearColor(0x000000, 1)
  renderer.toneMapping = THREE.NoToneMapping
  renderer.shadowMap.enabled = true
  renderer.shadowMap.autoUpdate = false

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000)
  const ambiente = criarAmbiente(renderer)
  scene.environment = ambiente.texture
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60)

  // ---------- luzes ----------
  const chave = new THREE.SpotLight('#ff4a3a', 0, 22, 0.42, 0.7, 1.4)
  chave.castShadow = true
  chave.shadow.mapSize.set(toque ? 512 : 1024, toque ? 512 : 1024)
  chave.shadow.camera.near = 1.5
  chave.shadow.camera.far = 14
  chave.shadow.bias = -0.0006
  chave.shadow.normalBias = 0.02
  chave.target.position.set(0, -0.4, 0)
  const preenche = new THREE.DirectionalLight('#f3d9cc', 0)
  preenche.position.set(-2.5, 0.6, 5)
  scene.add(chave, chave.target, preenche)

  // ---------- círculo com cruz ----------
  const halo = criarHalo()
  scene.add(halo.grupo, halo.clarao)

  // ---------- feixe ----------
  const alturaFeixe = 10
  const feixeMat = new THREE.ShaderMaterial({
    ...FEIXE,
    uniforms: {
      uTempo: { value: 0 },
      uForca: { value: 0 },
      uCor: { value: new THREE.Color(0.5, 0.018, 0.02) },
    },
    blending: THREE.AdditiveBlending,
    // Só a metade de trás do cone: a luz passa atrás do busto e não lava o preto.
    side: THREE.BackSide,
    depthWrite: false,
    transparent: true,
  })
  const feixe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 3, alturaFeixe, 72, 1, true),
    feixeMat,
  )
  feixe.position.set(-0.75, 1.6, -0.2)
  feixe.rotation.z = -0.17
  scene.add(feixe)

  // ---------- poeira ----------
  const poeira = criarPoeira(toque ? 220 : 520)
  scene.add(poeira.pontos)

  // ---------- busto ----------
  const busto = new THREE.Group()
  scene.add(busto)
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x070505,
    metalness: 0.45,
    roughness: 0.6,
    clearcoat: 0.5,
    clearcoatRoughness: 0.46,
    envMapIntensity: 0,
    normalScale: new THREE.Vector2(1.15, 1.15),
  })
  const cenaMascara = new THREE.Scene()
  cenaMascara.background = new THREE.Color(0x000000)
  const materialMascara = new THREE.MeshBasicMaterial({ color: 0xffffff })
  let copia: THREE.Mesh | null = null
  let malha: THREE.Mesh | null = null

  // ---------- pós-processamento ----------
  // Montagem própria (sem EffectComposer): a cena renderiza uma vez com antialias, o bloom roda
  // numa cópia pequena sem antialias e os dois se somam no shader final. Em placa integrada isso
  // dobra o fps em relação a compor o bloom no buffer com antialias.
  const cenaRT = new THREE.WebGLRenderTarget(4, 4, {
    type: THREE.HalfFloatType,
    samples: toque ? 2 : 4,
  })
  const pequenoRT = new THREE.WebGLRenderTarget(4, 4, {
    type: THREE.HalfFloatType,
    depthBuffer: false,
  })
  const mascaraRT = new THREE.WebGLRenderTarget(4, 4, { samples: 4 })
  const bloom = new UnrealBloomPass(new THREE.Vector2(4, 4), 0.42, 0.5, 0.6)
  // Todo brilho que vaza é vermelho, mesmo o do néon creme.
  bloom.bloomTintColors = [1, 0.9, 0.75, 0.55, 0.4].map((f) => new THREE.Vector3(f, 0.07 * f, 0.07 * f))

  const copiar = new FullScreenQuad(
    new THREE.ShaderMaterial({
      ...COPIA,
      uniforms: { tDiffuse: { value: cenaRT.texture } },
      depthTest: false,
      depthWrite: false,
    }),
  )
  const acabamentoMat = new THREE.ShaderMaterial({
    ...ACABAMENTO,
    uniforms: THREE.UniformsUtils.clone(ACABAMENTO.uniforms),
    depthTest: false,
    depthWrite: false,
  })
  const acabamento = new FullScreenQuad(acabamentoMat)
  const u = acabamentoMat.uniforms
  u.tDiffuse.value = cenaRT.texture
  u.tBloom.value = bloom.renderTargetsHorizontal[0].texture
  u.tMascara.value = mascaraRT.texture
  u.uFaixa.value = new THREE.Vector2(-1, -1)

  // ---------- tamanho ----------
  let largura = 1
  let altura = 1
  let retrato = false
  const dimensionar = () => {
    largura = Math.max(1, container.clientWidth)
    altura = Math.max(1, container.clientHeight)
    retrato = largura / altura < 0.85
    renderer.setPixelRatio(dpr)
    renderer.setSize(largura, altura, false)
    const pw = Math.max(2, Math.round(largura * dpr))
    const ph = Math.max(2, Math.round(altura * dpr))
    cenaRT.setSize(pw, ph)
    mascaraRT.setSize(pw, ph)
    pequenoRT.setSize(pw >> 1, ph >> 1)
    bloom.setSize(pw >> 1, ph >> 1)
    poeira.material.uniforms.uPx.value = altura * dpr
    u.uAltura.value = altura
    u.uAspecto.value = largura / altura
  }

  // ---------- rolagem: em que plano estamos ----------
  let marcos: Marco[] = []
  const medir = () => {
    const vh = window.innerHeight
    marcos = Array.from(document.querySelectorAll<HTMLElement>('[data-plano]'))
      .map((el) => {
        const nome = el.dataset.plano
        if (!ehPlano(nome)) return null
        const topo = el.getBoundingClientRect().top + window.scrollY
        const h = el.offsetHeight
        // Seções mais baixas que a tela valem quando estão no meio dela.
        const meio = topo + h / 2 - vh / 2
        return h > vh
          ? { nome, inicio: topo, fim: topo + h - vh }
          : { nome, inicio: meio, fim: meio }
      })
      .filter((m): m is Marco => m !== null)
      .sort((a, b) => a.inicio - b.inicio)
    const max = document.documentElement.scrollHeight - vh
    for (const m of marcos) {
      m.inicio = limitar(m.inicio, 0, max)
      m.fim = limitar(m.fim, 0, max)
    }
    sujo = true
  }

  const alvo: Plano = { ...PLANO_BASE }
  const atual: Plano = { ...plano('topo', false) }
  let sujo = true

  const calcularAlvo = () => {
    if (marcos.length === 0) return Object.assign(alvo, plano('topo', retrato))
    const y = window.scrollY
    let i = marcos.findIndex((m) => y <= m.fim)
    if (i < 0) i = marcos.length - 1
    const m = marcos[i]
    if (y >= m.inicio || i === 0) {
      Object.assign(alvo, plano(m.nome, retrato))
      // Dentro da seção a câmera continua andando um pouco.
      const trecho = m.fim - m.inicio
      if (trecho > 40) alvo.giro += (limitar((y - m.inicio) / trecho, 0, 1) - 0.5) * 0.22
      return alvo
    }
    const antes = marcos[i - 1]
    const de = plano(antes.nome, retrato)
    const para = plano(m.nome, retrato)
    if (antes.fim - antes.inicio > 40) de.giro += 0.11
    if (m.fim - m.inicio > 40) para.giro -= 0.11
    const t = suave(limitar((y - antes.fim) / Math.max(1, m.inicio - antes.fim), 0, 1))
    for (const k of CHAVES) alvo[k] = de[k] + (para[k] - de[k]) * t
    return alvo
  }

  // ---------- cursor ----------
  const cursor = { x: 0, y: 0, sx: 0, sy: 0 }
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    cursor.x = (e.clientX / window.innerWidth) * 2 - 1
    cursor.y = (e.clientY / window.innerHeight) * 2 - 1
  }

  // ---------- entrada ----------
  const intro = { luz: 0, halo: 0, feixe: 0, perto: 1 }
  const entrada = gsap.timeline({ paused: true })
  entrada
    .to(intro, { halo: 0.9, duration: 0.07, ease: 'none' }, 0.25)
    .to(intro, { halo: 0.08, duration: 0.09, ease: 'none' })
    .to(intro, { halo: 0.75, duration: 0.05, ease: 'none' })
    .to(intro, { halo: 0.2, duration: 0.16, ease: 'none' })
    .to(intro, { halo: 1, duration: 0.5, ease: 'power2.out' })
    .to(intro, { feixe: 1, duration: 2, ease: 'power2.out' }, 0.7)
    .to(intro, { luz: 1, duration: 1.6, ease: 'power2.out' }, 0.45)
    .to(intro, { perto: 0, duration: 3, ease: 'expo.out' }, 0.1)

  // ---------- quadro ----------
  const faixaEl = document.querySelector<HTMLElement>('[data-faixa]')
  const olhar = new THREE.Vector3()
  let tempo = 0
  let vivo = true
  let lentos = 0
  let quadro = 0
  let media = 16

  const faixaVisivel = () => {
    if (!faixaEl) return false
    const r = faixaEl.getBoundingClientRect()
    const base = altura - r.bottom
    const topo = altura - r.top
    u.uFaixa.value.set(base, topo)
    return topo > 0 && base < altura
  }

  const desenhar = () => {
    const a = atual
    const L = a.luz * intro.luz
    const H = a.haloL * intro.halo

    // câmera
    camera.fov = a.fov
    camera.aspect = largura / altura
    camera.position.set(
      a.camX + cursor.sx * 0.35,
      a.camY - cursor.sy * 0.18,
      a.camZ - intro.perto * 2.2,
    )
    olhar.set(a.alvoX, a.alvoY, a.alvoZ)
    camera.lookAt(olhar)
    camera.updateProjectionMatrix()
    // Desloca o enquadramento sem mudar a perspectiva.
    camera.projectionMatrix.elements[8] -= 2 * a.ox
    camera.projectionMatrix.elements[9] -= 2 * a.oy
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()

    // busto: balanço bem leve, como se respirasse
    busto.rotation.y = a.giro + (reduzir ? 0 : Math.sin(tempo * 0.35) * 0.025) + cursor.sx * 0.07
    busto.rotation.x = reduzir ? 0 : Math.sin(tempo * 0.28 + 1) * 0.008

    // luzes
    chave.position.set(a.chaveX + cursor.sx * 1.8, a.chaveY - cursor.sy * 0.8, a.chaveZ)
    chave.intensity = 22 * L * (0.35 + 0.65 * a.feixe * intro.feixe)
    preenche.intensity = 0.3 * L
    material.envMapIntensity = 1.05 * L
    scene.environmentRotation.y = cursor.sx * 0.25 + (reduzir ? 0 : Math.sin(tempo * 0.15) * 0.12)

    // círculo
    const pulso = reduzir ? 1 : 1 + Math.sin(tempo * 9.1) * 0.012 + Math.sin(tempo * 2.3) * 0.02
    const brilho = H * pulso
    halo.grupo.position.set(a.haloX, a.haloY, a.haloZ)
    halo.grupo.rotation.set(a.haloRX, a.haloRY, a.haloRZ)
    halo.grupo.scale.setScalar(a.haloE)
    // Fraco é vermelho; forte esquenta para o creme. Fica perto de 1 para o antialias não serrilhar.
    const quente = limitar((brilho - 0.5) / 0.5, 0, 1) ** 1.4
    halo.neon.color.setRGB(
      0.72 * brilho + 0.5 * quente,
      0.02 * brilho + 0.88 * quente,
      0.02 * brilho + 0.78 * quente,
    )
    halo.fio.color.setRGB(0.62 * brilho, 0.02 * brilho, 0.022 * brilho)
    const emPe = Math.cos(a.haloRX) ** 2 // deitado, as luzes do círculo estourariam o ombro
    for (const l of halo.luzes) l.intensity = 2.4 * brilho * emPe
    halo.clarao.position.set(a.haloX, a.haloY, a.haloZ - 0.25)
    halo.clarao.scale.setScalar(a.haloE)
    halo.clarao.quaternion.copy(camera.quaternion)
    ;(halo.clarao.material as THREE.ShaderMaterial).uniforms.uForca.value = 0.15 * brilho

    // feixe e poeira
    const F = a.feixe * intro.feixe
    feixeMat.uniforms.uForca.value = (retrato ? 0.5 : 0.9) * F
    feixeMat.uniforms.uTempo.value = tempo
    poeira.material.uniforms.uForca.value = (0.25 + 0.75 * F) * intro.luz
    poeira.material.uniforms.uTempo.value = tempo

    // janela do cardápio: só gasta a máscara quando ela está na tela
    if (faixaVisivel() && copia && malha) {
      busto.updateMatrixWorld(true)
      copia.matrix.copy(malha.matrixWorld)
      copia.matrixWorld.copy(malha.matrixWorld)
      renderer.setRenderTarget(mascaraRT)
      renderer.render(cenaMascara, camera)
    }
    // A sombra muda devagar: basta recalcular em quadros alternados.
    if (quadro++ % 2 === 0) renderer.shadowMap.needsUpdate = true
    u.uTempo.value = tempo
    u.uRecuo.value = a.recuo
    renderer.setRenderTarget(cenaRT)
    renderer.render(scene, camera)
    renderer.setRenderTarget(pequenoRT)
    copiar.render(renderer)
    bloom.render(renderer, pequenoRT, pequenoRT, 0, false)
    renderer.setRenderTarget(null)
    acabamento.render(renderer)
  }

  const tick = (_t: number, dtMs: number) => {
    if (!vivo || document.hidden) return
    const dt = Math.min(dtMs, 60) / 1000
    calcularAlvo()

    if (reduzir) {
      // Sem movimento: a câmera troca de plano junto com a rolagem, e só.
      let mudou = sujo
      for (const k of CHAVES) {
        if (Math.abs(atual[k] - alvo[k]) > 1e-4) mudou = true
        atual[k] = alvo[k]
      }
      if (!mudou) return
      sujo = false
      desenhar()
      return
    }

    tempo += dt
    const k1 = 1 - Math.exp(-dt * 4.2)
    for (const k of CHAVES) atual[k] += (alvo[k] - atual[k]) * k1
    const k2 = 1 - Math.exp(-dt * 3)
    cursor.sx += (cursor.x - cursor.sx) * k2
    cursor.sy += (cursor.y - cursor.sy) * k2
    desenhar()

    // Se a placa não dá conta, baixa a resolução aos poucos.
    if (tempo < 4) return
    media += (dtMs - media) * 0.05
    if (media > 26 && dpr > 0.85) {
      if (++lentos > 45) {
        dpr = Math.max(0.85, dpr * 0.82)
        lentos = 0
        media = 16
        dimensionar()
      }
    } else lentos = 0
  }

  const ro = new ResizeObserver(() => {
    dimensionar()
    medir()
  })
  const roPagina = new ResizeObserver(medir)
  const onRolar = () => {
    sujo = true
  }

  const carregador = new GLTFLoader()
  carregador.load(
    MODELO,
    (gltf) => {
      if (!vivo) return
      gltf.scene.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return
        const original = o.material as THREE.MeshStandardMaterial
        material.normalMap = original.normalMap
        material.roughnessMap = original.roughnessMap
        material.aoMap = original.aoMap
        const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy())
        for (const t of [material.normalMap, material.roughnessMap]) if (t) t.anisotropy = aniso
        material.side = THREE.FrontSide
        original.dispose()
        o.material = material
        o.castShadow = true
        o.receiveShadow = true
        malha = o
      })
      gltf.scene.scale.setScalar(ESCALA)
      gltf.scene.position.y = -CABECA_Y * ESCALA
      busto.add(gltf.scene)
      if (malha) {
        copia = new THREE.Mesh((malha as THREE.Mesh).geometry, materialMascara)
        copia.matrixAutoUpdate = false
        copia.matrixWorldAutoUpdate = false
        copia.frustumCulled = false
        cenaMascara.add(copia)
      }
      dimensionar()
      medir()
      Object.assign(atual, calcularAlvo())
      // Compila tudo antes de mostrar, para a entrada não engasgar.
      void renderer
        .compileAsync(scene, camera)
        .catch(() => {})
        .then(() => {
          if (!vivo) return
          if (reduzir) Object.assign(intro, { luz: 1, halo: 1, feixe: 1, perto: 0 })
          else entrada.play()
          gsap.ticker.add(tick)
          aoIniciar()
          ScrollTrigger.refresh()
        })
    },
    undefined,
    () => {
      if (vivo) aoFalhar()
    },
  )

  ro.observe(container)
  roPagina.observe(document.body)
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('scroll', onRolar, { passive: true })

  return () => {
    vivo = false
    gsap.ticker.remove(tick)
    entrada.kill()
    ro.disconnect()
    roPagina.disconnect()
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('scroll', onRolar)
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Points) {
        o.geometry.dispose()
        const mats = Array.isArray(o.material) ? o.material : [o.material]
        for (const m of mats) m.dispose()
      }
    })
    for (const t of [material.normalMap, material.roughnessMap, material.aoMap]) t?.dispose()
    materialMascara.dispose()
    chave.dispose()
    ambiente.dispose()
    cenaRT.dispose()
    pequenoRT.dispose()
    mascaraRT.dispose()
    bloom.dispose()
    ;(copiar.material as THREE.Material).dispose()
    copiar.dispose()
    acabamentoMat.dispose()
    acabamento.dispose()
    renderer.dispose()
    canvas.remove()
  }
}
