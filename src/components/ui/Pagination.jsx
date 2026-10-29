import { PaginationButton } from './index'

/**
 * Navegación anterior / siguiente con el indicador "página X de Y".
 * `compact` da un ícono por botón (útil en columnas angostas como el detalle).
 */
export function Pagination({ page, totalPages, hasPrev, hasNext, onPrev, onNext, label, compact = false }) {
  if (!totalPages || totalPages <= 1) return null

  if (compact) {
    return (
      <nav className="pagination pagination--compact" aria-label={label}>
        <button
          type="button"
          className="pagination__icon"
          onClick={onPrev}
          disabled={!hasPrev}
          aria-label="Página anterior"
        >
          <span aria-hidden="true">←</span>
        </button>
        <span className="pagination__info" aria-live="polite">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className="pagination__icon"
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Página siguiente"
        >
          <span aria-hidden="true">→</span>
        </button>
      </nav>
    )
  }

  return (
    <nav className="pagination" aria-label={label}>
      <PaginationButton direction="prev" label="Anterior" disabled={!hasPrev} onClick={onPrev} />
      <span className="pagination__info" aria-live="polite">
        {page} / {totalPages}
      </span>
      <PaginationButton direction="next" label="Siguiente" disabled={!hasNext} onClick={onNext} />
    </nav>
  )
}
