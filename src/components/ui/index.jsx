import { useState } from 'react'
import { joinClasses } from '../../utils/labels'

/**
 * Imagen con lazy-loading y fallback accesible si la URL falla.
 * Tras un fallo se reintenta un par de veces (el CDN de la API falla de forma
 * intermitente); si no se recupera, queda el marcador.
 */
const MAX_IMAGE_RETRIES = 2

export function SmartImage({ src, alt, className, ...rest }) {
  const [state, setState] = useState({ src, failed: false, attempt: 0 })

  // Nueva URL = reiniciamos el estado sin pasar por un efecto.
  if (state.src !== src) setState({ src, failed: false, attempt: 0 })

  const failed = state.failed || !src

  if (failed) {
    return (
      <div className={joinClasses('smart-image-fallback', className)} role="img" aria-label={alt}>
        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 10h.01M15.5 10h.01M8 15.5c1.2-1.3 2.6-2 4-2s2.8.7 4 2" strokeLinecap="round" />
        </svg>
      </div>
    )
  }

  const handleError = () => {
    if (state.attempt >= MAX_IMAGE_RETRIES) {
      setState({ src, failed: true, attempt: state.attempt })
      return
    }
    const attempt = state.attempt + 1
    const separator = src.includes('?') ? '&' : '?'
    setState({ src, failed: false, attempt, retrySrc: `${src}${separator}retry=${attempt}` })
  }

  return (
    <img
      src={state.retrySrc ?? src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={handleError}
      className={className}
      {...rest}
    />
  )
}

/** Badge de estado (vivo / muerto / desconocido). */
export function StatusBadge({ status, label }) {
  const tone = status === 'Alive' ? 'alive' : status === 'Dead' ? 'dead' : 'unknown'
  return (
    <span className={`status-badge status-badge--${tone}`}>
      <span className="status-badge__dot" aria-hidden="true" />
      {label ?? status}
    </span>
  )
}

/** Mensaje vacío o de error con acción opcional. */
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state__icon" aria-hidden="true">{icon}</div>}
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__description">{description}</p>}
      {action}
    </div>
  )
}

/** Skeleton de carga para las tarjetas. */
export function CardSkeleton({ count = 8 }) {
  return (
    <div className="card-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton skeleton--image" />
          <div className="skeleton-card__body">
            <div className="skeleton skeleton--title" />
            <div className="skeleton skeleton--text" />
            <div className="skeleton skeleton--text skeleton--short" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Botón de paginación con íconos. */
export function PaginationButton({ direction, disabled, onClick, label }) {
  return (
    <button
      type="button"
      className="pagination__button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      {direction === 'prev' && <span aria-hidden="true">←</span>}
      {label}
      {direction === 'next' && <span aria-hidden="true">→</span>}
    </button>
  )
}

/** Contador de resultados con indicador de página opcional. */
export function ResultCount({ shown, total, label = 'resultados', page, totalPages }) {
  return (
    <p className="result-count" role="status" aria-live="polite">
      <strong>{shown}</strong> de <strong>{total}</strong> {label}
      {page && totalPages > 1 && (
        <span className="result-count__page">
          {' '}
          · Página {page} de {totalPages}
        </span>
      )}
    </p>
  )
}
