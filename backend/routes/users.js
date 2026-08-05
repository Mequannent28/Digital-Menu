const router = require('express').Router()
const bcrypt = require('bcryptjs')
const { sql, query } = require('../db')
const auth = require('../middleware/auth')

// GET /api/users/waiters — PUBLIC, no auth — returns only active waiters for customer UI
router.get('/waiters', async (req, res) => {
  try {
    const r = await query(`
      SELECT id, name, role FROM users
      WHERE role = 'waiter' AND is_active = 1
      ORDER BY name
    `)
    res.json(r.recordset)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/', auth, async (req, res) => {
  try {
    const r = await query(`SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at`)
    res.json(r.recordset)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/', auth, async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    const hash = await bcrypt.hash(password, 10)
    const r = await query(`
      INSERT INTO users (name, email, password, role)
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role, INSERTED.is_active, INSERTED.created_at
      VALUES (@name, @email, @pass, @role)
    `, {
      name: { type: sql.NVarChar, value: name || '' },
      email: { type: sql.NVarChar, value: email },
      pass: { type: sql.NVarChar, value: hash },
      role: { type: sql.NVarChar, value: (role || 'waiter').toLowerCase() },
    })
    res.status(201).json(r.recordset[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, email, role, is_active, password } = req.body
    let updatePass = ''
    const params = {
      id: { type: sql.Int, value: parseInt(req.params.id) },
      name: { type: sql.NVarChar, value: name },
      email: { type: sql.NVarChar, value: email },
      role: { type: sql.NVarChar, value: (role || '').toLowerCase() },
      active: { type: sql.Bit, value: is_active ? 1 : 0 },
    }
    if (password) {
      const hash = await bcrypt.hash(password, 10)
      updatePass = ', password=@pass'
      params.pass = { type: sql.NVarChar, value: hash }
    }
    const r = await query(`
      UPDATE users SET name=@name, email=@email, role=@role, is_active=@active${updatePass}
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role, INSERTED.is_active
      WHERE id=@id
    `, params)
    res.json(r.recordset[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    await query(`DELETE FROM users WHERE id=@id`, { id: { type: sql.Int, value: parseInt(req.params.id) } })
    res.status(204).end()
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
