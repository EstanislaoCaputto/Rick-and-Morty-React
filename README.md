# Rick & Morty · Explorador

Aplicación de práctica para consumir APIs REST con React. Lista **personajes** y **locaciones** del universo de Rick and Morty usando la [Rick and Morty API](https://rickandmortyapi.com), con página de detalle para cada uno.

Migrada de Create React App a **Vite**, sin Bootstrap (estilos propios en CSS con tema oscuro).

## Stack

| Herramienta | Rol |
| --- | --- |
| [React 19](https://react.dev) | UI, hooks, `useSearchParams` |
| [Vite 7](https://vite.dev) | Dev server, build, HMR |
| [React Router 7](https://reactrouter.com) | Rutas del navegador (`createBrowserRouter`) |
| [Vitest](https://vitest.dev) + Testing Library | Tests unitarios e integración |
| ESLint 9 (flat config) | Lint con `eslint-plugin-react-hooks` |

## Scripts

```bash
npm install      # instalar dependencias
npm run dev      # servidor de desarrollo → http://localhost:5173
npm run build    # build de producción en dist/
npm run preview  # previsualizar el build
npm test         # tests unitarios e integración (Vitest + happy-dom)
npm run lint     # ESLint
```

### Tests E2E opcionales (navegador real)

Los tests de `tests/integration/` levantan `vite preview` y navegan con Chromium
vía [Playwright](https://playwright.dev). No forman parte de `npm test`:

```bash
npm i -D playwright
npx playwright install chromium
npm run test:e2e
```

> ⚠️ Usan la API pública real. La API limita a ~30 pedidos por minuto (responde
> `429`); el suite espera el límite automáticamente antes de arrancar.

## Estructura

```
src/
├── main.jsx                 # entrada: router + hojas de estilo (orden de cascada)
├── router.jsx               # definición de rutas
├── api/
│   └── rickAndMorty.js      # cliente de la API, normalizadores y ApiError (404/429)
├── hooks/
│   ├── usePaginatedResource.js  # paginación + filtros + cancelación + reintento
│   ├── useAsyncResource.js      # recurso individual (detalles)
│   └── useDebouncedValue.js     # debounce del buscador
├── components/
│   ├── Layout.jsx           # header sticky, nav y footer
│   ├── cards/Cards.jsx      # CharacterCard y LocationCard
│   └── ui/                  # SmartImage, StatusBadge, EmptyState, skeletons…
├── pages/                   # CharactersPage, CharacterDetailPage, LocationsPage, …
├── styles/                  # global.css (tokens + reset) y components.css
└── utils/labels.js          # etiquetas en español y helpers
```

## Rutas

| Ruta | Página |
| --- | --- |
| `/` | Redirige a `/characters` |
| `/characters` | Listado de personajes (búsqueda + filtro por estado + paginación) |
| `/characters/:id` | Detalle del personaje, con link a su locación de origen |
| `/locations` | Listado de locaciones (búsqueda + paginación) |
| `/locations/:id` | Detalle de la locación con sus residentes |
| `*` | Página 404 estilizada |

Los filtros viven en la URL (`?name=rick&status=alive`), así que se pueden compartir o recargar sin perder el estado.

En el detalle de una locación, los **residentes** se paginan de a 24 (una locación como
Earth (Replacement Dimension) tiene 230): se piden solo los ids de la página visible
(`/character/1,2,3`) y la última página trae los que falten.

## Configuración de la API

Por defecto la app llama directo a `https://rickandmortyapi.com/api`. La API pública a
veces responde de forma degradada (sin headers CORS o con respuestas vacías), y el
navegador lo reporta como error de red. Para evitarlo:

- El cliente **reintenta** automáticamente esas respuestas (2 reintentos) y distingue
  fallos de red, 404 ("sin resultados") y 429 (límite de consultas).
- Para ver la app localmente sin esos bloqueos, usá el **proxy de Vite** (mismo origen):

  ```bash
  printf 'VITE_API_BASE_URL=/rickandmorty-api\n' > .env.development.local
  npm run dev
  ```

  En producción conviene un proxy equivalente (p. ej. un Worker o un rewrite del
  proveedor de hosting) apuntando a `https://rickandmortyapi.com/api`.

## Decisiones de diseño

- **La URL es la fuente de verdad de los filtros.** Volver atrás o compartir un enlace reproduce la misma vista.
- **Sin `Context` global.** La versión anterior guardaba el listado, la selección y la paginación en un `UserContext`. El estado del listado se movió a `usePaginatedResource` (cercano a quien lo usa) y la "selección" pasó a ser una ruta de detalle (`/characters/:id`), que es enlazable y recargable.
- **Peticiones cancelables.** Cada fetch usa `AbortController` y descarta resultados obsoletos, evitando condiciones de carrera al cambiar de página o de filtro.
- **Errores explícitos.** `ApiError` distingue "sin resultados" (404 de esta API), limitación de consultas (429) y fallos de red, con botón de reintento que repite la petición.
- **Normalización.** Las respuestas crudas de la API se traducen al formato que usa la UI (`normalizeCharacter` / `normalizeLocation`).
- **Accesibilidad.** Skip link, foco visible, `aria-pressed` en filtros, `aria-live` en contadores, labels reales y `alt` descriptivos.
- **Sin Bootstrap ni CDN.** Variables CSS (`--accent`, `--surface`…), grid responsive y respeto por `prefers-reduced-motion`.
- **Login eliminado.** El formulario de login era un placeholder sin backend; se quitó junto con sus rutas (`/login`, `/contact`).
