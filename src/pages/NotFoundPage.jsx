import { Link, useRouteError } from 'react-router-dom'

export default function NotFoundPage() {
  const error = useRouteError()
  const isNotFound = !error || error.status === 404

  return (
    <section className="detail-state">
      <p className="page__eyebrow">{isNotFound ? 'Error 404' : 'Error'}</p>
      <h1>{isNotFound ? 'Página no encontrada' : 'Algo salió mal'}</h1>
      <p>
        {isNotFound
          ? 'Esa dimensión no aparece en nuestro mapa.'
          : 'La página tuvo un problema inesperado. Probá recargar.'}
      </p>
      <Link className="button button--primary" to="/characters">
        Ir a personajes
      </Link>
    </section>
  )
}
