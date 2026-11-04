// La CSP (public/_headers) deja pasar un solo <style> en línea: el del template de <model-viewer>, por su hash.
// Si Dependabot actualiza @google/model-viewer y ese estilo cambia, el navegador lo bloquearía sin avisar (el visor 3D
// se vería roto en producción). Esta prueba lo detecta antes: el hash de la CSP tiene que ser el del estilo instalado.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const leer = (ruta: string) => readFileSync(new URL(ruta, import.meta.url), 'utf8')

describe('CSP y model-viewer', () => {
  it('el hash del <style> de model-viewer está en la CSP', () => {
    const template = leer('../../node_modules/@google/model-viewer/lib/template.js')
    const desde = template.indexOf('<style>') + '<style>'.length
    const hasta = template.indexOf('</style>')
    expect(desde).toBeGreaterThan(6)
    const estilo = template.slice(desde, hasta)
    // Sin ${…}: el texto del archivo es exactamente el que ve el navegador
    expect(estilo).not.toContain('${')
    const hash = createHash('sha256').update(estilo).digest('base64')
    const csp = leer('../../public/_headers')
    expect(csp, `En public/_headers, style-src tiene que llevar 'sha256-${hash}'`).toContain(`'sha256-${hash}'`)
  })
})
