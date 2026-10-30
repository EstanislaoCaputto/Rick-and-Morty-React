/** Etiquetas en español reutilizadas por las tarjetas y detalles. */

export const joinClasses = (...classes) => classes.filter(Boolean).join(' ')

export const STATUS_LABELS_ES = {
  Alive: 'Vivo',
  Dead: 'Muerto',
  unknown: 'Desconocido',
}

export const GENDER_LABELS_ES = {
  Female: 'Femenino',
  Male: 'Masculino',
  Genderless: 'Sin género',
  unknown: 'Desconocido',
}

export const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'alive', label: 'Vivos' },
  { value: 'dead', label: 'Muertos' },
  { value: 'unknown', label: 'Desconocidos' },
]
