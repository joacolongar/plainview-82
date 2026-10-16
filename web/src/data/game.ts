/**
 * Rondas del juego "¿De qué película es?".
 * Las pistas son textos o ilustraciones PROPIAS (las estampas de la marca),
 * no fotogramas ni afiches: así se evita usar material con copyright
 * y cada ronda promociona una remera.
 */
export type Round = {
  id: string
  clue: string
  answer: string
  options: string[]
  productSlug?: string // remera relacionada para mostrar al terminar
}

export const rounds: Round[] = [
  {
    id: 'r1',
    clue: 'Varias vidas cruzadas en el Valle de San Fernando y, al final, llueve algo que no es agua.',
    answer: 'Magnolia',
    options: ['Magnolia', 'Short Cuts', 'Boogie Nights', 'Crash'],
    productSlug: 'magnolia',
  },
  {
    id: 'r2',
    clue: 'Un bar en Marruecos, un piano que no debería sonar y una despedida con niebla en una pista de aterrizaje.',
    answer: 'Casablanca',
    options: ['El halcón maltés', 'Casablanca', 'Tener y no tener', 'Notorious'],
    productSlug: 'casablanca',
  },
  {
    id: 'r3',
    clue: 'Un petrolero, un predicador, un pozo que arde y un batido que se comparte por la fuerza.',
    answer: 'Petróleo sangriento',
    options: ['Gigante', 'Petróleo sangriento', 'El tesoro de la Sierra Madre', 'Sin lugar para los débiles'],
  },
]
