import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import CharactersPage from './CharactersPage'

const page1 = {
  info: { count: 42, pages: 3, next: 'https://rickandmortyapi.com/api/character?page=2', prev: null },
  results: [
    { id: 1, name: 'Rick Sanchez', status: 'Alive', species: 'Human', image: '', location: { name: 'Citadel' } },
    { id: 2, name: 'Morty Smith', status: 'Alive', species: 'Human', image: '', location: { name: 'Earth' } },
  ],
}

const page2 = {
  info: { count: 42, pages: 3, next: null, prev: 'https://rickandmortyapi.com/api/character?page=1' },
  results: [
    { id: 3, name: 'Summer Smith', status: 'Alive', species: 'Human', image: '', location: { name: 'Earth' } },
  ],
}

const jsonResponse = (body, status = 200) =>
  Promise.resolve({
    ok: status < 400,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
  })

function renderPage(initialEntries = ['/characters']) {
  const router = createMemoryRouter(
    [
      { path: '/characters', element: <CharactersPage /> },
      { path: '/characters/:id', element: <div>detalle</div> },
    ],
    { initialEntries },
  )
  return render(<RouterProvider router={router} />)
}

describe('CharactersPage', () => {
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn((url) => {
      if (url.includes('page=2')) return jsonResponse(page2)
      return jsonResponse(page1)
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  it('muestra los personajes de la primera página', async () => {
    renderPage()

    expect(await screen.findByText('Rick Sanchez')).toBeInTheDocument()
    expect(screen.getByText('Morty Smith')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('2 de 42 resultados')
  })

  it('navega a la página siguiente', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Rick Sanchez')
    await user.click(screen.getByRole('button', { name: /siguiente/i }))

    expect(await screen.findByText('Summer Smith')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url]) => url.includes('page=2'))).toBe(true)
    // El barrido de carga se va cuando llegan los datos.
    await waitFor(() => expect(document.querySelector('.skeleton-card')).not.toBeInTheDocument())
    // Unificamos la página en el contador: no hay indicadores duplicados.
    expect(screen.getByRole('status').textContent.replace(/\s+/g, ' ')).toBe(
      '1 de 42 resultados · Página 2 de 3',
    )
    expect(screen.getByRole('button', { name: /anterior/i })).toBeEnabled()
    // La API devuelve info.next = null en la página 2, pero info.pages = 3 (hay una 3ª página).
    await waitFor(() => expect(screen.getByText('2 / 3')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeEnabled()
  })

  it('busca por nombre y refleja el filtro en la URL', async () => {
    renderPage(['/characters?name=morty'])

    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => url.includes('name=morty'))).toBe(true),
    )
    expect(await screen.findByText('Rick Sanchez')).toBeInTheDocument()
  })

  it('muestra el estado vacío cuando la API responde 404', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({ error: 'There is nothing here' }, 404)))
    renderPage(['/characters?name=zzzz'])

    expect(await screen.findByText('Sin resultados')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /limpiar filtros/i })).toBeInTheDocument()
  })

  it('muestra error de red y mantiene el listado utilizable', async () => {
    // Fallo de red persistente: el cliente reintenta (2 veces) y luego informa.
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('failed to fetch'))))
    renderPage()

    expect(await screen.findByText('No pudimos cargar los personajes', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
  })

  it('se recupera sola si la red falla una vez (reintento del cliente)', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('failed to fetch'))
    renderPage()

    // El reintento automático evita mostrar el error por un fallo puntual.
    expect(await screen.findByText('Rick Sanchez')).toBeInTheDocument()
    expect(screen.queryByText('No pudimos cargar los personajes')).not.toBeInTheDocument()
  })

  it('reintentar vuelve a consultar la API y recupera el listado', async () => {
    const user = userEvent.setup()
    // 3 fallos agotan los reintentos del cliente (1 intento + 2 reintentos).
    fetchMock.mockRejectedValueOnce(new TypeError('failed to fetch'))
    fetchMock.mockRejectedValueOnce(new TypeError('failed to fetch'))
    fetchMock.mockRejectedValueOnce(new TypeError('failed to fetch'))
    renderPage()

    await screen.findByText('No pudimos cargar los personajes', {}, { timeout: 5000 })
    await user.click(screen.getByRole('button', { name: /reintentar/i }))

    expect(await screen.findByText('Rick Sanchez')).toBeInTheDocument()
  })

  it('muestra un mensaje claro cuando la API limita las consultas (429)', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({ error: 'Too many requests' }, 429)))
    renderPage()

    const empty = await screen.findByText('No pudimos cargar los personajes')
    expect(empty).toBeInTheDocument()
    expect(screen.getByText(/limitó las consultas/i)).toBeInTheDocument()
  })
})
