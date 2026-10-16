import type { ReactNode } from 'react'

/**
 * Símbolos propios del Cifrado, dibujados con formas simples (caja de 24×24, trazo de tinta).
 * Las claves son los caracteres Unicode que usa scripts/pasatiempos.py como IDENTIFICADORES:
 * no se muestran como texto porque varios no tienen fuente en todos los celulares.
 * Los dibujos son de la marca (no copian ningún cifrado real) y tienen que distinguirse a 20 px.
 */
const GLIFOS: Record<string, ReactNode> = {
  // triángulos
  'Δ': <path d="M12 4 L20 19 H4 Z" />,
  '△': <><path d="M12 4 L20 19 H4 Z" /><circle cx="12" cy="14" r="1.6" fill="currentColor" /></>,
  '▽': <path d="M4 5 H20 L12 20 Z" />,
  '◁': <path d="M19 4 V20 L5 12 Z" />,
  '▷': <path d="M5 4 V20 L19 12 Z" />,
  // círculos
  '○': <circle cx="12" cy="12" r="7.5" />,
  '●': <circle cx="12" cy="12" r="7.5" fill="currentColor" />,
  'Θ': <><circle cx="12" cy="12" r="7.5" /><path d="M6 12 H18" /></>,
  'Φ': <><circle cx="12" cy="12" r="6" /><path d="M12 3 V21" /></>,
  '⊕': <><circle cx="12" cy="12" r="7.5" /><path d="M12 4.5 V19.5 M4.5 12 H19.5" /></>,
  '⊗': <><circle cx="12" cy="12" r="7.5" /><path d="M7 7 L17 17 M17 7 L7 17" /></>,
  // cuadrados y rombos
  '□': <rect x="5" y="5" width="14" height="14" />,
  '■': <rect x="5" y="5" width="14" height="14" fill="currentColor" />,
  '◇': <path d="M12 3 L20 12 L12 21 L4 12 Z" />,
  // trazos
  'Λ': <path d="M5 20 L12 4 L19 20" />,
  'Ξ': <path d="M5 5 H19 M7 12 H17 M5 19 H19" />,
  'Π': <path d="M4 5 H20 M8 5 V20 M16 5 V20" />,
  'Σ': <path d="M18 5 H6 L12 12 L6 19 H18" />,
  'Ψ': <path d="M5 5 C5 12 8 14 12 14 C16 14 19 12 19 5 M12 3 V21" />,
  'Ω': <path d="M4 20 H9 C5 17 5 5 12 5 C19 5 19 17 15 20 H20" />,
  '⊥': <path d="M12 4 V19 M5 19 H19" />,
  // signos antiguos (versiones propias, simplificadas)
  '♁': <><circle cx="12" cy="8" r="4.5" /><path d="M12 12.5 V21 M8 17 H16" /></>,
  '♃': <path d="M6 7 C9 4 12 7 9 11 L6 15 H19 M15 9 V21" />,
  '♄': <path d="M9 3 V18 C9 21 13 21 14 18 M5 7 H13 M9 12 C12 9 17 11 15 15" />,
  '♆': <path d="M5 5 C5 11 8 13 12 13 C16 13 19 11 19 5 M12 3 V21 M8 18 H16" />,
  '☊': <><path d="M7 18 C3 13 6 5 12 5 C18 5 21 13 17 18" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></>,
  '☋': <><path d="M7 6 C3 11 6 19 12 19 C18 19 21 11 17 6" /><circle cx="6" cy="5" r="2" /><circle cx="18" cy="5" r="2" /></>,
}

export default function Glifo({ id, className = 'size-5' }: { id: string; className?: string }) {
  const dibujo = GLIFOS[id]
  if (!dibujo) return <span className={className} aria-hidden>{id}</span> // por si una edición trae un símbolo nuevo sin dibujar
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {dibujo}
    </svg>
  )
}
