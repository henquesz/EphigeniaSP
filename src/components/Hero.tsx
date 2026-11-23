'use client'

import { useRef } from 'react'
import { gsap, useGSAP, COM_MOVIMENTO } from '@/lib/gsap'
import { SITE } from '@/lib/site'
import Letras from './Letras'
import GradientASCII from './reactbits/GradientASCII'
import HalftoneBust from './reactbits/HalftoneBust'
import LightRays from './reactbits/LightRays'

type Props = {
  proximo: { data: string; titulo: string } | null
}

const ASCII = ['#7a0d10', '#c3141b', '#ef2b31', '#ff6b4f', '#ffd0bd']

export default function Hero({ proximo }: Props) {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(COM_MOVIMENTO, () => {
        const q = gsap.utils.selector(root)

        // Entrada: letras saem do desfoque, depois os cantos e o rodapé.
        gsap
          .timeline({ delay: 0.25 })
          .fromTo(
            q('.hero__titulo [data-ch]'),
            { opacity: 0, y: 0, yPercent: 55, filter: 'blur(12px)' },
            {
              opacity: 1,
              yPercent: 0,
              filter: 'blur(0px)',
              duration: 1.5,
              ease: 'expo.out',
              stagger: 0.055,
            },
            0.35,
          )
          .fromTo(
            q('[data-intro]'),
            { opacity: 0, y: 14 },
            {
              opacity: 1,
              y: 0,
              duration: 1,
              ease: 'power3.out',
              stagger: 0.12,
            },
            0.9,
          )

        // Rolagem: nomes se afastam, busto desce e cresce, fundo apaga.
        const rolagem = {
          trigger: root.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        }
        gsap.to(q('.hero__nome--esq'), {
          xPercent: -22,
          opacity: 0,
          ease: 'none',
          scrollTrigger: rolagem,
        })
        gsap.to(q('.hero__dir'), {
          xPercent: 22,
          opacity: 0,
          ease: 'none',
          scrollTrigger: rolagem,
        })
        gsap.to(q('.hero__busto'), {
          yPercent: 12,
          scale: 1.08,
          ease: 'none',
          scrollTrigger: rolagem,
        })
        gsap.to(q('.hero__bg'), {
          opacity: 0.2,
          ease: 'none',
          scrollTrigger: rolagem,
        })
        gsap.to(q('.hero__cantos'), {
          opacity: 0,
          y: -24,
          ease: 'none',
          scrollTrigger: { ...rolagem, end: '35% top' },
        })
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section
      id="topo"
      ref={root}
      className="hero"
      aria-labelledby="hero-titulo"
    >
      <div className="hero__bg" aria-hidden="true">
        <GradientASCII
          className="hero__ascii"
          shape="rise"
          colors={ASCII}
          characters=" .:-=+*x#%@"
          cellSize={13}
          density={0.9}
          glyphOpacity={0.85}
          glow={0.5}
          flicker={0.35}
          softness={0.2}
          scale={1.6}
          flow={0.7}
          speed={0.7}
          gradientOpacity={0.6}
          grain={0.05}
          scrambleRadius={0.07}
          clickEffect="wave"
          dpr={1.5}
        />
        <span className="hero__coluna" />
        <LightRays
          className="hero__raios"
          raysOrigin="top-center"
          raysColor="#ff2e2e"
          tilt={-12}
          lightSpread={0.3}
          rayLength={1.25}
          rayDensity={1.4}
          raySharpness={0.55}
          glow={0.6}
          haze={0.5}
          atmosphere={0}
          saturation={1}
          intensity={1.15}
          mouseInfluence={0.08}
          cursorShadow={false}
          noiseAmount={0.1}
          opacity={0.8}
          maxDevicePixelRatio={1.25}
        />
      </div>

      <HalftoneBust className="hero__busto" />

      <div className="hero__cantos">
        <p className="canto" data-intro>
          {proximo ? (
            <a href="#agenda" className="canto__link">
              <span className="canto__forte">{proximo.data}</span>
              <span className="canto__fraco">
                Próxima noite · {proximo.titulo}
              </span>
            </a>
          ) : (
            <span className="canto__forte">Agenda nova em breve</span>
          )}
        </p>
        <p className="canto canto--dir" data-intro>
          <span className="canto__forte">{SITE.endereco.rua}</span>
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
    </section>
  )
}
