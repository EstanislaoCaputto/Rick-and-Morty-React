import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { charactersApi } from '../api/rickAndMorty'
import { usePaginatedResource } from '../hooks/usePaginatedResource'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { CardSkeleton, EmptyState, ResultCount } from '../components/ui'
import { Pagination } from '../components/ui/Pagination'
import { RetryButton } from '../components/ui/RetryButton'
import { CharacterCard } from '../components/cards/Cards'
import { STATUS_OPTIONS } from '../utils/labels'

const PAGE_SIZE = 20

export default function CharactersPage() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('name') ?? '')
  const debouncedSearch = useDebouncedValue(search)
  const status = params.get('status') ?? ''

  // La URL es la fuente de verdad de los filtros: permite compartir enlaces.
  const updateFilter = (key, value) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  }

  // Solo actualizamos la URL cuando el texto debounced realmente cambia el
  // filtro. Depende únicamente de `debouncedSearch` (no de `params`): así el
  // efecto no se re-dispara al escribir (rodearlo de useCallback no basta,
  // porque igual se vuelve a ejecutar con cada tecla y deja una ventana sin datos).
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

  // La URL es la fuente de verdad: el listado solo cambia cuando cambia la URL.
  const filters = useMemo(() => ({ name: urlName, status }), [urlName, status])

  const fetchCharacters = useCallback((query, opts) => charactersApi.list({ ...query, ...opts }), [])

  const { data, meta, page, status: fetchStatus, error, isLoading, hasNext, hasPrev, next, prev, retry } =
    usePaginatedResource(fetchCharacters, filters)

  const hasFilters = Boolean(filters.name || filters.status)
  const totalPages = meta.pages ?? 0

  const clearFilters = () => {
    setSearch('')
    setParams({}, { replace: true })
  }

  // Enter envía la búsqueda al instante, sin esperar el debounce.
  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = search.trim()
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (trimmed) next.set('name', trimmed)
        else next.delete('name')
        return next
      },
      { replace: true },
    )
  }

  return (
    <section className="page" aria-labelledby="characters-title">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Rick and Morty API</p>
          <h1 id="characters-title" className="page__title">
            Personajes
          </h1>
          <p className="page__subtitle">
            {meta.count > 0
              ? `${meta.count} personajes registrados en el multiverso.`
              : 'Explorá el multiverso de Rick and Morty.'}
          </p>
        </div>
      </header>

      <form className="filters" role="search" onSubmit={handleSubmit}>
        <div className="filters__field filters__field--search">
          <label htmlFor="character-search">Buscar por nombre</label>
          <div className="filters__input-wrap">
            <svg className="filters__icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" strokeLinecap="round" />
            </svg>
            <input
              id="character-search"
              type="search"
              className="filters__input"
              placeholder="Rick, Morty, Summer…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        <fieldset className="filters__group">
          <legend>Estado</legend>
          <div className="filters__segmented" role="group">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="filters__segment"
                aria-pressed={status === option.value}
                onClick={() => updateFilter('status', option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        {hasFilters && (
          <button type="button" className="filters__clear" onClick={clearFilters}>
            Limpiar
          </button>
        )}
      </form>

      {!isLoading && fetchStatus !== 'error' && data.length > 0 && (
        <div className="results-bar">
          <ResultCount shown={data.length} total={meta.count} page={page} totalPages={totalPages} />
        </div>
      )}

      {isLoading && <CardSkeleton count={PAGE_SIZE} />}

      {!isLoading && fetchStatus === 'error' && (
        <EmptyState
          icon="⚠"
          title="No pudimos cargar los personajes"
          description={error?.message ?? 'Ocurrió un error inesperado.'}
          action={<RetryButton onRetry={retry} />}
        />
      )}

      {!isLoading && fetchStatus === 'empty' && (
        <EmptyState
          icon="🔍"
          title="Sin resultados"
          description="Ningún personaje coincide con tu búsqueda. Probá con otro nombre o quitá los filtros."
          action={
            <button type="button" className="button" onClick={clearFilters}>
              Limpiar filtros
            </button>
          }
        />
      )}

      {!isLoading && fetchStatus === 'success' && (
        <>
          <div className="card-grid">
            {data.map((character) => (
              <article key={character.id} className="card-grid__item">
                <CharacterCard character={character} />
              </article>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            hasPrev={hasPrev}
            hasNext={hasNext}
            onPrev={prev}
            onNext={next}
            label="Paginación de personajes"
          />
        </>
      )}
    </section>
  )
}
