const { Router } = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { pool } = require('../db')

const router = Router()

// In-memory lockout tracker: staffId → { count, lockedUntil (ms timestamp) }
const failedAttempts = new Map()

router.get('/staff', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name FROM staff WHERE active=true ORDER BY name'
    )
    res.json(rows)
  } catch (e) { next(e) }
})

router.get('/me', (req, res) => {
  const token = req.cookies?.session
  if (!token) return res.status(401).json({ error: 'Not authenticated' })
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET)
    res.json({ id: user.id, name: user.name, role: user.role })
  } catch {
    res.status(401).json({ error: 'Session expired' })
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const { name, pin } = req.body
    if (!name || pin == null) return res.status(400).json({ error: 'Name and PIN required' })

    const { rows } = await pool.query(
      'SELECT * FROM staff WHERE name=$1 AND active=true', [name]
    )
    // Return the same error whether name is wrong or account inactive to avoid enumeration
    if (!rows.length) return res.status(401).json({ error: 'Invalid name or PIN' })

    const staff = rows[0]
    const record = failedAttempts.get(staff.id) || { count: 0, lockedUntil: null }

    if (record.lockedUntil && Date.now() < record.lockedUntil) {
      const mins = Math.ceil((record.lockedUntil - Date.now()) / 60000)
      return res.status(429).json({ error: `Account locked. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.` })
    }

    const valid = await bcrypt.compare(String(pin), staff.pin_hash)
    if (!valid) {
      const count = record.count + 1
      const lockedUntil = count >= 5 ? Date.now() + 15 * 60 * 1000 : null
      failedAttempts.set(staff.id, { count, lockedUntil })
      if (lockedUntil) {
        return res.status(429).json({ error: 'Account locked for 15 minutes after 5 failed attempts.' })
      }
      return res.status(401).json({ error: 'Invalid name or PIN' })
    }

    failedAttempts.delete(staff.id)

    const token = jwt.sign(
      { id: staff.id, name: staff.name, role: staff.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.cookie('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    })

    res.json({ id: staff.id, name: staff.name, role: staff.role })
  } catch (e) { next(e) }
})

router.post('/logout', (req, res) => {
  res.clearCookie('session', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  })
  res.json({ ok: true })
})

module.exports = router
