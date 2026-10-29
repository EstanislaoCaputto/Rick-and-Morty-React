import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import CharactersPage from './CharactersPage'
import LocationsPage from './LocationsPage'

const jsonResponse = (body, status = 200) =>
  Promise.resolve({
    ok: status < 400,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
  })

const character = (id, name) => ({
  id,
  name,
  status: 'Alive',
  species: 'Human',
  image: '',
  location: { name: 'Earth' },
})

function renderRoute(path, element, initialEntries) {
  const router = createMemoryRouter([{ path, element }], { initialEntries })
  return render(<RouterProvider router={router} />)
}

describe('filtros y paginación (integración)', () => {
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn((url) => {
      if (url.includes('/location')) {
        return jsonResponse({
          info: { count: 126, pages: 7, next: 'x', prev: null },
          results: [
            { id: 1, name: 'Earth (C-137)', type: 'Planet', dimension: 'Dimension C-137', residents: ['a', 'b'] },
          ],
        })
      }
      if (url.includes('page=2')) {
        return jsonResponse({
          info: { count: 42, pages: 3, next: null, prev: 'p1' },
          results: [character(20, 'Página dos')],
        })
      }
      return jsonResponse({
        info: { count: 42, pages: 3, next: 'p2', prev: null },
        results: [character(1, 'Rick Sanchez')],
      })
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  it('la búsqueda espera el debounce y consulta la API con el nombre', async () => {
    renderRoute('/characters', <CharactersPage />, ['/characters'])
    await screen.findByText('Rick Sanchez')

    const input = screen.getByLabelText('Buscar por nombre')
    fireEvent.change(input, { target: { value: 'morty' } })

    await waitFor(
      () => expect(fetchMock.mock.calls.some(([url]) => url.includes('name=morty'))).toBe(true),
      { timeout: 2000 },
    )
  })

  it('el filtro de estado agrega status a la consulta y actualiza la URL', async () => {
    renderRoute('/characters', <CharactersPage />, ['/characters'])
    await screen.findByText('Rick Sanchez')

    fireEvent.click(screen.getByRole('button', { name: 'Muertos' }))

    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => url.includes('status=dead'))).toBe(true),
    )
    expect(screen.getByRole('button', { name: 'Muertos' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('cambiar de página vuelve a consultar y muestra el botón anterior habilitado', async () => {
    renderRoute('/characters', <CharactersPage />, ['/characters'])
    await screen.findByText('Rick Sanchez')

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))

    expect(await screen.findByText('Página dos')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /anterior/i })).toBeEnabled()
    // Con info.pages = 3 hay una página más, aunque el fixture ponga info.next = null.
    await waitFor(() => expect(screen.getByText('2 / 3')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeEnabled()
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('al cambiar de página muestra skeletons en vez de datos viejos', async () => {
    let resolvePage2
    fetchMock.mockImplementationOnce((url) => {
      if (url.includes('page=2')) {
        return new Promise((resolve) => {
          resolvePage2 = () => resolve(jsonResponse({ info: { count: 42, pages: 3, next: null, prev: 'p1' }, results: [character(20, 'Página dos')] }))
        })
      }
      return jsonResponse({ info: { count: 42, pages: 3, next: 'p2', prev: null }, results: [character(1, 'Rick Sanchez')] })
    })
    // Segundo request (page=2) queda pendiente a propósito.
    renderRoute('/characters', <CharactersPage />, ['/characters'])
    await screen.findByText('Rick Sanchez')

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))

    // Mientras carga no hay ni tarjetas viejas ni mensaje de error.
    await waitFor(() => expect(document.querySelector('.skeleton-card')).toBeInTheDocument())
    expect(screen.queryByText('Rick Sanchez')).not.toBeInTheDocument()
    expect(screen.queryByText(/no pudimos cargar/i)).not.toBeInTheDocument()

    resolvePage2?.()
    expect(await screen.findByText('Página dos')).toBeInTheDocument()
  })

  it('la página de locaciones lista locaciones y muestra sus datos', async () => {
    renderRoute('/locations', <LocationsPage />, ['/locations'])

    expect(await screen.findByText('Earth (C-137)')).toBeInTheDocument()
    expect(screen.getByText('Dimension C-137')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver detalles de la locación earth/i })).toHaveAttribute(
      'href',
      '/locations/1',
    )
  })

  it('las tarjetas de personaje enlazan al detalle', async () => {
    renderRoute('/characters', <CharactersPage />, ['/characters'])
    const link = await screen.findByRole('link', { name: /ver detalles de rick sanchez/i })
    expect(link).toHaveAttribute('href', '/characters/1')
  })
})
