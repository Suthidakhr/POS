const { Router } = require('express')
const { pool, genId, mapMenuItem } = require('../db')

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM menu_items ORDER BY category, name')
    res.json(rows.map(mapMenuItem))
  } catch (e) { next(e) }
})

router.post('/', async (req, res, next) => {
  try {
    const { name, category, price, description, emoji, available } = req.body
    const { rows } = await pool.query(
      'INSERT INTO menu_items (id,name,category,price,description,emoji,available) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [genId(), name, category, price, description, emoji, available]
    )
    res.json(mapMenuItem(rows[0]))
  } catch (e) { next(e) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const { name, category, price, description, emoji, available } = req.body
    const { rows } = await pool.query(
      'UPDATE menu_items SET name=$1,category=$2,price=$3,description=$4,emoji=$5,available=$6 WHERE id=$7 RETURNING *',
      [name, category, price, description, emoji, available, req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(mapMenuItem(rows[0]))
  } catch (e) { next(e) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM menu_items WHERE id=$1', [req.params.id])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

module.exports = router
