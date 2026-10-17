import type { Ambientacion as Tipo } from '../../data/products'
import Cafe from './Cafe'
import Pecados from './Pecados'
import Ranas from './Ranas'

/**
 * La ambientación de un aviso comercial: un detalle de la película que vive en la página (docs/AMBIENTACIONES.md).
 * Se dibuja en dos zonas del aviso, para que cada adorno quede anclado a un lugar sin texto aunque los textos
 * cambien de largo: "pagina" (los bordes de la hoja, de arriba abajo) y "grabado" (encima de la foto).
 * Reglas: nunca tapar texto, precio ni botones; de 3 a 7 elementos; quieto con prefers-reduced-motion.
 */
export type Zona = 'pagina' | 'grabado'

const COMPONENTES = { ranas: Ranas, cafe: Cafe, pecados: Pecados }

export default function Ambientacion({ tipo, zona }: { tipo?: Tipo; zona: Zona }) {
  if (!tipo) return null
  const Componente = COMPONENTES[tipo]
  return <Componente zona={zona} />
}
