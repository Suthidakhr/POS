require('dotenv').config()
const express = require('express')
const cookieParser = require('cookie-parser')
const { initDB } = require('./db')
const requireAuth = require('./middleware/auth')

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is required — set it before starting the server')
  process.exit(1)
}

const app = express()
app.use(express.json())
app.use(cookieParser())

// Public auth routes — no session cookie required
app.use('/api/auth', require('./routes/auth'))

// All other /api routes require a valid session
app.use('/api', requireAuth)
app.use('/api/menu',    require('./routes/menu'))
app.use('/api/members', require('./routes/members'))
app.use('/api/orders',  require('./routes/orders'))
app.use('/api/staff',   require('./routes/staff'))

app.use((err, req, res, _next) => {
  console.error(err.message)
  res.status(500).json({ error: err.message })
})

const PORT = process.env.PORT || 3001
initDB()
  .then(() => app.listen(PORT, () => console.log(`✓ API server → http://localhost:${PORT}`)))
  .catch(err => { console.error('DB init failed:', err.message); process.exit(1) })
