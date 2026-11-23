'use client'

/*
 * Adaptado de "HalftoneReveal", do React Bits (https://reactbits.dev).
 * Copyright (c) 2026 David Haz. MIT + Commons Clause License Condition v1.0.
 * Licença completa em ./LICENSE.md.
 * Mudanças: tinta vermelha sobre fundo transparente com creme nos brilhos, imagem
 * alinhada embaixo, e movimento contínuo em passos de 12 fps (onda, respiração,
 * balanço com profundidade pelo brilho e pontos "fervendo") para o busto se mexer
 * como um GIF. O pincel do cursor revela a foto.
 */

import { useEffect, useRef } from 'react'
import DitherStatue from '../DitherStatue'

type Props = {
  src?: string
  /** Distância entre pontos, em px. */
  cellSize?: number
  /** Ângulo da grade, em graus. */
  angle?: number
  ink?: string
  highlight?: string
  /** Cor da foto revelada pelo cursor. */
  reveal?: string
  contrast?: number
  brightness?: number
  /** Curva dos tons: acima de 1, meios-tons viram pontos menores. */
  gamma?: number
  revealRadius?: number
  softness?: number
  linger?: number
  /** Liga o movimento de GIF. */
  motion?: boolean
  label?: string
  className?: string
}

type MaskTarget = {
  texture: WebGLTexture | null
  framebuffer: WebGLFramebuffer | null
  width: number
  height: number
}

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`

const MASK = `#version 300 es
precision highp float;
uniform sampler2D uPrevious;
uniform vec2 uTexture;
uniform vec2 uView;
uniform vec2 uFrom;
uniform vec2 uTo;
uniform float uRadius;
uniform float uSoftness;
uniform float uStrength;
uniform float uFade;
out vec4 outColor;

float segment(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  float h = clamp(dot(p - a, ab) / max(dot(ab, ab), 0.0001), 0.0, 1.0);
  return length(p - a - ab * h);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uTexture;
  vec2 p = vec2(uv.x, 1.0 - uv.y) * uView;
  float trail = max(texture(uPrevious, uv).r - uFade, 0.0);
  float band = max(uRadius * uSoftness, 1.0);
  float brush = clamp((uRadius - segment(p, uFrom, uTo)) / band, 0.0, 1.0);
  brush = brush * brush * (3.0 - 2.0 * brush);
  outColor = vec4(max(trail, brush * uStrength), 0.0, 0.0, 1.0);
}`

const VIEW = `#version 300 es
precision highp float;
uniform sampler2D uImage;
uniform sampler2D uMask;
uniform vec2 uResolution;
uniform vec2 uView;
uniform float uDpr;
uniform vec4 uFrame;
uniform float uTexels;
uniform float uCell;
uniform float uAngle;
uniform vec3 uInk;
uniform vec3 uHigh;
uniform vec3 uReal;
uniform float uContrast;
uniform float uBrightness;
uniform float uGamma;
uniform float uIntro;
uniform float uTime;
uniform float uMotion;
uniform vec4 uBursts[4];
uniform float uBurstWidth;
out vec4 outColor;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

mat2 rotate(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec4 photo(vec2 p, float lod) {
  vec2 uv = (p - uFrame.xy) / uFrame.zw;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);
  return textureLod(uImage, uv, lod);
}

// Deslocamento do "GIF": onda, respiração e balanço com profundidade.
vec2 warp(vec2 p, float lod) {
  if (uMotion < 0.5) return p;
  float t = uTime;
  vec2 q = p;
  q.x += sin(p.y * 0.021 + t * 2.3) * 2.2;
  q.y += sin(t * 1.1) * 3.0;
  float depth = dot(photo(q, lod + 1.5).rgb, LUMA);
  q.x += (depth - 0.45) * sin(t * 0.8) * 9.0;
  return q;
}

vec2 cellCenter(vec2 p) {
  vec2 q = rotate(uAngle) * p / uCell;
  return rotate(-uAngle) * (floor(q) + 0.5) * uCell;
}

vec2 cellId(vec2 p) {
  return floor(rotate(uAngle) * p / uCell);
}

