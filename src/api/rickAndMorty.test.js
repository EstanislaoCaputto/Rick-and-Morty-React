import { describe, expect, it, vi } from 'vitest'
import { normalizeCharacter, normalizeLocation, request, ApiError } from './rickAndMorty'

describe('request', () => {
  it('arma la URL con los parámetros omitiendo valores vacíos', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json; charset=utf-8' }),
      json: async () => ({ results: [], info: {} }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await request('character', { params: { page: 2, name: 'rick', status: '' }, signal: undefined })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://rickandmortyapi.com/api/character?page=2&name=rick',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    )
    vi.unstubAllGlobals()
  })

  it('traduce el 404 de la API a un ApiError con notFound', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, headers: new Headers() }))

    await expect(request('character/9999')).rejects.toMatchObject({
      name: 'ApiError',
      notFound: true,
      status: 404,
    })
    vi.unstubAllGlobals()
  })

  it('marca el 429 como rate limit con un mensaje accionable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429, headers: new Headers() }))

    await expect(request('character')).rejects.toMatchObject({
      name: 'ApiError',
      rateLimited: true,
      status: 429,
    })
    await expect(request('character')).rejects.toThrow(/limitó las consultas/i)
    vi.unstubAllGlobals()
  })

  it('convierte errores de red en ApiError y respeta AbortError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('failed to fetch')))
    await expect(request('character')).rejects.toBeInstanceOf(ApiError)

    const abort = new Error('aborted')
    abort.name = 'AbortError'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abort))
    await expect(request('character')).rejects.toThrow('aborted')

    vi.unstubAllGlobals()
  })
})

describe('request · respuestas degradadas del CDN', () => {
  it('reintenta cuando el cuerpo no es JSON y se recupera', async () => {
    const corrupt = { ok: true, status: 200, headers: new Headers({ 'content-type': 'text/html' }), json: async () => ({}) }
    const good = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ results: ['ok'], info: {} }),
    }
    const fetchMock = vi.fn().mockResolvedValueOnce(corrupt).mockResolvedValueOnce(good)
    vi.stubGlobal('fetch', fetchMock)

    await expect(request('character')).resolves.toEqual({ results: ['ok'], info: {} })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    vi.unstubAllGlobals()
  })

  it('tras agotar los reintentos lanza un error de red accionable', async () => {
    const corrupt = { ok: true, status: 200, headers: new Headers({ 'content-type': '' }), json: async () => ({}) }
    const fetchMock = vi.fn().mockResolvedValue(corrupt)
    vi.stubGlobal('fetch', fetchMock)

    await expect(request('character', { retries: 1 })).rejects.toThrow(/conectar con la API/i)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    vi.unstubAllGlobals()
  })
})

describe('normalizadores', () => {
  it('normaliza un personaje con campos faltantes', () => {
    const result = normalizeCharacter({ id: 1, name: 'Rick', episode: ['a', 'b'] })

    expect(result).toMatchObject({
      id: 1,
      name: 'Rick',
      origin: 'Desconocido',
      location: { name: 'Desconocido', url: '' },
      episodeCount: 2,
    })
  })

  it('normaliza una locación agregando residentIds', () => {
    const result = normalizeLocation({
      id: 3,
      name: 'Citadel of Ricks',
      type: '',
      dimension: null,
      residents: ['https://rickandmortyapi.com/api/character/1'],
    })

    expect(result).toMatchObject({
      type: 'Desconocido',
      dimension: 'Desconocida',
      residentCount: 1,
    })
  })
})
