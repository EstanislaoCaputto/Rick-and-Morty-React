// Configurable para poder apuntar a otro host (proxy) con VITE_API_BASE_URL.
const BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? 'https://rickandmortyapi.com/api'

export class ApiError extends Error {
  constructor(message, { status = 0, notFound = false } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.notFound = notFound
    this.rateLimited = status === 429
  }
}

const buildQuery = (params = {}) => {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

/**
 * La API pública a veces responde de forma degradada desde su CDN (sin CORS o
 * con el cuerpo vacío); el navegador lo reporta como error de red. Con `retries`
 * reintentamos esas respuestas antes de darnos por vencidos.
 */
const NETWORK_ERROR_MESSAGE = 'No pudimos conectar con la API. Revisá tu conexión e intentá de nuevo.'

const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason)
    const id = setTimeout(resolve, ms)
    signal?.addEventListener?.(
      'abort',
      () => {
        clearTimeout(id)
        reject(signal.reason)
      },
      { once: true },
    )
  })


export async function request(endpoint, { params, signal, retries = 2, timeoutMs = 12000 } = {}) {
  let response
  for (let attempt = 0; ; attempt += 1) {
    try {
      const controller = new AbortController()
      const onAbort = () => controller.abort(signal.reason)
      signal?.addEventListener?.('abort', onAbort, { once: true })
      const timer = setTimeout(() => controller.abort(new DOMException('Timeout', 'TimeoutError')), timeoutMs)
      try {
        response = await fetch(`${BASE_URL}/${endpoint}${buildQuery(params)}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        })
      } finally {
        clearTimeout(timer)
        signal?.removeEventListener?.('abort', onAbort)
      }

      // Respuesta degradada del CDN: JSON esperado pero sin el header.
      const contentType = response.headers?.get?.('content-type') ?? ''
      const corrupt = response.ok && !contentType.includes('json')
      if (!corrupt) break
      throw new TypeError('Respuesta sin Content-Type JSON')
    } catch (error) {
      if (signal?.aborted || error.name === 'AbortError') throw error
      if (attempt >= retries) {
        throw new ApiError(NETWORK_ERROR_MESSAGE, { status: 0 })
      }
      await sleep(400 * (attempt + 1), signal)
    }
  }

  if (response.status === 404) {
    throw new ApiError('No encontramos resultados para esta búsqueda.', {
      status: 404,
      notFound: true,
    })
  }

  if (response.status === 429) {
    throw new ApiError('La API limitó las consultas por un momento. Esperá unos segundos y reintentá.', {
      status: 429,
    })
  }

  if (!response.ok) {
    throw new ApiError(`La API respondió con un error (${response.status}).`, {
      status: response.status,
    })
  }

  return response.json()
}

/** Normaliza el personaje para desacoplarlo del formato crudo de la API. */
export const normalizeCharacter = (raw) => ({
  id: raw.id,
  name: raw.name,
  status: raw.status,
  species: raw.species,
  type: raw.type,
  gender: raw.gender,
  image: raw.image,
  origin: raw.origin?.name ?? 'Desconocido',
  location: { name: raw.location?.name ?? 'Desconocido', url: raw.location?.url ?? '' },
  episodeCount: raw.episode?.length ?? 0,
})

/** Extrae el id numérico final de URLs como `.../character/42`. */
export const lastIdFromUrl = (url) => {
  const match = url?.match(/\/(\d+)$/)
  return match ? Number(match[1]) : null
}

/**
 * Normaliza la locación para desacoplarla del formato crudo de la API.
 * Con `includeResidents: false` (listados) solo conserva la cantidad y los ids,
 * sin cargar el array completo de URLs.
 */
export const normalizeLocation = (raw, { includeResidents = true } = {}) => {
  const residents = raw.residents ?? []
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type || 'Desconocido',
    dimension: raw.dimension || 'Desconocida',
    residentCount: residents.length,
    ...(includeResidents ? { residentIds: residents.map(lastIdFromUrl).filter(Boolean) } : {}),
  }
}

export const charactersApi = {
  list: ({ page = 1, name = '', status = '', species = '', signal } = {}) =>
    request('character', { params: { page, name, status, species }, signal }),
  getById: async (id, { signal } = {}) => normalizeCharacter(await request(`character/${id}`, { signal })),
}

export const locationsApi = {
  list: async ({ page = 1, name = '', type = '', dimension = '', signal } = {}) => {
    const data = await request('location', { params: { page, name, type, dimension }, signal })
    return { ...data, results: data.results.map((raw) => normalizeLocation(raw, { includeResidents: false })) }
  },
  getById: async (id, { signal } = {}) => normalizeLocation(await request(`location/${id}`, { signal })),
}

/** Máximo de ids por consulta: lotes chicos son más estables en la API pública. */
export const MAX_IDS_PER_REQUEST = 12

export const charactersByIdsApi = {
  /**
   * Trae personajes por id en lotes (`/character/1,2,3`).
   * La API ignora los ids inexistentes, por eso devuelve solo los existentes.
   */
  list: async (ids, { signal } = {}) => {
    if (!ids.length) return []
    const batches = []
    for (let i = 0; i < ids.length; i += MAX_IDS_PER_REQUEST) {
      batches.push(ids.slice(i, i + MAX_IDS_PER_REQUEST))
    }

    const responses = await Promise.all(
      batches.map((batch) => request(`character/${batch.join(',')}`, { signal })),
    )

    return responses
      .flatMap((data) => (Array.isArray(data) ? data : [data]))
      .filter((item) => item && typeof item === 'object' && item.id)
      .map(normalizeCharacter)
  },
}
