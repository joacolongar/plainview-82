// Pruebas de los títulos y Open Graph por ruta (lib/meta.ts, que usa functions/_middleware.ts)
import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { paginas } from '../data/paginas'
import { products } from '../data/products'
import { metaDe } from './meta'

describe('metaDe', () => {
  it('cada remera tiene su título, su bajada y su imagen 1200×630 en public/og/', () => {
    for (const p of products) {
      const m = metaDe(`/catalogo/${p.slug}`)
      expect(m.tipo).toBe('product')
      expect(m.titulo).toContain(p.titular)
      expect(m.descripcion).toBe(p.bajada)
      expect(existsSync(`public${m.imagen}`), `${m.imagen}: correr scripts/og/generar.py`).toBe(true)
    }
    expect(existsSync('public/og/portada.jpg')).toBe(true)
  })

  it('la barra final no cambia la página', () => {
    expect(metaDe('/catalogo/magnolia/')).toEqual(metaDe('/catalogo/magnolia'))
  })

  it('todas las páginas del diario tienen título propio y una dirección inexistente es la Fe de erratas', () => {
    const titulos = paginas.map((p) => metaDe(p.ruta).titulo)
    expect(new Set(titulos).size).toBe(titulos.length)
    expect(metaDe('/no/existe').titulo).toMatch(/^Fe de erratas/)
    expect(metaDe('/catalogo/no-existe').titulo).toMatch(/^Fe de erratas/)
  })

  it('la ficha de Pecados capitales no spoilea al compartirse', () => {
    const m = metaDe('/catalogo/pecados-capitales')
    const texto = `${m.titulo} ${m.descripcion} ${m.imagenAlt}`.toLowerCase()
    for (const palabra of ['caja', 'cabeza', 'desierto']) expect(texto).not.toContain(palabra)
  })
})
