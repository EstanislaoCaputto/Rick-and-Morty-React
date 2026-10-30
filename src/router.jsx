import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import CharactersPage from './pages/CharactersPage'
import CharacterDetailPage from './pages/CharacterDetailPage'
import LocationsPage from './pages/LocationsPage'
import LocationDetailPage from './pages/LocationDetailPage'
import NotFoundPage from './pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <Navigate to="/characters" replace /> },
      { path: 'characters', element: <CharactersPage /> },
      { path: 'characters/:id', element: <CharacterDetailPage /> },
      { path: 'locations', element: <LocationsPage /> },
      { path: 'locations/:id', element: <LocationDetailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
