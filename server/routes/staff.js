const { Router } = require('express')
const bcrypt = require('bcrypt')
const { pool, genId } = require('../db')

const router = Router()

function requireManager(req, res, next) {
  if (req.user?.role !== 'manager') return res.status(403).json({ error: 'Manager access required' })
  next()
}

router.use(requireManager)

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, role, active, created_at FROM staff ORDER BY created_at'
    )
    res.json(rows.map(r => ({ id: r.id, name: r.name, role: r.role, active: r.active, createdAt: r.created_at })))
  } catch (e) { next(e) }
})

router.post('/', async (req, res, next) => {
  try {
    const { name, role, pin } = req.body
    if (!name || !role || !pin) return res.status(400).json({ error: 'Name, role, and PIN required' })
    if (!['cashier', 'manager'].includes(role)) return res.status(400).json({ error: 'Invalid role' })
    if (String(pin).length < 4) return res.status(400).json({ error: 'PIN must be 4 digits' })

    const pin_hash = await bcrypt.hash(String(pin), 10)
    const { rows } = await pool.query(
      'INSERT INTO staff (id, name, pin_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, role, active, created_at',
      [genId(), name, pin_hash, role]
    )
    const r = rows[0]
    res.json({ id: r.id, name: r.name, role: r.role, active: r.active, createdAt: r.created_at })
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'A staff member with that name already exists' })
    next(e)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const { name, role, pin, active } = req.body
    const updates = []
    const values = []
    let idx = 1

    if (name != null) { updates.push(`name=$${idx++}`); values.push(name) }
    if (role != null) {
      if (!['cashier', 'manager'].includes(role)) return res.status(400).json({ error: 'Invalid role' })
      updates.push(`role=$${idx++}`); values.push(role)
    }
    if (pin != null) {
      const pin_hash = await bcrypt.hash(String(pin), 10)
      updates.push(`pin_hash=$${idx++}`); values.push(pin_hash)
    }
    if (active != null) { updates.push(`active=$${idx++}`); values.push(active) }

    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' })

    values.push(req.params.id)
    const { rows } = await pool.query(
      `UPDATE staff SET ${updates.join(',')} WHERE id=$${idx} RETURNING id, name, role, active, created_at`,
      values
    )
    if (!rows.length) return res.status(404).json({ error: 'Staff member not found' })
    const r = rows[0]
    res.json({ id: r.id, name: r.name, role: r.role, active: r.active, createdAt: r.created_at })
  } catch (e) { next(e) }
})

module.exports = router
