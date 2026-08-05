const router = require('express').Router()

let waiterCalls = []
let nextCallId = 1

// POST /api/waiter-calls (Customer calls waiter)
router.post('/', (req, res) => {
  const { tableNumber, reason, targetWaiterId, targetWaiterName } = req.body
  const call = {
    id: nextCallId++,
    tableNumber:      String(tableNumber || '1'),
    reason:           reason || 'Assistance requested',
    status:           'pending',
    assignedTo:       targetWaiterId   || null,
    waiterName:       targetWaiterName || null,
    targetWaiterId:   targetWaiterId   || null,
    targetWaiterName: targetWaiterName || null,
    createdAt:        new Date().toISOString(),
  }
  waiterCalls.unshift(call)
  if (waiterCalls.length > 100) waiterCalls = waiterCalls.slice(0, 100)

  const io = req.app.get('io')
  if (io) {
    // Broadcast to all admins
    io.emit('waiter_call_created', call)
    // Also emit targeted event so the specific waiter's device can filter
    if (targetWaiterId) {
      io.emit(`waiter_call_for_${targetWaiterId}`, call)
    }
    console.log(`🔔 Waiter call from Table ${call.tableNumber} → ${targetWaiterName || 'any waiter'}: "${call.reason}"`)
  }

  res.status(201).json(call)
})

// GET /api/waiter-calls (Admin/Waiter reads calls)
router.get('/', (req, res) => {
  res.json(waiterCalls)
})

// PUT /api/waiter-calls/:id/resolve (Admin/Waiter resolves call)
router.put('/:id/resolve', (req, res) => {
  const callId = parseInt(req.params.id)
  const call = waiterCalls.find(c => c.id === callId)
  if (call) {
    call.status = 'resolved'
    call.resolvedAt = new Date().toISOString()

    const io = req.app.get('io')
    if (io) {
      io.emit('waiter_call_resolved', call)
    }
    return res.json(call)
  }
  res.status(404).json({ error: 'Call not found' })
})

// PUT /api/waiter-calls/:id/assign (Admin assigns call to waiter)
router.put('/:id/assign', (req, res) => {
  const callId = parseInt(req.params.id)
  const { waiterId, waiterName } = req.body
  const call = waiterCalls.find(c => c.id === callId)
  
  if (call) {
    call.assignedTo = waiterId
    call.waiterName = waiterName
    call.assignedAt = new Date().toISOString()

    const io = req.app.get('io')
    if (io) {
      io.emit('waiter_call_assigned', call)
    }
    return res.json(call)
  }
  res.status(404).json({ error: 'Call not found' })
})

// DELETE /api/waiter-calls (Admin clears all)
router.delete('/', (req, res) => {
  waiterCalls = []
  const io = req.app.get('io')
  if (io) io.emit('waiter_calls_cleared')
  res.status(204).end()
})

module.exports = router