float reach(float t) {
  t = clamp(t, 0.0, 1.0);
  return t < 0.785 ? sqrt(t / 3.14159) : mix(0.5, 0.72, (t - 0.785) / 0.215);
}

float dotMask(vec2 p, float r) {
  vec2 q = rotate(uAngle) * p / uCell;
  float d = length(fract(q) - 0.5);
  float w = max(fwidth(d), 0.0001) * 0.75;
  return smoothstep(r + w, r - w, d) * clamp(r / (w * 2.0), 0.0, 1.0);
}

float grade(float v) {
  return clamp((v - 0.5) * uContrast + 0.5 + uBrightness, 0.0, 1.0);
}

float burst(vec2 p) {
  float value = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 b = uBursts[i];
    if (b.w <= 0.0) continue;
    float offset = distance(p, b.xy) - b.z;
    float edge = offset > 0.0 ? offset / (uBurstWidth * 0.35) : -offset / uBurstWidth;
    value = max(value, clamp(1.0 - edge, 0.0, 1.0) * b.w);
  }
  return value;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  float lod = log2(max(uCell * uTexels, 1.0));
  vec2 c = cellCenter(p);
  vec2 id = cellId(p);

  vec4 img = photo(warp(c, lod), lod);
  float lum = grade(dot(img.rgb, LUMA));
  float t = pow(lum, uGamma) * img.a;
  t += uMotion * (hash(id + floor(uTime * 12.0) * 0.137) - 0.5) * 0.07 * img.a;
  t = clamp(t, 0.0, 1.0);

  vec2 field = p / max(uView.x, uView.y) - uView / max(uView.x, uView.y) * 0.5;
  float delay = length(field) * 1.15 + hash(id) * 0.06;
  float grow = smoothstep(0.0, 1.0, clamp((uIntro * 1.7 - delay) / 0.45, 0.0, 1.0));

  float k = dotMask(p, reach(t) * grow);
  float hot = smoothstep(0.8, 0.93, lum);
  vec4 print = vec4(mix(uInk, uHigh, hot) * k, k);

  vec2 maskUv = vec2(p.x / uView.x, 1.0 - p.y / uView.y);
  float shown = max(texture(uMask, maskUv).r, burst(p));
  shown = shown * shown * (3.0 - 2.0 * shown);
  float kr = dotMask(p, 0.78 * shown);
  vec4 sharp = photo(warp(p, 0.0), 0.0);
  vec4 real = vec4(sharp.rgb * uReal * sharp.a, sharp.a);
  outColor = mix(print, real, kr);
}`

const MAX_BURSTS = 4
const BURST_SECONDS = 1.3
const INTRO_SECONDS = 2.2
const MASK_SCALE = 0.5
const GIF_FPS = 12

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v))

function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.replace(/./g, (d) => d + d) : h
  return [0, 2, 4].map(
    (i) => Number.parseInt(full.slice(i, i + 2), 16) / 255,
  ) as [number, number, number]
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader
  gl.deleteShader(shader)
  return null
}

function link(gl: WebGL2RenderingContext, fragment: string) {
  const v = compile(gl, gl.VERTEX_SHADER, VERTEX)
  const f = compile(gl, gl.FRAGMENT_SHADER, fragment)
  const program = gl.createProgram()
  if (!v || !f || !program) return null
  gl.attachShader(program, v)
  gl.attachShader(program, f)
  gl.bindAttribLocation(program, 0, 'aPosition')
  gl.linkProgram(program)
  gl.deleteShader(v)
  gl.deleteShader(f)
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program
  gl.deleteProgram(program)
  return null
}

function locate(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  names: string[],
) {
  const out: Record<string, WebGLUniformLocation | null> = {}
  for (const n of names) out[n] = gl.getUniformLocation(program, n)
  return out
}

export default function HalftoneBust({
  src = '/estatua.png',
  cellSize = 7,
  angle = 45,
  ink = '#d4161c',
  highlight = '#ece5da',
  reveal = '#f3ece2',
  contrast = 1.3,
  brightness = -0.04,
  gamma = 1.8,
  revealRadius = 150,
  softness = 0.6,
  linger = 1.1,
  motion = true,
  label = 'Busto clássico de mármore impresso em pontos vermelhos',
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const settings = {
    cellSize: clamp(cellSize, 3, 40),
    angle,
    ink: rgb(ink),
    highlight: rgb(highlight),
    reveal: rgb(reveal),
    contrast,
    brightness,
    gamma: clamp(gamma, 0.3, 4),
    revealRadius,
    softness: clamp(softness, 0, 1),
    linger: Math.max(0, linger),
    motion,
  }
  const settingsRef = useRef(settings)

  useEffect(() => {
    settingsRef.current = settings
  })

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
    })
    const maskProgram = gl ? link(gl, MASK) : null
    const viewProgram = gl ? link(gl, VIEW) : null
    if (!gl || !maskProgram || !viewProgram) {
      container.dataset.fallback = 'true'
      return
    }

    const mu = locate(gl, maskProgram, [
      'uPrevious',
      'uTexture',
      'uView',
      'uFrom',
      'uTo',
      'uRadius',
      'uSoftness',
      'uStrength',
      'uFade',
    ])
    const vu = locate(gl, viewProgram, [
      'uImage',
      'uMask',
      'uResolution',
      'uView',
      'uDpr',
      'uFrame',
      'uTexels',
      'uCell',
      'uAngle',
      'uInk',
      'uHigh',
      'uReal',
      'uContrast',
      'uBrightness',
      'uGamma',
      'uIntro',
      'uTime',
      'uMotion',
      'uBursts',
      'uBurstWidth',
    ])

    const vao = gl.createVertexArray()
    const buffer = gl.createBuffer()
    gl.bindVertexArray(vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    )
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.bindVertexArray(null)

    const floatMask = !!gl.getExtension('EXT_color_buffer_float')
    const imageTexture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, imageTexture)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array(4),
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    const createMask = (width: number, height: number): MaskTarget => {
      const texture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, texture)
      if (floatMask)
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA16F,
          width,
          height,
          0,
          gl.RGBA,
          gl.HALF_FLOAT,
          null,
        )
      else
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          width,
          height,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          null,
        )
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      const framebuffer = gl.createFramebuffer()
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture,
        0,
      )
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      return { texture, framebuffer, width, height }
    }
    const destroyMask = (t: MaskTarget) => {
      gl.deleteFramebuffer(t.framebuffer)
      gl.deleteTexture(t.texture)
    }
    let masks = [createMask(2, 2), createMask(2, 2)]

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const bursts: { x: number; y: number; start: number }[] = []
    const burstData = new Float32Array(MAX_BURSTS * 4)
    const pointer = { x: 0, y: 0, inside: false, fresh: true }
    const brush = { x: 0, y: 0, px: 0, py: 0 }
    const state = {
      width: 1,
      height: 1,
      image: null as HTMLImageElement | null,
      introStart: 0,
      presence: 0,
      trailUntil: 0,
      clock: 0,
      lastDraw: 0,
      /** Tamanho da célula vindo do CSS (--busto-celula); 0 = usa a prop cellSize. */
      cell: 0,
    }
    let raf = 0
    let last = 0
    let visible = true
    let alive = true
    let resizePending = true

    const frameRect = () => {
      const { image, width, height } = state
      if (!image) return [0, 0, width, height]
      const scale = Math.min(
        width / image.naturalWidth,
        height / image.naturalHeight,
      )
      const w = image.naturalWidth * scale
      const h = image.naturalHeight * scale
      return [(width - w) / 2, height - h, w, h]
    }

    const applyResize = () => {
      const width = Math.max(1, container.clientWidth)
      const height = Math.max(1, container.clientHeight)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      state.width = width
      state.height = height
      // Permite trocar a célula por media query: .hero__busto { --busto-celula: 5 }
      const celulaCss = Number.parseFloat(
        getComputedStyle(container).getPropertyValue('--busto-celula'),
      )
      state.cell = Number.isFinite(celulaCss) && celulaCss > 0 ? clamp(celulaCss, 3, 40) : 0
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      const mw = Math.max(2, Math.round(width * MASK_SCALE))
      const mh = Math.max(2, Math.round(height * MASK_SCALE))
      if (mw !== masks[0].width || mh !== masks[0].height) {
        masks.forEach(destroyMask)
        masks = [createMask(mw, mh), createMask(mw, mh)]
      }
    }

    const drawMask = (dt: number) => {
      const s = settingsRef.current
      gl.bindFramebuffer(gl.FRAMEBUFFER, masks[1].framebuffer)
      gl.viewport(0, 0, masks[1].width, masks[1].height)
      gl.useProgram(maskProgram)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, masks[0].texture)
      gl.uniform1i(mu.uPrevious, 0)
      gl.uniform2f(mu.uTexture, masks[1].width, masks[1].height)
      gl.uniform2f(mu.uView, state.width, state.height)
      gl.uniform2f(mu.uFrom, brush.px, brush.py)
      gl.uniform2f(mu.uTo, brush.x, brush.y)
      gl.uniform1f(mu.uRadius, s.revealRadius * (0.45 + 0.55 * state.presence))
      gl.uniform1f(mu.uSoftness, s.softness)
      gl.uniform1f(mu.uStrength, state.presence)
      gl.uniform1f(
        mu.uFade,
        Math.max(s.linger > 0 ? dt / s.linger : 1, floatMask ? 0 : 1.5 / 255),
      )
      gl.bindVertexArray(vao)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      masks.reverse()
    }

    const animated = () => settingsRef.current.motion && !reduce

    const drawView = (now: number) => {
      const s = settingsRef.current
      const [fx, fy, fw, fh] = frameRect()
      const image = state.image
      const intro = !image
        ? 0
        : reduce
          ? 1
          : Math.min(1, (now - state.introStart) / 1000 / INTRO_SECONDS)
      const moving = animated()
      const time = moving ? Math.floor(state.clock * GIF_FPS) / GIF_FPS : 0

      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(viewProgram)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, imageTexture)
      gl.uniform1i(vu.uImage, 0)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, masks[0].texture)
      gl.uniform1i(vu.uMask, 1)
      gl.uniform2f(vu.uResolution, canvas.width, canvas.height)
      gl.uniform2f(vu.uView, state.width, state.height)
      gl.uniform1f(vu.uDpr, canvas.width / state.width)
      gl.uniform4f(vu.uFrame, fx, fy, fw, fh)
      gl.uniform1f(vu.uTexels, image ? image.naturalWidth / fw : 1)
      gl.uniform1f(vu.uCell, state.cell || s.cellSize)
      gl.uniform1f(vu.uAngle, (s.angle * Math.PI) / 180)
      gl.uniform3fv(vu.uInk, s.ink)
      gl.uniform3fv(vu.uHigh, s.highlight)
      gl.uniform3fv(vu.uReal, s.reveal)
      gl.uniform1f(vu.uContrast, s.contrast)
      gl.uniform1f(vu.uBrightness, s.brightness)
      gl.uniform1f(vu.uGamma, s.gamma)
      gl.uniform1f(vu.uIntro, 1 - (1 - intro) * (1 - intro))
      gl.uniform1f(vu.uTime, time)
      gl.uniform1f(vu.uMotion, moving ? 1 : 0)
      gl.uniform4fv(vu.uBursts, burstData)
      gl.uniform1f(vu.uBurstWidth, Math.max(60, s.revealRadius * 0.9))
      gl.bindVertexArray(vao)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      gl.bindVertexArray(null)
      return intro
    }

    const frame = (now: number) => {
      raf = 0
      if (resizePending) {
        resizePending = false
        applyResize()
      }
      if (!alive || !visible || document.hidden) return
      const dt = last
        ? Math.min(0.05, Math.max(0, (now - last) / 1000))
        : 1 / 60
      last = now
      state.clock += dt

      state.presence +=
        ((pointer.inside ? 1 : 0) - state.presence) * (1 - Math.exp(-dt / 0.16))
      if (pointer.fresh) {
        brush.x = brush.px = pointer.x
        brush.y = brush.py = pointer.y
        pointer.fresh = false
      } else {
        const follow = 1 - Math.exp(-dt / 0.035)
        brush.x += (pointer.x - brush.x) * follow
        brush.y += (pointer.y - brush.y) * follow
      }

      burstData.fill(0)
      for (let i = bursts.length - 1; i >= 0; i--) {
        if ((now - bursts[i].start) / 1000 >= BURST_SECONDS) bursts.splice(i, 1)
      }
      bursts.forEach((b, i) => {
        const k = Math.max(0, (now - b.start) / 1000 / BURST_SECONDS)
        const r =
          Math.hypot(
            Math.max(b.x, state.width - b.x),
            Math.max(b.y, state.height - b.y),
          ) + 80
        burstData[i * 4] = b.x
        burstData[i * 4 + 1] = b.y
        burstData[i * 4 + 2] = r * Math.sin((k * Math.PI) / 2)
        burstData[i * 4 + 3] = 1 - k * k * k
      })

      const s = settingsRef.current
      if (state.presence > 0.002) state.trailUntil = now + s.linger * 1000 + 200
      const interacting =
        state.presence > 0.002 || bursts.length > 0 || now < state.trailUntil
      const introDone =
        !state.image || now - state.introStart > INTRO_SECONDS * 1000

      // Parado, o "GIF" roda a 12 fps; com o cursor em cima, a cada frame.
      if (
        interacting ||
        !introDone ||
        now - state.lastDraw >= 1000 / GIF_FPS - 1
      ) {
        drawMask(dt)
        brush.px = brush.x
        brush.py = brush.y
        drawView(now)
        state.lastDraw = now
      }

      const busy = interacting || !introDone || animated()
      if (busy) raf = requestAnimationFrame(frame)
      else last = 0
    }

    const wake = () => {
      if (!raf && alive && visible && !document.hidden)
        raf = requestAnimationFrame(frame)
    }

    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.decoding = 'async'
    image.onload = () => {
      if (!alive) return
      gl.bindTexture(gl.TEXTURE_2D, imageTexture)
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR,
      )
      state.image = image
      state.introStart = performance.now()
      container.dataset.ready = 'true'
      wake()
    }
    image.src = src

    const place = (e: PointerEvent) => {
      const r = container.getBoundingClientRect()
      pointer.x = e.clientX - r.left
      pointer.y = e.clientY - r.top
    }
    const onMove = (e: PointerEvent) => {
      place(e)
      if (!pointer.inside) {
        pointer.inside = true
        pointer.fresh = true
      }
      wake()
    }
    const onLeave = () => {
      pointer.inside = false
      wake()
    }
    const onDown = (e: PointerEvent) => {
      onMove(e)
      if (e.pointerType === 'mouse' && e.button !== 0) return
      bursts.push({ x: pointer.x, y: pointer.y, start: performance.now() })
      if (bursts.length > MAX_BURSTS) bursts.shift()
    }
    const onVisibility = () => {
      last = 0
      wake()
    }

    container.addEventListener('pointermove', onMove, { passive: true })
    container.addEventListener('pointerenter', onMove, { passive: true })
    container.addEventListener('pointerdown', onDown, { passive: true })
    container.addEventListener('pointerleave', onLeave, { passive: true })
    container.addEventListener('pointercancel', onLeave, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    const ro = new ResizeObserver(() => {
      resizePending = true
      if (!raf && alive && visible) {
        applyResize()
        resizePending = false
        if (state.image) drawView(performance.now())
      }
      wake()
    })
    ro.observe(container)
    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting)
      if (visible) {
        last = 0
        wake()
      }
    })
    io.observe(container)

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      image.onload = null
      ro.disconnect()
      io.disconnect()
      container.removeEventListener('pointermove', onMove)
      container.removeEventListener('pointerenter', onMove)
      container.removeEventListener('pointerdown', onDown)
      container.removeEventListener('pointerleave', onLeave)
      container.removeEventListener('pointercancel', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      masks.forEach(destroyMask)
      gl.deleteTexture(imageTexture)
      gl.deleteBuffer(buffer)
      gl.deleteVertexArray(vao)
      gl.deleteProgram(maskProgram)
      gl.deleteProgram(viewProgram)
    }
  }, [src])

  return (
    <div
      ref={containerRef}
      className={['halftone-bust', className].filter(Boolean).join(' ')}
      role="img"
      aria-label={label}
    >
      <canvas
        ref={canvasRef}
        className="halftone-bust__canvas"
        aria-hidden="true"
      />
      <DitherStatue
        className="halftone-bust__fallback"
        src={src}
        label={label}
      />
    </div>
  )
}
