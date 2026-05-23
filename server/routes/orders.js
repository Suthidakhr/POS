const { Router } = require('express')
const { pool, genId, mapOrder } = require('../db')

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const { rows: orderRows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC')
    const { rows: itemRows } = await pool.query('SELECT * FROM order_items')
    res.json(orderRows.map(o => mapOrder(o, itemRows)))
  } catch (e) { next(e) }
})

router.post('/', async (req, res, next) => {
  const client = await pool.connect()
  try {
    const { items, tableNumber, customerName, discount, memberDiscount, tax, total, paymentMethod, memberId } = req.body
    const id = genId()

    await client.query('BEGIN')

    const { rows } = await client.query(
      `INSERT INTO orders (id,table_number,customer_name,discount,member_discount,tax,total,payment_method,member_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [id, tableNumber || null, customerName || null, discount, memberDiscount, tax, total, paymentMethod, memberId || null]
    )
    const order = rows[0]

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id,menu_item_id,item_name,item_price,item_emoji,item_category,quantity,note)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, item.menuItem.id, item.menuItem.name, item.menuItem.price, item.menuItem.emoji, item.menuItem.category, item.quantity, item.note || '']
      )
    }

    if (memberId) {
      await client.query(
        'UPDATE members SET total_orders=total_orders+1, total_spent=total_spent+$1 WHERE id=$2',
        [total, memberId]
      )
    }

    await client.query('COMMIT')
    res.json(mapOrder(order, items.map(i => ({
      ...i,
      order_id: id,
      menu_item_id: i.menuItem.id,
      item_name: i.menuItem.name,
      item_price: i.menuItem.price,
      item_emoji: i.menuItem.emoji,
      item_category: i.menuItem.category,
    }))))
  } catch (e) {
    await client.query('ROLLBACK')
    next(e)
  } finally {
    client.release()
  }
})

router.put('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body
    const completedAt = status === 'completed' ? new Date() : null
    const { rows } = await pool.query(
      'UPDATE orders SET status=$1,completed_at=$2 WHERE id=$3 RETURNING *',
      [status, completedAt, req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true, status: rows[0].status })
  } catch (e) { next(e) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM orders WHERE id=$1', [req.params.id])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

module.exports = router
