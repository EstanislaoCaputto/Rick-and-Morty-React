import { useCallback, useEffect, useState } from 'react'

const RESET = { data: null, status: 'loading', error: null }

/**
 * Ejecuta un fetcher asíncrono y refleja su ciclo de vida.
 * `notFound` se distingue de `error` porque en la RM API un 404
 * significa "no existe el recurso", no un fallo de red.
 *
 * El estado guarda la clave de la petición vigente: si una respuesta llega
 * cuando los `deps` ya cambiaron (p. ej. el efecto duplicado de StrictMode),
 * se descarta salvo que sea la petición actual. Así la UI nunca muestra datos
 * viejos por una respuesta que llegó tarde.
 *
 * @param {(opts: { signal: AbortSignal }) => Promise<T>} fetcher
 * @param {unknown[]} deps Dependencias; al cambiar se repite la petición.
 * @returns {{ data: T | null, status: 'loading' | 'success' | 'not-found' | 'error', error: Error | null, retry: () => void }}
 */
export function useAsyncResource(fetcher, deps = []) {
  const [attempt, setAttempt] = useState(0)
  const requestKey = JSON.stringify([...deps, attempt])

  const [state, setState] = useState(() => ({ ...RESET, key: requestKey }))
  const isStale = state.key !== requestKey

  useEffect(() => {
    const controller = new AbortController()

    fetcher({ signal: controller.signal })
      .then((data) => setState({ key: requestKey, data, status: 'success', error: null }))
      .catch((error) => {
        if (error.name === 'AbortError') return
        setState({
          key: requestKey,
          data: null,
          status: error.notFound ? 'not-found' : 'error',
          error: error.notFound ? null : error,
        })
      })

    return () => controller.abort()
  }, [requestKey, fetcher])

  const retry = useCallback(() => setAttempt((current) => current + 1), [])

  if (isStale) return { data: null, status: 'loading', error: null, retry }
  return { data: state.data, status: state.status, error: state.error, retry }
}
