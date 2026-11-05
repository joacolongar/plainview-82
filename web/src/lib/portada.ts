// Cómo se arma la portada con la remera de tapa (docs/portada/PORTADA.md). Aparte de lib/tapa.ts porque necesita el
// banco de noticias, que el servidor no carga.
import { idPelicula } from '../data/banco'
import type { Noticia } from '../data/noticias'
import type { Edicion } from './edicion'
import type { Tapa } from './tapa'

/**
 * Cómo se reparten las noticias con la tapa: dos notas al lado de la tapa (las primeras secundarias) y la principal
 * con su grabado debajo del tendedero. Si la principal es de la película de la remera de tapa, no se repite en grande:
 * pierde el grabado y pasa a ser la primera de las dos notas.
 */
export function repartirConTapa(edicion: Pick<Edicion, 'principal' | 'secundarias'>, tapa: Tapa) {
  const principal = edicion.principal
  const principalAbajo = principal.pelicula !== idPelicula(tapa.producto.movie)
  const secundariasArriba = principalAbajo ? 2 : 1
  const arriba: Noticia[] = [...(principalAbajo ? [] : [principal]), ...edicion.secundarias.slice(0, secundariasArriba)]
  return { arriba, principalAbajo, resto: edicion.secundarias.slice(secundariasArriba) }
}
