import { useEffect, useState } from 'react'

/** Devuelve `value` solo después de que deje de cambiar durante `delay` ms. */
export function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}
