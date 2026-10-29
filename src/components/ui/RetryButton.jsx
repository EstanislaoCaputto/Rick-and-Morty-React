import { useState } from 'react'

/** Botón que repite la petición que falló para el mismo hook. */
export function RetryButton({ onRetry, label = 'Reintentar' }) {
  const [busy, setBusy] = useState(false)

  const handleClick = async () => {
    setBusy(true)
    try {
      await onRetry()
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      className="button button--primary"
      onClick={handleClick}
      disabled={busy}
      aria-busy={busy}
    >
      {busy ? 'Reintentando…' : label}
    </button>
  )
}
