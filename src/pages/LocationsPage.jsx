import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { locationsApi } from '../api/rickAndMorty'
import { usePaginatedResource } from '../hooks/usePaginatedResource'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { EmptyState, ResultCount } from '../components/ui'
import { Pagination } from '../components/ui/Pagination'
import { RetryButton } from '../components/ui/RetryButton'
import { LocationCard } from '../components/cards/Cards'

export default function LocationsPage() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('name') ?? '')
  const debouncedSearch = useDebouncedValue(search)
  const type = params.get('type') ?? ''

  const urlName = params.get('name') ?? ''
  useEffect(() => {
    const trimmed = debouncedSearch.trim()
    if (trimmed === urlName) return
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (trimmed) next.set('name', trimmed)
        else next.delete('name')
        return next
      },
      { replace: true },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const filters = useMemo(() => ({ name: urlName, type }), [urlName, type])

  const fetchLocations = useCallback((query, opts) => locationsApi.list({ ...query, ...opts }), [])

  const { data, meta, page, status: fetchStatus, error, isLoading, hasNext, hasPrev, next, prev, retry } =
    usePaginatedResource(fetchLocations, filters)

  const clearFilters = () => {
    setSearch('')
    setParams({}, { replace: true })
  }

  const totalPages = meta.pages ?? 0
  const hasFilters = Boolean(filters.name || filters.type)

  return (
    <section className="page" aria-labelledby="locations-title">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Rick and Morty API</p>
          <h1 id="locations-title" className="page__title">
            Locaciones
          </h1>
          <p className="page__subtitle">
            Planeta a planeta: explorá los lugares que aparecen en la serie.
          </p>
        </div>
      </header>

      <form className="filters" role="search" onSubmit={(event) => event.preventDefault()}>
        <div className="filters__field filters__field--search">
          <label htmlFor="location-search">Buscar por nombre</label>
          <div className="filters__input-wrap">
            <svg className="filters__icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" strokeLinecap="round" />
            </svg>
            <input
              id="location-search"
              type="search"
              className="filters__input"
              placeholder="Citadel, Earth, Gazorpazorp…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        {hasFilters && (
          <button type="button" className="filters__clear" onClick={clearFilters}>
            Limpiar
          </button>
        )}
      </form>

      {!isLoading && fetchStatus === 'error' && (
        <EmptyState
          icon="⚠"
          title="No pudimos cargar las locaciones"
          description={error?.message ?? 'Ocurrió un error inesperado.'}
          action={<RetryButton onRetry={retry} />}
        />
      )}

      {!isLoading && fetchStatus === 'empty' && (
        <EmptyState
          icon="🌌"
          title="Sin resultados"
          description="No existe ninguna locación con ese nombre."
          action={
            <button type="button" className="button" onClick={clearFilters}>
              Limpiar filtros
            </button>
          }
        />
      )}

      {isLoading && (
        <div className="locations-list" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton" style={{ height: 108, borderRadius: 14 }} />
          ))}
        </div>
      )}

      {!isLoading && fetchStatus === 'success' && (
        <>
          <div className="results-bar">
            <ResultCount
              shown={data.length}
              total={meta.count}
              label="locaciones"
              page={page}
              totalPages={totalPages}
            />
          </div>

          <div className="locations-list">
            {data.map((location) => (
              <LocationCard key={location.id} location={location} />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            hasPrev={hasPrev}
            hasNext={hasNext}
            onPrev={prev}
            onNext={next}
            label="Paginación de locaciones"
          />
        </>
      )}
    </section>
  )
}
