const router = require('express').Router()
const { sql, query } = require('../db')
const auth = require('../middleware/auth')
const local = require('../localStore')

// Helper: try DB query, fall back to local store on error
let dbAvailable = null // null = unknown, true/false = cached

async function checkDb() {
  if (dbAvailable === true) return true
  try {
    await query('SELECT 1')
    dbAvailable = true
    return true
  } catch (_) {
    dbAvailable = false
    return false
  }
}

// Reset db availability every 30s so it retries
setInterval(() => { dbAvailable = null }, 30000)

// ── POST /api/orders  (customer places order) ─────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { tableNumber, customerName, phone, notes, items, subtotal, vat, serviceCharge, grandTotal, estimatedTime } = req.body
    if (!items || !items.length) return res.status(400).json({ error: 'Items required' })

    const orderRef = `ORD-${Date.now()}`
    const useDb = await checkDb()

    if (useDb) {
      // ── SQL Server path ──
      try {
        const orderResult = await query(`
          INSERT INTO orders (order_ref, table_number, customer_name, phone, notes, subtotal, vat, service_charge, grand_total, estimated_time)
          OUTPUT INSERTED.*
          VALUES (@ref, @table, @name, @phone, @notes, @sub, @vat, @svc, @total, @est)
        `, {
          ref:   { type: sql.NVarChar, value: orderRef },
          table: { type: sql.NVarChar, value: tableNumber || '' },
          name:  { type: sql.NVarChar, value: customerName || '' },
          phone: { type: sql.NVarChar, value: phone || '' },
          notes: { type: sql.NVarChar, value: notes || '' },
          sub:   { type: sql.Float,    value: parseFloat(subtotal) || 0 },
          vat:   { type: sql.Float,    value: parseFloat(vat) || 0 },
          svc:   { type: sql.Float,    value: parseFloat(serviceCharge) || 0 },
          total: { type: sql.Float,    value: parseFloat(grandTotal) || 0 },
          est:   { type: sql.Int,      value: parseInt(estimatedTime) || 20 },
        })

        const order = orderResult.recordset[0]

        for (const item of items) {
          await query(`
            INSERT INTO order_items (order_id, menu_item_name, price, quantity, modifiers, special_instructions, item_total)
            VALUES (@orderId, @name, @price, @qty, @mods, @instr, @total)
          `, {
            orderId: { type: sql.Int,      value: order.id },
            name:    { type: sql.NVarChar, value: item.name || '' },
            price:   { type: sql.Float,    value: parseFloat(item.price) || 0 },
            qty:     { type: sql.Int,      value: parseInt(item.qty) || 1 },
            mods:    { type: sql.NVarChar, value: item.modifiers || '' },
            instr:   { type: sql.NVarChar, value: item.specialInstructions || '' },
            total:   { type: sql.Float,    value: (parseFloat(item.price) || 0) * (parseInt(item.qty) || 1) },
          })
        }

        const itemsResult = await query(`SELECT * FROM order_items WHERE order_id=@id`,
          { id: { type: sql.Int, value: order.id } })

        return res.status(201).json({ ...order, items: itemsResult.recordset })
      } catch (dbErr) {
        console.warn('DB write failed, falling back to local store:', dbErr.message)
        dbAvailable = false
      }
    }

    // ── Local store fallback ──
    const order = local.createOrder({ orderRef, tableNumber, customerName, phone, notes, subtotal, vat, serviceCharge, grandTotal, estimatedTime })
    for (const item of items) {
      local.addOrderItem({ orderId: order.id, name: item.name, price: item.price, qty: item.qty, modifiers: item.modifiers, specialInstructions: item.specialInstructions })
    }
    const saved = local.getOrderById(order.id)
    console.log(`📦 Order ${orderRef} saved to local store (DB unavailable)`)
    return res.status(201).json(saved)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/orders  (admin) ──────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query
    const useDb = await checkDb()

    if (useDb) {
      try {
        let sql2 = `SELECT * FROM orders`
        const params = {}
        if (status) {
          sql2 += ` WHERE status=@status`
          params.status = { type: sql.NVarChar, value: status }
        }
        sql2 += ` ORDER BY created_at DESC`
        const ordersResult = await query(sql2, params)
        const orders = ordersResult.recordset

        if (orders.length > 0) {
          const ids = orders.map(o => o.id).join(',')
          const itemsResult = await query(`SELECT * FROM order_items WHERE order_id IN (${ids})`)
          orders.forEach(o => { o.items = itemsResult.recordset.filter(i => i.order_id === o.id) })
        }

        // Merge local orders that may not be in DB yet
        const localOrders = local.getOrders(status)
        const dbRefs = new Set(orders.map(o => o.order_ref))
        const onlyLocal = localOrders.filter(o => !dbRefs.has(o.order_ref))
        return res.json([...onlyLocal, ...orders])
      } catch (dbErr) {
        console.warn('DB read failed, using local store:', dbErr.message)
        dbAvailable = false
      }
    }

    // Local store only
    return res.json(local.getOrders(status))

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/orders/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const useDb = await checkDb()

    if (useDb) {
      try {
        const ordResult = await query(`SELECT * FROM orders WHERE id=@id OR order_ref=@ref`, {
          id:  { type: sql.Int,      value: parseInt(req.params.id) || 0 },
          ref: { type: sql.NVarChar, value: req.params.id },
        })
        if (ordResult.recordset[0]) {
          const order = ordResult.recordset[0]
          const itemsResult = await query(`SELECT * FROM order_items WHERE order_id=@id`,
            { id: { type: sql.Int, value: order.id } })
          return res.json({ ...order, items: itemsResult.recordset })
        }
      } catch (_) { dbAvailable = false }
    }

    // Try local store
    const order = local.getOrderById(req.params.id)
    if (!order) return res.status(404).json({ error: 'Order not found' })
    return res.json(order)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── PUT /api/orders/:id/status  (admin) ───────────────────────────────────────
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['new', 'preparing', 'ready', 'served', 'cancelled']
    if (!validStatuses.includes(status))
      return res.status(400).json({ error: 'Invalid status' })

    const useDb = await checkDb()
    if (useDb) {
      try {
        const result = await query(`
          UPDATE orders SET status=@status, updated_at=GETDATE()
          OUTPUT INSERTED.*
          WHERE id=@id
        `, {
          id:     { type: sql.Int,      value: parseInt(req.params.id) },
          status: { type: sql.NVarChar, value: status },
        })
        if (result.recordset[0]) return res.json(result.recordset[0])
      } catch (_) { dbAvailable = false }
    }

    // Local store fallback
    const updated = local.updateOrderStatus(parseInt(req.params.id), status)
    if (!updated) return res.status(404).json({ error: 'Order not found' })
    return res.json(updated)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── DELETE /api/orders/:id  (admin) ───────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const useDb = await checkDb()

    if (useDb) {
      try {
        await query(`DELETE FROM order_items WHERE order_id=@id`, { id: { type: sql.Int, value: id } })
        await query(`DELETE FROM orders WHERE id=@id`, { id: { type: sql.Int, value: id } })
      } catch (_) { dbAvailable = false }
    }

    // Always clean from local store too
    local.deleteOrder(id)
    return res.status(204).end()

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
