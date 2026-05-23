const { Router } = require('express')
const { pool, genId, mapMember } = require('../db')

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM members ORDER BY joined_at DESC')
    res.json(rows.map(mapMember))
  } catch (e) { next(e) }
})

router.get('/phone/:phone', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM members WHERE phone=$1', [req.params.phone])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(mapMember(rows[0]))
  } catch (e) { next(e) }
})

router.post('/', async (req, res, next) => {
  try {
    const { name, phone, email } = req.body
    const { rows } = await pool.query(
      'INSERT INTO members (id,name,phone,email) VALUES ($1,$2,$3,$4) RETURNING *',
      [genId(), name, phone, email || null]
    )
    res.json(mapMember(rows[0]))
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'Phone already registered' })
    next(e)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM members WHERE id=$1', [req.params.id])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

module.exports = router
