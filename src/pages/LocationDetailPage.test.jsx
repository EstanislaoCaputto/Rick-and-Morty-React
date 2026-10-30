import { StrictMode } from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import LocationDetailPage from './LocationDetailPage'
import { RESIDENTS_PER_PAGE } from '../components/ui/ResidentsSection'
import { MAX_IDS_PER_REQUEST } from '../api/rickAndMorty'

const chunk = (items, size) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size))

// Como un fetch real: el cuerpo se resuelve en microtasks, así la respuesta
// llega después del commit; si se resolviera dentro de act(), las respuestas
// del efecto duplicado (StrictMode) llegarían en orden inverso al real.
const jsonResponse = (body) =>
  Promise.resolve({
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve(body),
  })

/** Locación con `count` residentes e ids 1..count. */
const locationPayload = (count) => ({
  id: 20,
  name: 'Earth (Replacement Dimension)',
  type: 'Planet',
  dimension: 'Replacement Dimension',
  residents: Array.from({ length: count }, (_, i) => `https://rickandmortyapi.com/api/character/${i + 1}`),
})

const character = (id) => ({
  id,
  name: `Residente ${id}`,
  status: 'Alive',
  species: 'Human',
  image: '',
  location: { name: 'Earth (Replacement Dimension)' },
})

/**
 * Fake de fetch que replica la API real:
 * - `/location/:id` responde la locación
 * - `/character/1,2,3` responde solo los que existen (los "inexistentes" se omiten)
 */
const createApiMock = ({ residentCount = 230, missingIds = [] } = {}) => {
  const askedBatches = []
  const fetchMock = vi.fn((url) => {
    // Solo `/api/location/20` es la locación; `/api/character/1,2,...` son residentes
    // (y las páginas se piden en lotes de MAX_IDS_PER_REQUEST ids).
    if (/\/api\/location\/\d+$/.test(url)) return jsonResponse(locationPayload(residentCount))

    const ids = url
      .split('/character/')[1]
      .split('?')[0]
      .split(',')
      .map(Number)
      .filter(Boolean)
    askedBatches.push(ids)
    return jsonResponse(ids.filter((id) => !missingIds.includes(id)).map(character))
  })
  return { fetchMock, askedBatches }
}

const renderLocation = ({ strict = false } = {}) => {
  const router = createMemoryRouter(
    [
      { path: '/locations/:id', element: <LocationDetailPage /> },
      { path: '/characters/:id', element: <div>detalle personaje</div> },
    ],
    { initialEntries: ['/locations/20'] },
  )
  const ui = <RouterProvider router={router} />
  return render(strict ? <StrictMode>{ui}</StrictMode> : ui)
}

const nextButton = () => screen.getByRole('button', { name: /siguiente/i })
const prevButton = () => screen.getByRole('button', { name: /anterior/i })
const pageInfo = () => document.querySelector('.pagination__info').textContent
const residentLinks = () => screen.queryAllByRole('link', { name: /ver detalles de residente/i })
const newUser = () => userEvent.setup({ advanceTimers: () => {} })

