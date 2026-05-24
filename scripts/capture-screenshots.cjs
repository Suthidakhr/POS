// Run: node scripts/capture-screenshots.cjs
// Requires: npm install puppeteer (already in root devDependencies)
// Make sure the dev server is running: npm run dev:all

const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')

const BASE_URL = 'http://localhost:5173'
const OUT_DIR = path.join(__dirname, '../docs/screenshots')

;(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })

  // ── 00: Login screen ─────────────────────────────────────────────────────
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' })
  await page.waitForSelector('select', { timeout: 10000 })
  await new Promise(r => setTimeout(r, 300))
  await page.screenshot({ path: path.join(OUT_DIR, '00-login.png') })
  console.log('✓ Login screen → 00-login.png')

  // ── Sign in as Manager ───────────────────────────────────────────────────
  await page.select('select', 'Manager')
  await page.click('input[type="password"]')
  await page.type('input[type="password"]', '1234')
  await page.click('button[type="submit"]')
  await page.waitForSelector('nav', { timeout: 10000 })
  await new Promise(r => setTimeout(r, 600))

  // ── App pages (nav button index matches Manager sidebar order) ───────────
  const appPages = [
    { name: '01-order',    label: 'New Order',       nav: null },
    { name: '02-manage',   label: 'Manage Orders',   nav: 2 },
    { name: '03-menu',     label: 'Menu Management', nav: 3 },
    { name: '04-members',  label: 'Members',         nav: 4 },
    { name: '05-summary',  label: 'Summary',         nav: 5 },
    { name: '06-settings', label: 'Settings',        nav: 6 },
  ]

  for (const p of appPages) {
    if (p.nav) {
      await page.click(`nav button:nth-child(${p.nav})`)
      await new Promise(r => setTimeout(r, 400))
    }
    await page.screenshot({ path: path.join(OUT_DIR, `${p.name}.png`) })
    console.log(`✓ ${p.label} → ${p.name}.png`)
  }

  await browser.close()
  console.log('\nAll screenshots saved to docs/screenshots/')
})()
