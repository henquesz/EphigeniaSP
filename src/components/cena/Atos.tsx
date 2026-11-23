'use client'

import { gsap, useGSAP, COM_MOVIMENTO } from '@/lib/gsap'

/** Entrada do título e saída do texto de cada ato (some enquanto a câmera vai para o próximo). */
export default function Atos() {
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(COM_MOVIMENTO, () => {
      gsap
        .timeline({ delay: 0.5 })
        .fromTo(
          '.ato--topo [data-ch]',
          { opacity: 0, yPercent: 55, filter: 'blur(12px)' },
          {
            opacity: 1,
            yPercent: 0,
            filter: 'blur(0px)',
            duration: 1.6,
            ease: 'expo.out',
            stagger: 0.055,
          },
          0.4,
        )
        .fromTo(
          '.ato--topo [data-intro]',
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.12 },
          1,
        )

      gsap.utils.toArray<HTMLElement>('.ato').forEach((ato) => {
        const conteudo = ato.querySelector('.ato__conteudo')
        if (!conteudo) return
        gsap.to(conteudo, {
          opacity: 0,
          ease: 'none',
          scrollTrigger: { trigger: ato, start: 'bottom bottom', end: 'bottom 45%', scrub: true },
        })
      })
    })
    return () => mm.revert()
  })

  return null
}
