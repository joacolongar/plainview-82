/**
 * Una remera que todavía no tiene render: cuelga del tendedero envuelta en papel de diario (THE PLAINVIEW, claro) y
 * atada con bramante. SVG propio, con los colores de los tokens de index.css. `torcido` cambia un poco la forma del
 * papel para que dos paquetes seguidos no sean iguales.
 */
export default function Paquete({ torcido }: { torcido: number }) {
  const t = torcido % 2 === 0 ? 1 : -1
  const papel = `M${30 - 4 * t} 6 L${270 + 3 * t} 4 L${276 + 4 * t} 288 L${24 - 3 * t} 292 Z`
  const id = `renglones-${torcido}`
  return (
    <svg viewBox="0 0 300 300" aria-hidden className="paquete block w-full">
      <defs>
        <pattern id={id} width="46" height="8" patternUnits="userSpaceOnUse">
          <rect y="3" width="40" height="2" className="fill-print-muted" opacity="0.4" />
        </pattern>
      </defs>
      <path d={papel} className="fill-papel-diario stroke-print-muted" strokeWidth="1.5" />
      <path d={papel} fill={`url(#${id})`} />
      {/* la cabecera del diario, con su filete */}
      <rect x="58" y="22" width="184" height="44" className="fill-papel-diario" />
      <text x="150" y="54" textAnchor="middle" className="fill-print font-masthead" fontSize="30">
        The Plainview
      </text>
      <path d="M58 66 H242" className="stroke-print" strokeWidth="1.5" />
      {/* un pliegue del papel */}
      <path d={`M${30 - 4 * t} 6 L${270 + 3 * t} 4 L270 96 Q150 120 30 96 Z`} className="fill-print" opacity="0.05" />
      {/* el bramante: una vuelta a lo largo, otra a lo ancho y el moño */}
      <path d="M150 5 V290 M26 172 H274" className="stroke-bramante" strokeWidth="5" />
      <path d="M150 5 V290 M26 172 H274" className="stroke-bramante-claro" strokeWidth="2" strokeDasharray="4 4" />
      <path d="M137 160 q13 -22 26 0 q-13 22 -26 0z" fill="none" className="stroke-bramante" strokeWidth="4" />
      <path d="M148 174 l-10 22 M152 174 l12 20" className="stroke-bramante" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  )
}
