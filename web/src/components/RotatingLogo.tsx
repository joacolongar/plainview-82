import { Link } from 'react-router-dom'

type Props = {
  /** De qué lado de la cabecera está: la cara PLAINVIEW se extiende hacia adentro (hacia el título) */
  lado: 'izquierda' | 'derecha'
  /** Tamaño del bloque (clases de Tailwind). El contenedor del giro mide lo mismo que el bloque rojo */
  tamano: string
}

/**
 * Logo que gira en 3D (animación en index.css): cara A = bloque rojo 8:2, cara B = PLAINVIEW en tinta, sin fondo.
 * - El contenedor tiene el tamaño del bloque y el giro es solo `transform`: no mueve nada del layout.
 * - La cara B es más ancha que el bloque y se sale hacia el título (overflow visible), sin empujarlo.
 *   Truco del giro: el contenedor rota 180° sobre su centro, así que lo que antes del giro está pegado a la
 *   izquierda termina visualmente a la derecha. Por eso, para el lado "derecha", la cara B se ancla con left-0.
 * - Las imágenes están exportadas a 3x del tamaño en pantalla. Con prefers-reduced-motion queda fija la cara B.
 */
export default function RotatingLogo({ lado, tamano }: Props) {
  return (
    <Link to="/" aria-label="Plainview 8:2" className={`relative block shrink-0 perspective-[1000px] ${tamano}`}>
      <span className="relative block size-full transform-3d animate-logo-flip motion-reduce:animate-none motion-reduce:rotate-y-180">
        <img src="/logo/logo-8-2-bloque.webp" alt="" width={287} height={300} className="absolute inset-0 size-full backface-hidden" />
        {/* 30% del alto en mobile para que no pise el título; 36% desde md, como en la maqueta */}
        <span className={`absolute top-1/2 h-[30%] -translate-y-1/2 rotate-y-180 backface-hidden md:h-[36%] ${lado === 'derecha' ? 'left-0' : 'right-0'}`}>
          <img src="/logo/logo-plainview-tinta.webp" alt="" width={486} height={108} className="h-full w-auto max-w-none" />
        </span>
      </span>
    </Link>
  )
}
