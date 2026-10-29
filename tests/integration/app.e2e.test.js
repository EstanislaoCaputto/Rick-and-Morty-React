/**
 * Smoke test de integración: sirve el build de producción con `vite preview`
 * y navega con un navegador headless real.
 *
 * Uso:
 *   BUILD_INTEGRATION=1 npx vitest run --config vitest.integration.config.js
 *
 * En modo integración se permiten peticiones reales a rickandmortyapi.com.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { spawn, execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const ROOT = process.cwd()
const SHOTS = path.join(ROOT, 'screenshots')
const PORT = 4173
const BASE = `http://127.0.0.1:${PORT}`

let server
let browser

/** Espera hasta que la RM API deje de devolver 429 (límite ~30/min). */
async function waitForApiBudget(timeoutMs = 180000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch('https://rickandmortyapi.com/api/character?page=1')
      if (res.status !== 429) return
    } catch {
      /* red caída: los tests fallarán con un mensaje claro */
      return
    }
    await new Promise((r) => setTimeout(r, 5000))
  }
  throw new Error('La Rick and Morty API siguió limitando consultas (429) durante 3 minutos.')
}

// Ignoramos errores de red de recursos (avatares bloqueados a propósito) y
// el 404 intencional de búsquedas sin resultados; nos interesan errores de JS.
const isRelevantError = (text) =>
  !/ERR_FAILED|Failed to load resource|status of 404/i.test(text)

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      /* sigue esperando */
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`El servidor no respondió en ${url}`)
}

beforeAll(async () => {
  fs.mkdirSync(SHOTS, { recursive: true })
  await waitForApiBudget()
  server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], {
    cwd: ROOT,
    stdio: 'ignore',
    detached: false,
  })
  await waitForServer(BASE)
  browser = await chromium.launch()
}, 120000)

afterAll(async () => {
  await browser?.close()
  if (server) {
    try {
      process.kill(-server.pid)
    } catch {
      server.kill()
    }
  }
})

/**
 * Cada test navega la app real. Para no agotar el límite de consultas de la
 * API pública (~30/min), bloqueamos las imágenes de los avatares: la UI ya
 * cubre su ausencia con SmartImage.
 */
async function newPage({ viewport = { width: 1440, height: 900 }, isMobile = false } = {}) {
  const context = await browser.newContext({ viewport, isMobile })
  await context.route('**/character/avatar/**', (route) => route.abort())
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error' && isRelevantError(msg.text())) errors.push(`console: ${msg.text()}`)
  })
  return { page, errors, context }
}

