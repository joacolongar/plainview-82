import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * La fecha con la que se arma la edición del día (portada, número de edición y fecha de la cabecera).
 * Es la de cuando se abrió la página: se calcula una sola vez al montar (inicializador de useState), así el render
 * queda puro. Solo en desarrollo, ?fecha=AAAA-MM-DD muestra la edición de otro día (para probar y sacar capturas).
 */
export function useFechaEdicion(): Date {
  const [ahora] = useState(() => new Date())
  const [params] = useSearchParams()
  const pedida = import.meta.env.DEV ? params.get('fecha') : null
  // Mediodía de Córdoba: lejos de la medianoche, cae en ese día en cualquier zona horaria
  return pedida && /^\d{4}-\d{2}-\d{2}$/.test(pedida) ? new Date(`${pedida}T12:00:00-03:00`) : ahora
}
