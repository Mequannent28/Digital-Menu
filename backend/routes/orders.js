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
    const { tableNumber, customerName, phone, notes, items, subtotal, vat, serviceCharge, grandTotal, estimatedTime, orderType, pickupTime, deliveryAddress, deliveryLat, deliveryLng } = req.body
    if (!items || !items.length) return res.status(400).json({ error: 'Items required' })

    const orderRef = `ORD-${Date.now()}`
    const resolvedOrderType = orderType === 'takeaway' ? 'takeaway' : 'dine_in'

    // Generate sequential pickup number for takeaway (e.g. T-042)
    let pickupNumber = null
    if (resolvedOrderType === 'takeaway') {
      const useDb2 = await checkDb()
      if (useDb2) {
        try {
          const countRes = await query(`SELECT COUNT(*) AS cnt FROM orders WHERE order_type='takeaway' AND CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)`)
          const todayCount = (countRes.recordset[0]?.cnt || 0) + 1
          pickupNumber = `T-${String(todayCount).padStart(3, '0')}`
        } catch (_) { pickupNumber = `T-${Date.now().toString().slice(-3)}` }
      } else {
        pickupNumber = `T-${Date.now().toString().slice(-3)}`
      }
    }

    const useDb = await checkDb()

    if (useDb) {
      // ── SQL Server path ──
      try {
        const orderResult = await query(`
          INSERT INTO orders (order_ref, table_number, customer_name, phone, notes, subtotal, vat, service_charge, grand_total, estimated_time, order_type, pickup_number, pickup_time, delivery_address, delivery_lat, delivery_lng)
          OUTPUT INSERTED.*
          VALUES (@ref, @table, @name, @phone, @notes, @sub, @vat, @svc, @total, @est, @orderType, @pickupNumber, @pickupTime, @deliveryAddress, @deliveryLat, @deliveryLng)
        `, {
          ref:             { type: sql.NVarChar, value: orderRef },
          table:           { type: sql.NVarChar, value: resolvedOrderType === 'takeaway' ? 'Takeaway' : (tableNumber || '') },
          name:            { type: sql.NVarChar, value: customerName || '' },
          phone:           { type: sql.NVarChar, value: phone || '' },
          notes:           { type: sql.NVarChar, value: notes || '' },
          sub:             { type: sql.Float,    value: parseFloat(subtotal) || 0 },
          vat:             { type: sql.Float,    value: parseFloat(vat) || 0 },
          svc:             { type: sql.Float,    value: parseFloat(serviceCharge) || 0 },
          total:           { type: sql.Float,    value: parseFloat(grandTotal) || 0 },
          est:             { type: sql.Int,      value: parseInt(estimatedTime) || 20 },
          orderType:       { type: sql.NVarChar, value: resolvedOrderType },
          pickupNumber:    { type: sql.NVarChar, value: pickupNumber || '' },
          pickupTime:      { type: sql.NVarChar, value: pickupTime || '' },
          deliveryAddress: { type: sql.NVarChar, value: deliveryAddress || '' },
          deliveryLat:     { type: sql.Float,    value: parseFloat(deliveryLat) || null },
          deliveryLng:     { type: sql.Float,    value: parseFloat(deliveryLng) || null },
        })
        const order = orderResult.recordset[0]

        for (const item of items) {
          await query(`
            INSERT INTO order_items (order_id, menu_item_name, price, quantity, modifiers, special_instructions, item_total)
            VALUES (@orderId, @name, @price, @qty, @mods, @instr, @total)
          `, {
            orderId: { type: sql.Int, value: order.id },
            name: { type: sql.NVarChar, value: item.name || '' },
            price: { type: sql.Float, value: parseFloat(item.price) || 0 },
            qty: { type: sql.Int, value: parseInt(item.qty) || 1 },
            mods: { type: sql.NVarChar, value: item.modifiers || '' },
            instr: { type: sql.NVarChar, value: item.specialInstructions || '' },
            total: { type: sql.Float, value: (parseFloat(item.price) || 0) * (parseInt(item.qty) || 1) },
          })
        }

        const itemsResult = await query(`SELECT * FROM order_items WHERE order_id=@id`,
          { id: { type: sql.Int, value: order.id } })

        if (resolvedOrderType === 'dine_in' && tableNumber) {
          try {
            await query(`UPDATE tables SET status = 'occupied' WHERE number = @table`, { table: { type: sql.NVarChar, value: String(tableNumber) } })
          } catch(e) {}
        }

        return res.status(201).json({ ...order, items: itemsResult.recordset })
      } catch (dbErr) {
        console.warn('DB write failed, falling back to local store:', dbErr.message)
        dbAvailable = false
      }
    }

    // ── Local store fallback ──
    const order = local.createOrder({ orderRef, tableNumber: resolvedOrderType === 'takeaway' ? 'Takeaway' : tableNumber, customerName, phone, notes, subtotal, vat, serviceCharge, grandTotal, estimatedTime, orderType: resolvedOrderType, pickupNumber, pickupTime, deliveryAddress, deliveryLat, deliveryLng })
    for (const item of items) {
      local.addOrderItem({ orderId: order.id, name: item.name, price: item.price, qty: item.qty, modifiers: item.modifiers, specialInstructions: item.specialInstructions })
    }
    const saved = local.getOrderById(order.id)
    console.log(`📦 Order ${orderRef} (${resolvedOrderType}) saved to local store (DB unavailable)`)
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
          id: { type: sql.Int, value: parseInt(req.params.id) || 0 },
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
          id: { type: sql.Int, value: parseInt(req.params.id) },
          status: { type: sql.NVarChar, value: status },
        })
        const updatedOrder = result.recordset[0]
        if (updatedOrder) {
          if (updatedOrder.table_number && (status === 'served' || status === 'cancelled')) {
             try {
                const activeCheck = await query(`SELECT COUNT(*) as count FROM orders WHERE table_number=@table AND status IN ('new', 'preparing', 'ready')`, { 
                  table: { type: sql.NVarChar, value: updatedOrder.table_number }
                })
                if (activeCheck.recordset[0].count === 0) {
                  await query(`UPDATE tables SET status = 'available' WHERE number = @table`, { table: { type: sql.NVarChar, value: updatedOrder.table_number } })
                }
             } catch(e) {}
          }
          const io = req.app.get('io')
          if (io) io.emit('order_status_updated', updatedOrder)
          return res.json(updatedOrder)
        }
      } catch (_) { dbAvailable = false }
    }

    // Local store fallback
    const updated = local.updateOrderStatus(parseInt(req.params.id), status)
    if (!updated) return res.status(404).json({ error: 'Order not found' })
    const io = req.app.get('io')
    if (io) io.emit('order_status_updated', updated)
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
