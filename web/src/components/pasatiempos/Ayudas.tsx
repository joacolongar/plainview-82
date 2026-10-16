import { SELLOS, type Sello } from '../../lib/progresoPasatiempos'

export type Confirmacion = 'pista' | 'rendirse' | null

type Props = {
  pistasQuedan: number
  confirmar: Confirmacion // qué botón está esperando el segundo toque (lo maneja cada juego)
  puedeVerificar: boolean
  selloEnJuego: Sello
  aviso: string
  onPista: () => void
  onVerificar: () => void
  onRendirse: () => void
}

/**
 * Botonera común de los pasatiempos (docs/PASATIEMPOS.md): Pedir pista (borde), Verificar (rojo),
 * "Me rindo" y el sello que ganarías si lo resolvieras ahora. Solo dibuja: la lógica es de cada juego.
 */
export default function Ayudas({ pistasQuedan, confirmar, puedeVerificar, selloEnJuego, aviso, onPista, onVerificar, onRendirse }: Props) {
  const sello = SELLOS[selloEnJuego]
  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onPista}
          disabled={pistasQuedan <= 0}
          className="min-h-12 border-2 border-print px-2 font-display text-sm font-bold uppercase tracking-wider disabled:opacity-40"
        >
          {confirmar === 'pista' ? '¿Seguro? Baja el sello' : pistasQuedan > 0 ? `Pedir pista ${'◆'.repeat(pistasQuedan)}` : 'Sin pistas'}
        </button>
        {/* 19 px en negrita cuenta como "texto grande": así el crema sobre rojo (3,99:1) cumple el mínimo de 3:1 */}
        <button
          type="button"
          onClick={onVerificar}
          disabled={!puedeVerificar}
          className="min-h-12 bg-red px-2 font-display text-[19px] font-bold uppercase tracking-wider text-paper disabled:opacity-40"
        >
          Verificar
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4">
        <p className="font-display text-sm">
          Si lo resolvés ahora: <span aria-hidden>{sello.estrellas}</span> <strong>{sello.nombre}</strong>
        </p>
        <button type="button" onClick={onRendirse} className="min-h-11 font-display text-sm underline underline-offset-4">
          {confirmar === 'rendirse' ? '¿Seguro? Ver la solución sin sello' : 'Me rindo'}
        </button>
      </div>
      <p role="status" aria-live="polite" className="min-h-5 font-display text-sm italic">{aviso}</p>
    </>
  )
}