describe('app en navegador real', () => {
  it('la raíz redirige a /characters y muestra personajes reales', async () => {
    const { page, errors, context } = await newPage()
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })

    await page.waitForURL('**/characters')
    await page.waitForSelector('.character-card', { timeout: 30000 })
    const count = await page.locator('.character-card').count()
    expect(count).toBe(20)

    await page.screenshot({ path: path.join(SHOTS, '01-personajes.png'), fullPage: false })
    expect(errors).toEqual([])
    await context.close()
  }, 90000)

  it('filtra por nombre y por estado', async () => {
    const { page, errors, context } = await newPage()
    await page.goto(`${BASE}/characters`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.character-card')

    await page.fill('#character-search', 'morty')
    await page.waitForURL('**/characters?name=morty', { timeout: 15000 })
    // Esperamos a que terminen los resultados de la búsqueda (el barrido de carga
    // no tiene tarjetas, por eso comparamos el contador con "de N resultados").
    await page.waitForFunction(
      () => /de \d+ resultados/.test(document.querySelector('.result-count')?.textContent ?? ''),
      { timeout: 30000 },
    )
    const names = await page.locator('.character-card__name').allTextContents()
    expect(names.length).toBeGreaterThan(0)
    expect(names.every((name) => /morty/i.test(name))).toBe(true)

    await page.screenshot({ path: path.join(SHOTS, '02-busqueda.png') })

    await page.click('button:has-text("Vivos")')
    await page.waitForURL('**status=alive**', { timeout: 15000 })
    await page.waitForSelector('.character-card')
    expect(await page.locator('button:has-text("Vivos")').getAttribute('aria-pressed')).toBe('true')

    expect(errors).toEqual([])
    await context.close()
  }, 90000)

  it('abre el detalle de un personaje con link a su origen', async () => {
    const { page, errors, context } = await newPage()
    await page.goto(`${BASE}/characters`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.character-card')
    await page.locator('.character-card').first().click()

    await page.waitForURL(/\/characters\/\d+/, { timeout: 15000 })
    await page.waitForSelector('.detail__title', { timeout: 30000 })
    expect(await page.locator('.detail__title').textContent()).toBe('Rick Sanchez')
    await page.waitForSelector('.detail__facts dd a', { timeout: 30000 })
    await page.screenshot({ path: path.join(SHOTS, '03-detalle-personaje.png') })

    expect(errors).toEqual([])
    await context.close()
  }, 90000)

  it('lista locaciones y muestra el detalle con residentes', async () => {
    const { page, errors, context } = await newPage()
    await page.goto(`${BASE}/locations`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.location-card', { timeout: 30000 })
    expect(await page.locator('.location-card').count()).toBe(20)
    await page.screenshot({ path: path.join(SHOTS, '04-locaciones.png') })

    await page.locator('.location-card').first().click()
    await page.waitForURL(/\/locations\/\d+/, { timeout: 15000 })
    await page.waitForSelector('.card-grid .character-card', { timeout: 30000 })
    await page.screenshot({ path: path.join(SHOTS, '05-detalle-locacion.png') })

    expect(errors).toEqual([])
    await context.close()
  }, 90000)

  it('usa la paginación (siguiente / anterior)', async () => {
    const { page, errors, context } = await newPage()
    await page.goto(`${BASE}/characters`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.character-card')

    const prevDisabledInitially = await page.locator('.pagination__button').first().isDisabled()
    expect(prevDisabledInitially).toBe(true)

    await page.click('button[aria-label="Siguiente"]')
    await page.waitForFunction(() => document.querySelector('.pagination__info')?.textContent?.includes('2 /'), {
      timeout: 15000,
    })
    await page.waitForSelector('.character-card')
    await expect.poll(() => page.locator('button[aria-label="Anterior"]').isEnabled(), { timeout: 15000 }).toBe(true)

    await page.click('button[aria-label="Anterior"]')
    await page.waitForFunction(() => document.querySelector('.pagination__info')?.textContent?.trim().startsWith('1 /'), {
      timeout: 15000,
    })
    await page.waitForSelector('.character-card')

    expect(errors).toEqual([])
    await context.close()
  }, 90000)

  it('muestra el estado vacío para búsquedas sin resultados', async () => {
    const { page, errors, context } = await newPage()
    await page.goto(`${BASE}/characters?name=zzzznotacharacter`, { waitUntil: 'domcontentloaded' })

    // El input de búsqueda refleja el filtro leído desde la URL.
    expect(await page.inputValue('#character-search')).toBe('zzzznotacharacter')
    await page.waitForSelector('.empty-state', { timeout: 30000 })
    expect(await page.locator('.empty-state').textContent()).toContain('Sin resultados')

    expect(errors).toEqual([])
    await context.close()
  }, 90000)

  it('muestra 404 estilizado en rutas inexistentes', async () => {
    const { page, errors, context } = await newPage()
    await page.goto(`${BASE}/dimension-desconocida`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.detail-state')
    expect(await page.locator('.detail-state').textContent()).toContain('Página no encontrada')
    await page.screenshot({ path: path.join(SHOTS, '06-404.png') })

    expect(errors).toEqual([])
    await context.close()
  }, 90000)

  it('se ve bien en móvil (390px)', async () => {
    const { page, errors, context } = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true })
    await page.goto(`${BASE}/characters`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.character-card', { timeout: 30000 })
    await page.screenshot({ path: path.join(SHOTS, '07-movil.png'), fullPage: false })

    // No debe haber scroll horizontal.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
    expect(errors).toEqual([])
    await context.close()
  }, 90000)
})

// Manejo del proceso del servidor si Vitest aborta.
process.on('exit', () => {
  try {
    execSync(`pkill -f "vite preview --port ${PORT}"`, { stdio: 'ignore' })
  } catch {
    /* ignorar */
  }
})
