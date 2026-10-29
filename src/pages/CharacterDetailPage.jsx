import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { charactersApi, locationsApi } from '../api/rickAndMorty'
import { useAsyncResource } from '../hooks/useAsyncResource'
import { SmartImage, StatusBadge } from '../components/ui'
import { RetryButton } from '../components/ui/RetryButton'
import { GENDER_LABELS_ES, STATUS_LABELS_ES } from '../utils/labels'

export default function CharacterDetailPage() {
  const { id } = useParams()

  const { data: character, status, retry } = useAsyncResource(
    useCallback((opts) => charactersApi.getById(id, opts), [id]),
    [id],
  )

  // Buscamos el id de la locación de origen para poder enlazarla.
  const origin = character?.origin
  const { data: originLocation } = useAsyncResource(
    useCallback(
      async (opts) => {
        if (!origin || origin === 'unknown') return null
        const response = await locationsApi.list({ name: origin, ...opts })
        return response.results?.find((place) => place.name === origin) ?? null
      },
      [origin],
    ),
    [origin],
  )
  const originId = originLocation?.id ?? null

  if (status === 'loading') {
    return (
      <section className="detail detail--loading" aria-busy="true">
        <div className="skeleton detail__skeleton-image" />
        <div className="detail__skeleton-text">
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--text" />
          <div className="skeleton skeleton--text skeleton--short" />
        </div>
      </section>
    )
  }

  if (status === 'not-found') {
    return (
      <section className="detail-state">
        <h1>Personaje no encontrado</h1>
        <p>Ese personaje no existe en el multiverso.</p>
        <Link className="button button--primary" to="/characters">
          Volver a personajes
        </Link>
      </section>
    )
  }

  if (status === 'error' || !character) {
    return (
      <section className="detail-state">
        <h1>Algo salió mal</h1>
        <p>No pudimos cargar el personaje. Intentá de nuevo en unos segundos.</p>
        <RetryButton onRetry={retry} />
        <Link className="button" to="/characters">
          Volver a personajes
        </Link>
      </section>
    )
  }

  return (
    <article className="detail">
      <Link to="/characters" className="detail__back">
        ← Personajes
      </Link>

      <div className="detail__hero">
        <SmartImage
          src={character.image}
          alt={`Retrato de ${character.name}`}
          className="detail__image"
        />
        <div className="detail__intro">
          <StatusBadge
            status={character.status}
            label={STATUS_LABELS_ES[character.status] ?? character.status}
          />
          <h1 className="detail__title">{character.name}</h1>
          <p className="detail__subtitle">
            {character.species}
            {character.type ? ` · ${character.type}` : ''}
          </p>

          <dl className="detail__facts">
            <div>
              <dt>Género</dt>
              <dd>{GENDER_LABELS_ES[character.gender] ?? character.gender}</dd>
            </div>
            <div>
              <dt>Origen</dt>
              <dd>
                {character.origin}
                {originId && (
                  <>
                    {' '}
                    · <Link to={`/locations/${originId}`}>Ver locación</Link>
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt>Última ubicación</dt>
              <dd>{character.location.name}</dd>
            </div>
            <div>
              <dt>Apariciones</dt>
              <dd>{character.episodeCount} episodios</dd>
            </div>
          </dl>
        </div>
      </div>
    </article>
  )
}
