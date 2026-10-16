export default function HowToBuy() {
  const steps = [
    'Elegí tu remera y talle en el catálogo y agregala al pedido.',
    'En "Tu pedido", tocá "Enviar pedido por WhatsApp": el mensaje se arma solo.',
    'Te respondemos para coordinar pago y envío.',
  ]
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-4xl">Cómo comprar</h1>
      <ol className="space-y-3 list-decimal pl-5">{steps.map((s) => <li key={s}>{s}</li>)}</ol>
      {/* TODO: guía de talles, medios de pago, envíos, cambios */}
    </div>
  )
}
