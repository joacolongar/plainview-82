// La portada nueva (docs/portada/PORTADA.md): la remera de tapa rota con la edición, cada render de la portada existe y
// el fondo de la foto de tapa (el que lleva cada cuadro del video) es el mismo color que pinta la página.
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { products, rendersDe, type Product } from '../data/products'
import TAPA from '../data/tapa.json'
import TENDEDERO from '../data/tendedero.json'
import type { Noticia } from '../data/noticias'
import { repartirConTapa } from './portada'
import { remeraDeTapa, remerasDeTapa } from './tapa'

const conVuelta = (slug: string, tituloTapa?: string): Product => {
  const base = products[0]
  const colores = { Negro: { glb: '', frente: '', vuelta: { video: `/v/${slug}.mp4`, poster: `/v/${slug}.webp` } } }
  return { ...base, slug, colors: ['Negro'], tituloTapa, modelo3d: { colores, puntos: [] } }
}

describe('remera de tapa', () => {
  it('rota una por edición, en el orden del catálogo, entre las que tienen vuelta y titular de tapa', () => {
    const sinRender: Product = { ...products[0], slug: 'sin', modelo3d: undefined, tituloTapa: 'Algo' }
    const catalogo = [conVuelta('a', 'Título A'), sinRender, conVuelta('b', 'Título B'), conVuelta('c')]
    expect(remerasDeTapa(catalogo).map((t) => t.producto.slug)).toEqual(['a', 'b'])
    expect([1, 2, 3, 4].map((n) => remeraDeTapa(n, catalogo)?.titulo)).toEqual(['Título A', 'Título B', 'Título A', 'Título B'])
    expect(remeraDeTapa(1, [sinRender])).toBeUndefined()
  })

  it('la principal va abajo con su grabado; si es de la película de la tapa, pasa a ser la primera nota de arriba', () => {
    const tapa = remeraDeTapa(1, products)!
    const n = (id: string, pelicula: string): Noticia => ({ id, tipo: 'secundaria', seccion: 'clima', pelicula, titular: id })
    const secundarias = [n('s1', 'rocky-iii'), n('s2', 'casablanca'), n('s3', 'se7en'), n('s4', 'fargo')]
    const otra = repartirConTapa({ principal: { ...n('p', 'fargo'), tipo: 'principal' }, secundarias }, tapa)
    expect(otra.principalAbajo).toBe(true)
    expect(otra.arriba.map((x) => x.id)).toEqual(['s1', 's2'])
    expect(otra.resto.map((x) => x.id)).toEqual(['s3', 's4'])
    const misma = repartirConTapa({ principal: { ...n('p', 'magnolia'), tipo: 'principal' }, secundarias }, tapa)
    expect(misma.principalAbajo).toBe(false)
    expect(misma.arriba.map((x) => x.id)).toEqual(['p', 's1'])
    expect(misma.resto.map((x) => x.id)).toEqual(['s2', 's3', 's4'])
  })

  it('hoy sale Magnolia, con su titular de tapa', () => {
    expect(remeraDeTapa(1, products)?.producto.slug).toBe('magnolia')
  })

  it('cada render de la portada existe en public/ (aplicar_diseno.py --web y --vuelta)', () => {
    for (const p of products) {
      const r = rendersDe(p)
      for (const ruta of [r?.colgada, r?.vuelta?.video, r?.vuelta?.poster].filter(Boolean)) {
        expect(existsSync(`public${ruta}`), `${p.slug}: falta public${ruta}`).toBe(true)
      }
      if (r?.vuelta) expect(p.tituloTapa, `${p.slug} tiene vuelta: le falta tituloTapa`).toBeTruthy()
    }
  })

  it('el fondo de la vuelta es --color-foto de index.css', () => {
    const css = readFileSync('src/index.css', 'utf8')
    expect(css).toContain(`--color-foto: ${TAPA.fondo};`)
  })

  it('tendedero.json trae el tamaño y dos broches dentro de la imagen', () => {
    expect(TENDEDERO.ancho).toBeGreaterThan(0)
    expect(TENDEDERO.broches).toHaveLength(2)
    for (const [x, y] of TENDEDERO.broches) {
      expect(x).toBeGreaterThan(0)
      expect(x).toBeLessThan(100)
      expect(y).toBeLessThan(15)
    }
  })
})
