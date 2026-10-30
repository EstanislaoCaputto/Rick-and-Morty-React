import { Link } from 'react-router-dom'
import { SmartImage, StatusBadge } from '../ui'
import { STATUS_LABELS_ES, joinClasses } from '../../utils/labels'

export function CharacterCard({ character, feature = false }) {
  const { id, name, image, status, species, location } = character

  return (
    <Link
      to={`/characters/${id}`}
      className={joinClasses('character-card', feature && 'character-card--feature')}
      aria-label={`Ver detalles de ${name}`}
    >
      <div className="character-card__media">
        <SmartImage src={image} alt={`Retrato de ${name}`} className="character-card__image" />
        <span className="character-card__status">
          <StatusBadge status={status} label={STATUS_LABELS_ES[status] ?? status} />
        </span>
      </div>
      <div className="character-card__body">
        <h3 className="character-card__name">{name}</h3>
        <p className="character-card__meta">
          {species}
          {location?.name && location.name !== 'unknown' && (
            <>
              <span aria-hidden="true"> · </span>
              {location.name}
            </>
          )}
        </p>
      </div>
    </Link>
  )
}

export function LocationCard({ location }) {
  const { id, name, type, dimension, residentCount } = location

  return (
    <Link
      to={`/locations/${id}`}
      className="location-card"
      aria-label={`Ver detalles de la locación ${name}`}
    >
      <div className="location-card__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" />
        </svg>
      </div>
      <div className="location-card__content">
        <h3 className="location-card__name">{name}</h3>
        <dl className="location-card__facts">
          <div>
            <dt>Tipo</dt>
            <dd>{type}</dd>
          </div>
          <div>
            <dt>Dimensión</dt>
            <dd>{dimension}</dd>
          </div>
          <div>
            <dt>Residentes</dt>
            <dd>{residentCount}</dd>
          </div>
        </dl>
      </div>
      <span className="location-card__arrow" aria-hidden="true">→</span>
    </Link>
  )
}
