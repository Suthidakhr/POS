// Run: node scripts/capture-screenshots.js
// Requires: npm install puppeteer (in scripts/ or root)
// Make sure the dev server is running: npm run dev

const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')

const BASE_URL = 'http://localhost:5173'
const OUT_DIR = path.join(__dirname, '../docs/screenshots')

const pages = [
  { name: '01-order',   title: 'New Order',      nav: null },
  { name: '02-manage',  title: 'Manage Orders',  nav: 2 },
  { name: '03-menu',    title: 'Menu Management',nav: 3 },
  { name: '04-members', title: 'Members',        nav: 4 },
  { name: '05-summary', title: 'Summary',        nav: 5 },
]

;(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })

  await page.goto(BASE_URL, { waitUntil: 'networkidle0' })
  await new Promise(r => setTimeout(r, 500))

  for (const p of pages) {
    if (p.nav) {
      await page.click(`nav button:nth-child(${p.nav})`)
      await new Promise(r => setTimeout(r, 300))
    }
    const out = path.join(OUT_DIR, `${p.name}.png`)
    await page.screenshot({ path: out, fullPage: false })
    console.log(`✓ ${p.title} → ${out}`)
  }

  await browser.close()
  console.log('\nAll screenshots saved to docs/screenshots/')
})()