describe('LocationDetailPage · residentes', () => {
  let api

  beforeEach(() => {
    api = createApiMock()
    vi.stubGlobal('fetch', api.fetchMock)
  })

  it(`muestra el total real y pagina de a ${RESIDENTS_PER_PAGE}`, async () => {
    renderLocation()

    await screen.findByText('Residente 1')
    const totalPages = Math.ceil(230 / RESIDENTS_PER_PAGE)

    expect(screen.getByRole('status')).toHaveTextContent(`${RESIDENTS_PER_PAGE} de 230 residentes`)
    expect(screen.getByRole('status')).toHaveTextContent(`Página 1 de ${totalPages}`)
    expect(pageInfo()).toBe(`1 / ${totalPages}`)
    expect(residentLinks()).toHaveLength(RESIDENTS_PER_PAGE)
    expect(nextButton()).toBeEnabled()
    expect(prevButton()).toBeDisabled()
  })

  it('pide solo los ids de la página actual (no los 230 de una vez)', async () => {
    renderLocation()
    await screen.findByText('Residente 1')

    // Una página = varias consultas de a MAX_IDS_PER_REQUEST ids (lotes chicos y estables).
    expect(api.askedBatches).toEqual(
      Array.from({ length: RESIDENTS_PER_PAGE }, (_, i) => i + 1).map((id) => [id]).length
        ? chunk(Array.from({ length: RESIDENTS_PER_PAGE }, (_, i) => i + 1), MAX_IDS_PER_REQUEST)
        : [],
    )
  })

  it('recorre todas las páginas hasta el último residente (230)', async () => {
    const user = newUser()
    renderLocation()

    await screen.findByText('Residente 1')
    const totalPages = Math.ceil(230 / RESIDENTS_PER_PAGE)
    await waitFor(() => expect(nextButton()).toBeEnabled())

    for (let page = 1; page < totalPages; page++) {
      await user.click(nextButton())
      await waitFor(() => expect(pageInfo()).toBe(`${page + 1} / ${totalPages}`))
      await waitFor(() => expect(residentLinks().length).toBeGreaterThan(0))
    }

    // Última página: 230 - 24*9 = 14 residentes, hasta el id 230.
    const lastCount = 230 - (totalPages - 1) * RESIDENTS_PER_PAGE
    expect(residentLinks()).toHaveLength(lastCount)
    expect(screen.getByText('Residente 230')).toBeInTheDocument()
    expect(nextButton()).toBeDisabled()
    await waitFor(() => expect(prevButton()).toBeEnabled())
    const lastIds = Array.from({ length: lastCount }, (_, i) => 230 - lastCount + 1 + i)
    expect(api.askedBatches.slice(-chunk(lastIds, MAX_IDS_PER_REQUEST).length)).toEqual(
      chunk(lastIds, MAX_IDS_PER_REQUEST),
    )
    expect(api.askedBatches.every((ids) => ids.length <= MAX_IDS_PER_REQUEST)).toBe(true)
  })

  it('funciona igual dentro de StrictMode (doble invocación de updaters)', async () => {
    const user = newUser()
    renderLocation({ strict: true })
    await screen.findByText('Residente 1')
    await waitFor(() => expect(nextButton()).toBeEnabled())

    await user.click(nextButton())
    await waitFor(() => expect(pageInfo()).toBe('2 / 10'))
    await waitFor(() => expect(nextButton()).toBeEnabled())
    await user.click(nextButton())
    await waitFor(() => expect(pageInfo()).toBe('3 / 10'))
  })

  it('vuelve a la página anterior', async () => {
    const user = newUser()
    renderLocation()
    await screen.findByText('Residente 1')
    await waitFor(() => expect(nextButton()).toBeEnabled())

    await user.click(nextButton())
    await waitFor(() => expect(pageInfo()).toBe('2 / 10'))
    await waitFor(() => expect(prevButton()).toBeEnabled())
    await user.click(prevButton())
    await waitFor(() => expect(pageInfo()).toBe('1 / 10'))
    await waitFor(() => expect(prevButton()).toBeDisabled())
  })

  it('si la API omite un id, muestra los restantes sin romper la paginación', async () => {
    api = createApiMock({ residentCount: 30, missingIds: [3] })
    vi.stubGlobal('fetch', api.fetchMock)
    renderLocation()

    await screen.findByText('Residente 1')
    // 30 residentes: 2 páginas (24 + 6). Falta el id 3.
    await waitFor(() => expect(pageInfo()).toBe('1 / 2'))
    expect(screen.queryByText('Residente 3')).not.toBeInTheDocument()
    await waitFor(() => expect(residentLinks()).toHaveLength(23))
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(`${23} de 30 residentes`),
    )
  })

  it('muestra un mensaje cuando la locación no tiene residentes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        jsonResponse({ id: 17, name: 'Earth (5-126)', type: 'Planet', dimension: 'Dimension 5-126', residents: [] }),
      ),
    )
    renderLocation()

    expect(await screen.findByText(/no tiene residentes registrados/i)).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: /paginación de residentes/i })).not.toBeInTheDocument()
  })

  it('muestra error y permite reintentar si fallan los residentes', async () => {
    const user = newUser()
    let failResidents = true
    vi.stubGlobal(
      'fetch',
      vi.fn((url) => {
        if (/\/api\/location\/\d+$/.test(url)) return jsonResponse(locationPayload(230))
        // La API del navegador nunca resuelve un fetch rechazado; el cliente la
        // convierte en ApiError. Rechazamos a nivel de red de forma explícita.
        if (failResidents) return Promise.reject(new TypeError('failed to fetch'))
        return jsonResponse([1, 2, 3].map(character))
      }),
    )
    renderLocation()

    expect(
      await screen.findByText(/no pudimos cargar los residentes/i, {}, { timeout: 6000 }),
    ).toBeInTheDocument()
    failResidents = false
    await user.click(screen.getByRole('button', { name: /reintentar residentes/i }))
    await waitFor(() => expect(screen.getByText('Residente 1')).toBeInTheDocument())
  })
})
