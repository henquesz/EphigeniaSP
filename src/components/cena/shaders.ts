// Shaders da cena: feixe de luz, poeira, clarão atrás do círculo e acabamento final.

export const FEIXE = {
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormalV;
    varying vec3 vPosV;
    void main() {
      vUv = uv;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vPosV = mv.xyz;
      vNormalV = normalMatrix * normal;
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float uTempo;
    uniform float uForca;
    uniform vec3 uCor;
    varying vec2 vUv;
    varying vec3 vNormalV;
    varying vec3 vPosV;

    void main() {
      // As bordas do cone somem de lado; sem isso a malha apareceria.
      float borda = pow(abs(dot(normalize(vNormalV), normalize(-vPosV))), 2.6);
      // Com MSAA a coordenada pode sair um pouco de 0..1, e pow() de negativo vira NaN.
      float y = clamp(vUv.y, 0.0, 1.0);
      float queda = smoothstep(0.0, 0.55, y) * pow(y, 1.1);
      float a = vUv.x * 6.28318;
      // Listras do feixe, como luz passando por uma persiana.
      float listras = 0.62
        + 0.22 * sin(a * 7.0 + uTempo * 0.22)
        + 0.16 * sin(a * 17.0 - uTempo * 0.35)
        + 0.10 * sin(a * 31.0 + uTempo * 0.5);
      gl_FragColor = vec4(uCor * borda * queda * max(listras, 0.0) * uForca, 1.0);
    }
  `,
}

export const POEIRA = {
  vertexShader: /* glsl */ `
    uniform float uTempo;
    uniform float uPx;
    attribute float aFase;
    attribute float aTam;
    varying float vLuz;

    void main() {
      vec3 p = position;
      float t = uTempo * (0.05 + aFase * 0.05);
      p.x += sin(t * 2.1 + aFase * 40.0) * 0.5;
      p.y = mod(p.y - t * 0.9 + 4.0, 8.0) - 4.0;
      p.z += cos(t * 1.7 + aFase * 23.0) * 0.4;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      // Mais visível perto do eixo do feixe.
      float eixo = exp(-dot(p.xz, p.xz) * 0.22);
      float pisca = 0.6 + 0.4 * sin(uTempo * (0.7 + aFase) + aFase * 60.0);
      vLuz = (0.12 + eixo) * pisca;
      gl_PointSize = aTam * uPx / -mv.z;
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uCor;
    uniform float uForca;
    varying float vLuz;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(uCor * a * a * vLuz * uForca, 1.0);
    }
  `,
}

export const CLARAO = {
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uCor;
    uniform float uForca;
    varying vec2 vUv;
    void main() {
      float d = length(vUv - 0.5) * 2.0;
      float g = pow(max(1.0 - d, 0.0), 2.4);
      gl_FragColor = vec4(uCor * g * uForca, 1.0);
    }
  `,
}

/** Cópia simples para o buffer pequeno do bloom. */
export const COPIA = {
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main() {
      // O teto segura pontos isolados muito fortes, que piscariam no bloom.
      gl_FragColor = vec4(clamp(texture2D(tDiffuse, vUv).rgb, 0.0, 6.0), 1.0);
    }
  `,
}

/*
 * Acabamento: curva de luz que preserva as cores da marca (abaixo de 0.65 nada muda; o que
 * estoura esquenta para o creme, como néon), vinheta, granulado e a faixa vermelha do cardápio.
 */
export const ACABAMENTO = {
  uniforms: {
    tDiffuse: { value: null },
    tBloom: { value: null },
    tMascara: { value: null },
    uFaixa: { value: [-1, -1] }, // [base, topo] da faixa vermelha, em px a partir de baixo
    uAltura: { value: 1 },
    uAspecto: { value: 1 },
    uTempo: { value: 0 },
    uRecuo: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D tBloom;
    uniform sampler2D tMascara;
    uniform vec2 uFaixa;
    uniform float uAltura;
    uniform float uAspecto;
    uniform float uTempo;
    uniform float uRecuo;
    varying vec2 vUv;

    // #d4161c em luz linear
    const vec3 VERMELHO = vec3(0.6584, 0.0080, 0.0116);
    const vec3 PRETO = vec3(0.0030, 0.0027, 0.0027);

    float hash(vec2 p) {
      vec3 q = fract(vec3(p.xyx) * 0.1031);
      q += dot(q, q.yzx + 33.33);
      return fract((q.x + q.y) * q.z);
    }

    vec3 curva(vec3 c) {
      float m = max(c.r, max(c.g, c.b));
      if (m <= 0.65) return c;
      float n = 0.65 + 0.35 * (1.0 - exp(-(m - 0.65) / 0.7));
      vec3 h = c * (n / m);
      return mix(h, vec3(1.0, 0.93, 0.86) * n, smoothstep(1.3, 7.0, m) * 0.92);
    }

    vec3 srgb(vec3 c) {
      c = clamp(c, 0.0, 1.0);
      return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
    }

    void main() {
      vec3 base = max(texture2D(tDiffuse, vUv).rgb, 0.0);
      vec3 cena = base + max(texture2D(tBloom, vUv).rgb, 0.0);
      float lum = dot(base, vec3(0.2126, 0.7152, 0.0722));

      vec2 q = (vUv - 0.5) * vec2(uAspecto, 1.0) / max(uAspecto, 1.0);
      float vinheta = 1.0 - 0.55 * smoothstep(0.22, 0.72, length(q));
      vec3 c = PRETO + cena * vinheta * (1.0 - 0.62 * uRecuo);

      // Janela do cardápio: fundo vermelho chapado, busto em silhueta, círculo em preto.
      float y = vUv.y * uAltura;
      if (y > uFaixa.x && y < uFaixa.y) {
        float busto = texture2D(tMascara, vUv).r;
        float circulo = smoothstep(0.3, 0.7, lum);
        vec3 fundo = mix(VERMELHO, PRETO, circulo);
        c = mix(fundo, PRETO + cena * 0.55, busto);
      }

      vec3 cor = srgb(curva(c));
      float grao = hash(gl_FragCoord.xy + floor(uTempo * 24.0) * 17.0) - 0.5;
      cor += grao * 0.028;
      gl_FragColor = vec4(cor, 1.0);
    }
  `,
}
