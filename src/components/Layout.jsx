import { Link, NavLink, Outlet } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/characters', label: 'Personajes' },
  { to: '/locations', label: 'Locaciones' },
]

export default function Layout() {
  return (
    <div className="layout">
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>

      <header className="header">
        <div className="header__inner">
          <Link to="/characters" className="brand" aria-label="Rick and Morty — inicio">
            <span className="brand__orb" aria-hidden="true" />
            <span className="brand__text">
              Rick <span className="brand__amp">&amp;</span> Morty
            </span>
          </Link>

          <nav className="nav" aria-label="Navegación principal">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav__link${isActive ? ' nav__link--active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main id="main" className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <p>
          Datos de{' '}
          <a href="https://rickandmortyapi.com" target="_blank" rel="noreferrer">
            rickandmortyapi.com
          </a>
          . Proyecto de práctica con React y Vite.
        </p>
      </footer>
    </div>
  )
}
