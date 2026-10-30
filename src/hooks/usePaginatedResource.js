import { useCallback, useEffect, useState } from 'react'

export const DEFAULT_META = { count: 0, pages: 0, next: null, prev: null }

/**
 * Maneja el ciclo de vida de una petición paginada: estado de carga,
 * error y cancelación cuando cambian los parámetros.
 *
 * La respuesta guarda la clave de su petición (parámetros + página + intento):
 * si una respuesta vieja llega tarde (p. ej. por el doble efecto de StrictMode)
 * se descarta, y la UI muestra skeletons en vez de datos de otra página.
 *
 * - `totalItems` permite paginar datos locales de tamaño conocido (residentes).
 *
 * @param {(params: { page: number } & object, opts: { signal: AbortSignal }) => Promise<{ info: object, results: unknown[] }>} fetcher
 * @param {object} params Parámetros de filtro (sin `page`).
 * @param {{ itemsPerPage?: number, totalItems?: number }} [options]
 *   Paginación local: `itemsPerPage` es el tamaño de página y `totalItems`, si
 *   se conoce de antemano (p. ej. cantidad total de residentes), fija el total
 *   de páginas aunque la respuesta traiga menos filas.
 */
export function usePaginatedResource(fetcher, params, { itemsPerPage, totalItems } = {}) {
  const [page, setPage] = useState(1)
  const [attempt, setAttempt] = useState(0)
  const requestKey = JSON.stringify([params, page, attempt])

  const [state, setState] = useState(() => ({ key: null, status: 'ok', data: [], meta: null, error: null }))
  const isStale = state.key !== requestKey

  const error = !isStale && state.status === 'error' ? state.error : null
  // En esta API un 404 significa "sin resultados", no un fallo de red.
  const status = isStale ? 'loading' : state.status === 'error' ? (error?.notFound ? 'empty' : 'error') : 'success'

  // Total de páginas: paginación local, la info de la API, o ninguna si falló
  // (en ese caso solo se permite retroceder, nunca avanzar a ciegas).
  const totalPages = itemsPerPage
    ? Math.ceil((totalItems ?? state.data.length) / itemsPerPage)
    : state.meta?.pages ?? null
  const effectivePage = totalPages === null ? page : Math.min(page, Math.max(1, totalPages))
  const hasNext = !isStale && (totalPages !== null ? effectivePage < totalPages : Boolean(state.meta?.next))
  const hasPrev = !isStale && effectivePage > 1

  useEffect(() => {
    const controller = new AbortController()

    fetcher({ ...params, page }, { signal: controller.signal })
      .then((response) => {
        setState({
          key: requestKey,
          status: 'ok',
          data: response?.results ?? [],
          // `info: null` es válido (paginación local / cálculo con itemsPerPage).
          meta: response?.info ?? null,
          error: null,
        })
      })
      .catch((fetchError) => {
        if (fetchError?.name === 'AbortError') return
        // `status: 'error'` explícito: el estado distingue el fallo (un `meta: null`
        // no alcanza porque las respuestas exitosas también pueden no traer `info`).
        setState({ key: requestKey, status: 'error', data: [], meta: null, error: fetchError })
      })

    return () => controller.abort()
  }, [requestKey, fetcher, params, page])

  // Avanzamos con el índice del render actual (no un updater: React lo ejecuta
  // dos veces en StrictMode y saltearía una página). El guard usa el índice
  // actual, así que un doble clic rápido no adelanta dos páginas de una.
  const next = useCallback(() => {
    if (hasNext) setPage(effectivePage + 1)
  }, [hasNext, effectivePage])

  const prev = useCallback(() => {
    if (hasPrev) setPage(effectivePage - 1)
  }, [hasPrev, effectivePage])

  const retry = useCallback(() => setAttempt((current) => current + 1), [])

  return {
    data: isStale ? [] : state.data,
    meta: { ...DEFAULT_META, ...(state.meta ?? {}) },
    page: effectivePage,
    status,
    error,
    isLoading: isStale,
    hasNext,
    hasPrev,
    next,
    prev,
    retry,
  }
}
