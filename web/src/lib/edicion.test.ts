// Pruebas de la edición del día (npm test). Recorren un año entero de ediciones con el banco real y chequean las
// reglas: determinismo, cambio de día a la medianoche de Argentina, sin película repetida, siempre una con remera,
// separación entre repeticiones y los largos de la regla de CLAUDE.md.
import { describe, expect, it } from 'vitest'
import { BANCO, type Banco } from '../data/banco'
import { MAX_BAJADA, ORACIONES_SECUNDARIA, SECCIONES } from '../data/noticias'
import { elegirEdicion, numeroEdicion, SEPARACION, type Edicion } from './edicion'

const DIA = 86_400_000
/** Mediodía de Córdoba de un día AAAA-MM-DD (Argentina es UTC−3 todo el año) */
const mediodia = (dia: string) => new Date(`${dia}T12:00:00-03:00`)
const piezas = (e: Edicion) => [e.principal, ...e.secundarias, ...e.minis, ...e.lineas]
const peliculaDe = (p: { id: string; pelicula?: string }) => p.pelicula ?? p.id
const oraciones = (t: string) => t.split(/(?<=[.!?])\s+/).filter(Boolean).length

const DIAS = 365
const ediciones = Array.from({ length: DIAS }, (_, i) => elegirEdicion(new Date(mediodia('2026-10-16').getTime() + i * DIA), BANCO))

describe('número de edición', () => {
  it('el 16/10/2026 es la N° 1 y cuenta un día por edición', () => {
    expect(numeroEdicion(mediodia('2026-10-16'))).toBe(1)
    expect(numeroEdicion(mediodia('2026-10-19'))).toBe(4)
    expect(numeroEdicion(mediodia('2027-10-16'))).toBe(366)
    expect(numeroEdicion(mediodia('2026-01-01'))).toBe(1) // antes del inicio, la primera
  })

  it('cambia a la medianoche de Argentina, no de UTC', () => {
    // 23:59 del 18 en Córdoba (ya es el 19 en UTC): sigue siendo la edición del 18
    expect(numeroEdicion(new Date('2026-10-19T02:59:00Z'))).toBe(3)
    expect(numeroEdicion(new Date('2026-10-19T03:00:00Z'))).toBe(4)
    expect(elegirEdicion(new Date('2026-10-19T02:59:00Z'), BANCO).dia).toBe('2026-10-18')
  })
})

describe('elegirEdicion', () => {
  it('es determinista: misma fecha, misma edición (aunque se calcule desde cero)', () => {
    const copia: Banco = { ...BANCO } // otro objeto: no comparte la simulación guardada
    for (const dia of ['2026-10-20', '2027-03-01', '2026-12-25']) {
      const a = elegirEdicion(mediodia(dia), BANCO)
      const b = elegirEdicion(mediodia(dia), copia)
      expect(piezas(b).map((p) => p.id)).toEqual(piezas(a).map((p) => p.id))
    }
    // Y a cualquier hora del mismo día
    const temprano = elegirEdicion(new Date('2026-11-02T03:01:00Z'), BANCO)
    const tarde = elegirEdicion(new Date('2026-11-03T02:58:00Z'), BANCO)
    expect(piezas(tarde).map((p) => p.id)).toEqual(piezas(temprano).map((p) => p.id))
  })

  it('arma 1 principal, 3 o 4 secundarias, 1 aviso ilustrado y 2 de una línea', () => {
    for (const e of ediciones) {
      expect(e.principal.tipo).toBe('principal')
      expect([3, 4]).toContain(e.secundarias.length)
      expect(e.secundarias.every((n) => n.tipo === 'secundaria')).toBe(true)
      expect(e.minis.map((a) => a.tipo)).toEqual(['mini'])
      expect(e.lineas.map((a) => a.tipo)).toEqual(['linea', 'linea'])
    }
  })

  it('nunca repite película dentro de una edición', () => {
    for (const e of ediciones) {
      const pelis = piezas(e).map(peliculaDe)
      expect(new Set(pelis).size, `edición ${e.numero}: ${pelis.join(', ')}`).toBe(pelis.length)
    }
  })

  it('siempre lleva al menos una película con remera en el catálogo', () => {
    for (const e of ediciones) expect(piezas(e).some((p) => BANCO.conRemera.includes(peliculaDe(p))), `edición ${e.numero}`).toBe(true)
  })

  it('la principal no se repite hasta que pasen al menos 7 ediciones', () => {
    const ultima = new Map<string, number>()
    for (const e of ediciones) {
      const antes = ultima.get(e.principal.id)
      if (antes !== undefined) expect(e.numero - antes, `${e.principal.id} en ${antes} y ${e.numero}`).toBeGreaterThan(SEPARACION)
      ultima.set(e.principal.id, e.numero)
    }
  })

  it('las secundarias se espacian lo más posible (el banco todavía no alcanza para 7)', () => {
    const ultima = new Map<string, number>()
    let minimo = Infinity
    for (const e of ediciones)
      for (const n of e.secundarias) {
        const antes = ultima.get(n.id)
        if (antes !== undefined) minimo = Math.min(minimo, e.numero - antes)
        ultima.set(n.id, e.numero)
      }
    // Con 14 secundarias y 3 o 4 por día, el piso posible ronda las 3 ediciones. Cuando el banco crezca, subir esto
    expect(minimo).toBeGreaterThanOrEqual(3)
  })

  it('con todas las noticias del banco, las principales cumplen la separación completa', () => {
    expect(BANCO.noticias.filter((n) => n.tipo === 'principal').length).toBeGreaterThan(SEPARACION)
  })
})

describe('el banco respeta los largos de CLAUDE.md', () => {
  it('principales: bajada de una línea y epígrafe, sin texto', () => {
    for (const n of BANCO.noticias.filter((x) => x.tipo === 'principal')) {
      expect(n.bajada?.length ?? 0, n.id).toBeGreaterThan(0)
      expect(n.bajada!.length, `${n.id}: "${n.bajada}"`).toBeLessThanOrEqual(MAX_BAJADA)
      expect(n.epigrafe, n.id).toBeTruthy()
      expect(n.texto, n.id).toBeUndefined()
    }
  })

  it('secundarias: sección conocida, titular y 2 o 3 oraciones', () => {
    for (const n of BANCO.noticias.filter((x) => x.tipo === 'secundaria')) {
      expect(SECCIONES[n.seccion], `${n.id}: sección ${n.seccion}`).toBeTruthy()
      expect(ORACIONES_SECUNDARIA, `${n.id}: "${n.texto}"`).toContain(oraciones(n.texto ?? ''))
    }
  })

  it('ids únicos y cada pieza con su película', () => {
    const ids = [...BANCO.noticias, ...BANCO.avisos].map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const p of [...BANCO.noticias, ...BANCO.avisos]) expect(p.pelicula, p.id).toBeTruthy()
  })
})
