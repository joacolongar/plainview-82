import { Link } from 'react-router-dom'

/**
 * Logo que gira en 3D: frente = bloque rojo 8:2, dorso = PLAINVIEW (animación en index.css).
 * - La caja tiene tamaño fijo y el giro es solo `transform`, así que no mueve nada del layout.
 * - Las imágenes están exportadas a 3x del tamaño en pantalla para que se vean nítidas.
 * - Con prefers-reduced-motion no gira y queda el dorso (PLAINVIEW) fijo.
 */
/** `center`: centra el bloque 8:2 dentro de la caja (en el recuadro de la cabecera del diario). Por defecto va a la izquierda. */
export default function RotatingLogo({ center = false }: { center?: boolean }) {
  return (
    <Link to="/" aria-label="Plainview 8:2" className="flex min-h-11 items-center">
      <span className="block h-10 w-[138px] perspective-[1000px] md:h-14 md:w-[175px]">
        <span className="relative block size-full transform-3d animate-logo-flip motion-reduce:animate-none motion-reduce:rotate-y-180">
          <span className={`absolute inset-0 flex items-center backface-hidden ${center ? 'justify-center' : ''}`}>
            <img src="/logo/logo-8-2.webp" alt="" width={161} height={168} className="h-full w-auto" />
          </span>
          <span className="absolute inset-0 flex items-center rotate-y-180 backface-hidden">
            <img src="/logo/logo-plainview.webp" alt="" width={526} height={114} className="h-auto w-full" />
          </span>
        </span>
      </span>
    </Link>
  )
}
