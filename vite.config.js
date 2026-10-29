import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Con el proxy, el navegador habla con el mismo origen y Vite reenvía a la API:
// evita depender de los headers CORS de la API pública (que a veces faltan).
const proxy = {
  '/rickandmorty-api': {
    target: 'https://rickandmortyapi.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/rickandmorty-api/, '/api'),
  },
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const useProxy = env.VITE_API_BASE_URL === '/rickandmorty-api'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      ...(useProxy ? { proxy } : {}),
    },
    preview: {
      port: 4173,
      // Localmente usamos el proxy aunque la URL compilada sea la absoluta.
      ...(env.VITE_DEV_PROXY === 'true' || useProxy ? { proxy } : {}),
    },
    test: {
      // happy-dom implementa AbortSignal nativo, requerido por React Router en jsdom.
      environment: 'happy-dom',
      globals: true,
      setupFiles: './src/test/setup.js',
      include: ['src/**/*.test.{js,jsx}'],
      css: true,
    },
  }
})
