import { Link, useLocation } from 'react-router-dom'

const enlace = 'inline-flex min-h-11 items-center font-display font-bold underline decoration-red decoration-2 underline-offset-4'

/**
 * 404 como "Fe de erratas" del diario: cita la dirección que se escribió (React la muestra como texto,
 * nunca como HTML) y corrige el error con la frase de la casa. Sale también para un aviso que no existe.
 */
export default function NotFound() {
  const { pathname } = useLocation()
  // La dirección llega codificada (%3C, %20…): se decodifica para que se lea como la escribieron.
  // Si viene mal formada, decodeURIComponent tira error y se muestra tal cual.
  let citada = pathname
  try {
    citada = decodeURIComponent(pathname)
  } catch {
    /* se queda la versión codificada */
  }
  return (
    <div className="mx-auto max-w-xl py-4 text-center">
      <p className="font-headline text-6xl leading-none text-red" aria-hidden>
        404
      </p>
      <h1 className="mt-2 border-y-4 border-double border-print py-1 font-headline text-3xl uppercase">Fe de erratas</h1>
      <p className="mt-4 font-display text-lg leading-snug">
        Donde dice <span className="break-all font-mono text-base">«{citada}»</span> debe leerse:
      </p>
      <p className="mt-1 font-display text-2xl italic leading-snug">esta escena se cortó en el montaje.</p>
      <p className="mt-3 font-display text-sm italic text-print-muted">La redacción pide disculpas al lector.</p>
      <p className="mt-4 flex justify-center gap-6">
        <Link to="/" className={enlace}>
          Primera plana
        </Link>
        <Link to="/catalogo" className={enlace}>
          Índice
        </Link>
      </p>
    </div>
  )
}
