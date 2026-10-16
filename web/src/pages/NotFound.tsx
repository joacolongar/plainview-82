import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="text-center space-y-4">
      <p className="font-mono text-red">404</p>
      <h1 className="font-display text-4xl">Esta escena se cortó en el montaje</h1>
      <Link to="/" className="underline">Volver al inicio</Link>
    </div>
  )
}
