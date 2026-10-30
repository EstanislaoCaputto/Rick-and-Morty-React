import { useCallback, useMemo } from 'react'
import { charactersByIdsApi } from '../../api/rickAndMorty'
import { usePaginatedResource } from '../../hooks/usePaginatedResource'
import { CardSkeleton, EmptyState, ResultCount } from './index'
import { Pagination } from './Pagination'
import { RetryButton } from './RetryButton'
import { CharacterCard } from '../cards/Cards'

/** Residentes por página (se piden en lotes de MAX_IDS_PER_REQUEST ids). */
export const RESIDENTS_PER_PAGE = 24

const fetchResidentPage =
  (residentIds) =>
  async ({ page }, { signal }) => {
    const start = (page - 1) * RESIDENTS_PER_PAGE
    const ids = residentIds.slice(start, start + RESIDENTS_PER_PAGE)
    const characters = await charactersByIdsApi.list(ids, { signal })

    // La API omite ids inexistentes y no garantiza el orden pedido: reordenamos.
    const byId = new Map(characters.map((character) => [character.id, character]))
    const results = ids.map((id) => byId.get(id)).filter(Boolean)

    return { results, info: null }
  }

/**
 * Lista paginada de residentes de una locación.
 *
 * Pide solo los ids de la página visible (`/character/1,2,3`), no los cientos
 * que puede tener una locación. Usa la misma paginación que los listados
 * (`usePaginatedResource` + `Pagination` + `ResultCount`).
 */
export function ResidentsSection({ residentIds = [], residentCount = residentIds.length }) {
  const fetcher = useMemo(() => fetchResidentPage(residentIds), [residentIds])
  const { data, page, status, error, isLoading, hasNext, hasPrev, next, prev, retry } =
    usePaginatedResource(fetcher, undefined, {
      itemsPerPage: RESIDENTS_PER_PAGE,
      totalItems: residentIds.length,
    })

  const totalPages = Math.ceil(residentIds.length / RESIDENTS_PER_PAGE)
  const scrollToResidents = useCallback(() => {
    // happy-dom no implementa scrollIntoView; en navegadores reales sí existe.
    document.getElementById('residents-title')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }, [])

  const handlePrev = () => {
    prev()
    scrollToResidents()
  }

  const handleNext = () => {
    next()
    scrollToResidents()
  }

  if (residentCount === 0) {
    return <p className="residents__empty">Esta locación no tiene residentes registrados.</p>
  }

  // Igual que en los listados: un fallo no deja la sección vacía, ofrece reintentar.
  if (status === 'error') {
    return (
      <EmptyState
        icon="⚠"
        title="No pudimos cargar los residentes"
        description={error?.message ?? 'Ocurrió un error inesperado.'}
        action={<RetryButton onRetry={retry} label="Reintentar residentes" />}
      />
    )
  }

  return (
    <div className="residents__body">
      <div className="results-bar">
        <ResultCount
          shown={isLoading ? 0 : data.length}
          total={residentCount}
          label="residentes"
          page={page}
          totalPages={totalPages}
        />
      </div>

      {isLoading && <CardSkeleton count={RESIDENTS_PER_PAGE} />}

      {!isLoading && data.length > 0 && (
        <>
          <div className="card-grid residents__grid">
            {data.map((character) => (
              <article key={character.id}>
                <CharacterCard character={character} />
              </article>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            hasPrev={hasPrev}
            hasNext={hasNext}
            onPrev={handlePrev}
            onNext={handleNext}
            label="Paginación de residentes"
            compact
          />
        </>
      )}
    </div>
  )
}
