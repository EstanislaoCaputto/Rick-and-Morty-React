import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { locationsApi } from '../api/rickAndMorty'
import { useAsyncResource } from '../hooks/useAsyncResource'
import { RetryButton } from '../components/ui/RetryButton'
import { ResidentsSection } from '../components/ui/ResidentsSection'

export default function LocationDetailPage() {
  const { id } = useParams()

  const { data: location, status, retry } = useAsyncResource(
    useCallback((opts) => locationsApi.getById(id, opts), [id]),
    [id],
  )
  if (status === 'loading') {
    return (
      <section className="detail detail--loading" aria-busy="true">
        <div className="detail__skeleton-text">
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--text" />
          <div className="skeleton skeleton--text skeleton--short" />
        </div>
      </section>
    )
  }

  if (status === 'not-found') {
    return (
      <section className="detail-state">
        <h1>Locación no encontrada</h1>
        <p>Ese lugar no existe en el multiverso.</p>
        <Link className="button button--primary" to="/locations">
          Volver a locaciones
        </Link>
      </section>
    )
  }

  if (status === 'error' || !location) {
    return (
      <section className="detail-state">
        <h1>Algo salió mal</h1>
        <p>No pudimos cargar la locación. Intentá de nuevo en unos segundos.</p>
        <RetryButton onRetry={retry} />
        <Link className="button" to="/locations">
          Volver a locaciones
        </Link>
      </section>
    )
  }

  return (
    <article className="detail">
      <Link to="/locations" className="detail__back">
        ← Locaciones
      </Link>

      <div className="location-hero">
        <div className="location-hero__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.4">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" />
          </svg>
        </div>
        <div>
          <h1 className="detail__title">{location.name}</h1>
          <p className="detail__subtitle">Detalle de la locación</p>
        </div>
      </div>

      <dl className="detail__facts detail__facts--wide">
        <div>
          <dt>Tipo</dt>
          <dd>{location.type}</dd>
        </div>
        <div>
          <dt>Dimensión</dt>
          <dd>{location.dimension}</dd>
        </div>
        <div>
          <dt>Residentes</dt>
          <dd>{location.residentCount}</dd>
        </div>
      </dl>

      <section className="residents" aria-labelledby="residents-title">
        <h2 id="residents-title" className="residents__title">
          Residentes
        </h2>
        <ResidentsSection residentIds={location.residentIds ?? []} residentCount={location.residentCount} />
      </section>
    </article>
  )
}
