// Pruebas de cuándo aparece la entrada (docs/entrada/ENTRADA.md): solo al entrar por la portada en una pestaña nueva.
import { describe, expect, it } from 'vitest'
import { debeMostrarEntrada } from './entrada'

const nueva = { ruta: '/', tipoNavegacion: 'navigate', yaVista: false }

describe('debeMostrarEntrada', () => {
  it('aparece al entrar por la portada en una pestaña nueva', () => {
    expect(debeMostrarEntrada(nueva)).toBe(true)
  })

  it('no aparece al recargar ni al volver con atrás/adelante', () => {
    expect(debeMostrarEntrada({ ...nueva, tipoNavegacion: 'reload' })).toBe(false)
    expect(debeMostrarEntrada({ ...nueva, tipoNavegacion: 'back_forward' })).toBe(false)
  })

  it('no aparece por el link de una remera ni por otra página', () => {
    for (const ruta of ['/catalogo/magnolia', '/catalogo', '/pasatiempos', '/carrito', '/atencion-al-lector']) {
      expect(debeMostrarEntrada({ ...nueva, ruta })).toBe(false)
    }
  })

  it('no aparece dos veces en la misma pestaña (ni si el almacenamiento falla, que cuenta como vista)', () => {
    expect(debeMostrarEntrada({ ...nueva, yaVista: true })).toBe(false)
  })
})
