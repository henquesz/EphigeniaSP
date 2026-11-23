'use client'

import { useEffect, useRef } from 'react'
import DitherStatue from '../DitherStatue'

/**
 * Canvas 3D fixo atrás da página inteira. O three.js só é baixado aqui, depois da montagem.
 * Sem WebGL (ou se o modelo falhar), aparece o busto em pontos (DitherStatue).
 */
export default function Cena() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    const pagina = el?.closest<HTMLElement>('.tresd')
    if (!el || !pagina) return
    let vivo = true
    let encerrar: (() => void) | undefined

    import('./cena3d')
      .then(({ criarCena }) => {
        if (!vivo) return
        encerrar = criarCena(el, {
          aoIniciar: () => {
            pagina.dataset.cena = 'pronta'
          },
          aoFalhar: () => {
            pagina.dataset.cena = 'falhou'
          },
        })
      })
      .catch(() => {
        if (vivo) pagina.dataset.cena = 'falhou'
      })

    return () => {
      vivo = false
      encerrar?.()
      delete pagina.dataset.cena
    }
  }, [])

  return (
    <div ref={ref} className="cena" aria-hidden="true">
      <DitherStatue className="cena__reserva" />
    </div>
  )
}
