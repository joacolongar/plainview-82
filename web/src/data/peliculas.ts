/**
 * Las películas de las que habla el diario: un solo lugar con su título, año, director y grabado.
 * El `id` es el que llevan las noticias y los avisos en `pelicula` (lo arma idPelicula: minúsculas y guiones).
 * - `grabado`: la ilustración propia (SVG en public/ilustraciones/, sin extensión) que acompaña a su noticia principal.
 *   Sin grabado, la principal sale con "Grabado en preparación".
 * - El año sirve para chequear el easter egg de los avisos: el teléfono termina en el año de la película.
 * Cada película nueva del banco se suma acá (las pruebas fallan si una noticia o aviso habla de una que no está).
 */
export type Pelicula = {
  id: string
  titulo: string
  anio: number
  director: string
  grabado?: { archivo: string; alt: string }
}

export const PELICULAS: Pelicula[] = [
  // Propias (las primeras noticias y avisos del diario)
  {
    id: 'petroleo-sangriento',
    titulo: 'Petróleo sangriento',
    anio: 2007,
    director: 'Paul Thomas Anderson',
    grabado: { archivo: 'torre-petrolera', alt: 'Grabado de una torre petrolera con su balancín, junto a un tanque' },
  },
  { id: 'casablanca', titulo: 'Casablanca', anio: 1942, director: 'Michael Curtiz' },
  { id: 'magnolia', titulo: 'Magnolia', anio: 1999, director: 'Paul Thomas Anderson' },
  { id: 'quien-quiere-ser-millonario', titulo: '¿Quién quiere ser millonario?', anio: 2008, director: 'Danny Boyle' },
  { id: 'rocky-iii', titulo: 'Rocky III', anio: 1982, director: 'Sylvester Stallone' },
  { id: 'zodiac', titulo: 'Zodiac', anio: 2007, director: 'David Fincher' },
  { id: 'pecados-capitales', titulo: 'Pecados capitales', anio: 1995, director: 'David Fincher' },

  // Tanda 1 del banco (grabados de la tanda 2, docs/banco-noticias-2.md)
  {
    id: 'peloton',
    titulo: 'Pelotón',
    anio: 1986,
    director: 'Oliver Stone',
    grabado: { archivo: 'peloton-casco', alt: 'Grabado de un casco militar en el barro, entre hojas de selva' },
  },
  {
    id: 'ella',
    titulo: 'Ella',
    anio: 2013,
    director: 'Spike Jonze',
    grabado: { archivo: 'ella-bolsillo', alt: 'Grabado de un teléfono que asoma del bolsillo de una camisa' },
  },
  {
    id: 'oldboy',
    titulo: 'Oldboy',
    anio: 2003,
    director: 'Park Chan-wook',
    grabado: { archivo: 'oldboy-martillo', alt: 'Grabado de una caja de comida para llevar y un martillo apoyado' },
  },
  {
    id: 'proyecto-fin-del-mundo-project-hail-mary',
    titulo: 'Proyecto Fin del Mundo (Project Hail Mary)',
    anio: 2026,
    director: 'Phil Lord y Christopher Miller',
    grabado: { archivo: 'nave-sol', alt: 'Grabado de una nave espacial frente a un sol rayado y débil' },
  },
  {
    id: 'conclave',
    titulo: 'Cónclave',
    anio: 2024,
    director: 'Edward Berger',
    grabado: { archivo: 'conclave-chimenea', alt: 'Grabado de la chimenea de la capilla echando humo' },
  },
  {
    id: 'el-codigo-da-vinci',
    titulo: 'El código Da Vinci',
    anio: 2006,
    director: 'Ron Howard',
    grabado: { archivo: 'criptex', alt: 'Grabado de un cilindro con anillos de letras' },
  },
  {
    id: 'la-odisea',
    titulo: 'La odisea',
    anio: 2026,
    director: 'Christopher Nolan',
    grabado: { archivo: 'odisea-barco', alt: 'Grabado de un barco griego de remos sobre las olas' },
  },
  {
    id: 'el-ultimo-rey-de-escocia',
    titulo: 'El último rey de Escocia',
    anio: 2006,
    director: 'Kevin Macdonald',
    grabado: { archivo: 'maletin-medico', alt: 'Grabado de un maletín de médico con un estetoscopio' },
  },
  {
    id: 'el-odio',
    titulo: 'El odio',
    anio: 1995,
    director: 'Mathieu Kassovitz',
    grabado: { archivo: 'monoblocks-reloj', alt: 'Grabado de los monoblocks de un suburbio y un reloj' },
  },
  {
    id: 'pandillas-de-nueva-york',
    titulo: 'Pandillas de Nueva York',
    anio: 2002,
    director: 'Martin Scorsese',
    grabado: { archivo: 'galera-cuchilla', alt: 'Grabado de una galera y una cuchilla de carnicero sobre la tabla' },
  },

  // Tanda 2 del banco (solo secundarias y avisos: no necesitan grabado)
  { id: 'ciudad-de-dios', titulo: 'Ciudad de Dios', anio: 2002, director: 'Fernando Meirelles y Kátia Lund' },
  { id: 'memento', titulo: 'Memento', anio: 2000, director: 'Christopher Nolan' },
  { id: 'psicopata-americano', titulo: 'Psicópata americano', anio: 2000, director: 'Mary Harron' },
  { id: 'buenos-muchachos', titulo: 'Buenos muchachos', anio: 1990, director: 'Martin Scorsese' },
  { id: 'interestelar', titulo: 'Interestelar', anio: 2014, director: 'Christopher Nolan' },
  { id: 'la-isla-siniestra', titulo: 'La isla siniestra', anio: 2010, director: 'Martin Scorsese' },
  { id: 'whiplash', titulo: 'Whiplash', anio: 2014, director: 'Damien Chazelle' },
  { id: 'nueve-reinas', titulo: 'Nueve reinas', anio: 2000, director: 'Fabián Bielinsky' },
  { id: 'la-sustancia', titulo: 'La sustancia', anio: 2024, director: 'Coralie Fargeat' },
  { id: 'taxi-driver', titulo: 'Taxi Driver', anio: 1976, director: 'Martin Scorsese' },
]

export const getPelicula = (id: string) => PELICULAS.find((p) => p.id === id)
