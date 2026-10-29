import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
// Orden = cascada: base → utilidades compartidas → estilos de página.
// Las hojas de página van al final para que sus media queries ganen.
import './styles/global.css'
import './components/Layout.css'
import './styles/components.css'
import './pages/CharactersPage.css'
import './pages/LocationsPage.css'
import './pages/DetailPage.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
