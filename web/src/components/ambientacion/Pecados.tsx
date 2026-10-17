import type { Zona } from './Ambientacion'
import Capa, { BORDES_GRABADO, BORDES_HOJA } from './Capa'

/**
 * Pecados capitales: los siete sueltos por la página, en rojo sangre con tinta corrida, en el orden de la película.
 * Del I al V se leen; VI y VII quedan casi borrados, al pie: el que vio la película entiende, al que no,
 * no se le cuenta nada. Aparecen de a uno (cada 250 ms) como si alguien los fuera escribiendo.
 *
 * Dónde: I, III y IV en las esquinas del grabado y II y V en vertical sobre sus costados (pueden pasar por encima
 * de la foto, nunca de una palabra); VI y VII en el blanco entre el aviso y el pie de página.
 * De fondo, lluvia diagonal muy tenue, detrás del texto.
 */
type Pecado = { n: number; romano: string; nombre: string; lugar: string; vertical?: 'sube' | 'baja'; borrado?: boolean }

const PECADOS: Pecado[] = [
  { n: 1, romano: 'I', nombre: 'Gula', lugar: 'top-[5%] right-8 -rotate-6' },
  { n: 2, romano: 'II', nombre: 'Avaricia', lugar: 'top-[38%] -left-1', vertical: 'sube' },
  { n: 3, romano: 'III', nombre: 'Pereza', lugar: 'top-[14%] left-8 rotate-3' },
  { n: 4, romano: 'IV', nombre: 'Lujuria', lugar: 'bottom-[5%] right-8 -rotate-3' },
  { n: 5, romano: 'V', nombre: 'Soberbia', lugar: 'top-[52%] -right-1', vertical: 'baja' },
  { n: 6, romano: 'VI', nombre: 'Envidia', lugar: 'bottom-0 left-6 rotate-2', borrado: true },
  { n: 7, romano: 'VII', nombre: 'Ira', lugar: 'bottom-0 right-6 -rotate-2', borrado: true },
]

const EN_EL_GRABADO = [1, 2, 3, 4, 5]

function Escrito({ p }: { p: Pecado }) {
  const vertical = p.vertical ? `[writing-mode:vertical-rl] ${p.vertical === 'sube' ? 'rotate-180' : ''}` : ''
  return (
    <span
      className={`amb-escribe absolute whitespace-nowrap text-sangre [filter:url(#amb-tinta)] ${p.borrado ? 'opacity-20' : ''} ${vertical} ${p.lugar}`}
      style={{ ['--retraso' as string]: `${(p.n - 1) * 0.25}s` }}
    >
      <span className="font-fell-sc text-xl">{p.romano}.</span> <span className="font-fell text-base italic">{p.nombre}</span>
    </span>
  )
}

export default function Pecados({ zona }: { zona: Zona }) {
  if (zona === 'grabado')
    return (
      <Capa className={BORDES_GRABADO}>
        {PECADOS.filter((p) => EN_EL_GRABADO.includes(p.n)).map((p) => (
          <Escrito key={p.n} p={p} />
        ))}
      </Capa>
    )

  return (
    <>
      {/* La ciudad donde nunca para de llover: detrás del texto (-z-10 dentro del aviso, que es isolate) */}
      <div aria-hidden className={`pointer-events-none absolute inset-y-0 ${BORDES_HOJA} -z-10 amb-lluvia`} />
      {/* Hasta el pie de página: el pie empieza 32 px más abajo (mt-8 en NewspaperPage) */}
      <Capa className={`top-0 -bottom-7 ${BORDES_HOJA}`}>
        {/* Tinta corrida: el borde de las letras se ondula apenas */}
        <svg width="0" height="0" className="absolute">
          <filter id="amb-tinta">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="7" />
            <feDisplacementMap in="SourceGraphic" scale="1.6" />
          </filter>
        </svg>
        {PECADOS.filter((p) => !EN_EL_GRABADO.includes(p.n)).map((p) => (
          <Escrito key={p.n} p={p} />
        ))}
      </Capa>
    </>
  )
}
