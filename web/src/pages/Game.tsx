import { useState } from 'react'
import { Link } from 'react-router-dom'
import { rounds } from '../data/game'

export default function Game() {
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)

  const done = index >= rounds.length
  if (done)
    return (
      <div className="text-center space-y-4">
        <h1 className="font-display text-4xl">Fin de la función</h1>
        <p className="font-mono text-2xl">{score} / {rounds.length}</p>
        <button onClick={() => { setIndex(0); setScore(0); setPicked(null) }} className="min-h-11 w-full border border-paper px-5 uppercase text-sm sm:w-auto">Jugar de nuevo</button>
      </div>
    )

  const r = rounds[index]
  const choose = (opt: string) => {
    if (picked) return
    setPicked(opt)
    if (opt === r.answer) setScore((s) => s + 1)
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <p className="font-mono text-xs text-muted">Ronda {index + 1} de {rounds.length} · Puntaje {score}</p>
      <h1 className="font-display text-2xl leading-snug md:text-3xl">“{r.clue}”</h1>
      <div className="grid gap-2">
        {r.options.map((opt) => {
          const state = !picked ? 'border-line hover:border-paper' : opt === r.answer ? 'border-red text-red' : opt === picked ? 'border-line line-through text-muted' : 'border-line text-muted'
          return (
            <button key={opt} onClick={() => choose(opt)} className={`min-h-12 border px-4 py-3 text-left ${state}`}>{opt}</button>
          )
        })}
      </div>
      {picked && (
        <div className="flex items-center justify-between gap-4">
          {r.productSlug ? <Link to={`/producto/${r.productSlug}`} className="flex min-h-11 items-center text-sm underline">Ver la remera</Link> : <span />}
          <button onClick={() => { setIndex(index + 1); setPicked(null) }} className="min-h-11 bg-red px-6 uppercase text-sm">Siguiente</button>
        </div>
      )}
    </div>
  )
}
