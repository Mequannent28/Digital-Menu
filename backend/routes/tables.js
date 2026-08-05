const router = require('express').Router()
const { sql, query } = require('../db')
const auth = require('../middleware/auth')

router.get('/', async (req, res) => {
  try {
    const r = await query(`SELECT * FROM tables ORDER BY number`)
    res.json(r.recordset)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/', auth, async (req, res) => {
  try {
    const { number, capacity, status } = req.body
    if (!number) return res.status(400).json({ error: 'Table number required' })
    const r = await query(`
      INSERT INTO tables (number, capacity, status)
      OUTPUT INSERTED.*
      VALUES (@num, @cap, @status)
    `, {
      num: { type: sql.NVarChar, value: number },
      cap: { type: sql.Int, value: parseInt(capacity) || 4 },
      status: { type: sql.NVarChar, value: status || 'available' },
    })
    res.status(201).json(r.recordset[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/:id', auth, async (req, res) => {
  try {
    const { number, capacity, status } = req.body
    const r = await query(`
      UPDATE tables SET number=@num, capacity=@cap, status=@status
      OUTPUT INSERTED.*
      WHERE id=@id
    `, {
      id: { type: sql.Int, value: parseInt(req.params.id) },
      num: { type: sql.NVarChar, value: number },
      cap: { type: sql.Int, value: parseInt(capacity) || 4 },
      status: { type: sql.NVarChar, value: status || 'available' },
    })
    res.json(r.recordset[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    await query(`DELETE FROM tables WHERE id=@id`, { id: { type: sql.Int, value: parseInt(req.params.id) } })
    res.status(204).end()
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
