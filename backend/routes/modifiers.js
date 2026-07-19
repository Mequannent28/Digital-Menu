const router = require('express').Router()
const { sql, query } = require('../db')
const auth = require('../middleware/auth')

// GET /api/modifiers  - all groups with their modifiers
router.get('/', auth, async (req, res) => {
  try {
    const groups = await query(`SELECT * FROM modifier_groups ORDER BY id`)
    const mods = await query(`SELECT * FROM modifiers ORDER BY group_id, id`)
    const result = groups.recordset.map(g => ({
      ...g,
      modifiers: mods.recordset.filter(m => m.group_id === g.id)
    }))
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/modifiers/public - for customer menu item detail
router.get('/public', async (req, res) => {
  try {
    const groups = await query(`SELECT * FROM modifier_groups ORDER BY id`)
    const mods = await query(`SELECT * FROM modifiers WHERE is_available=1 ORDER BY group_id, id`)
    const result = groups.recordset.map(g => ({
      ...g,
      modifiers: mods.recordset.filter(m => m.group_id === g.id)
    }))
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/modifiers/groups
router.post('/groups', auth, async (req, res) => {
  try {
    const { name, name_am, required, multi_select, max_select } = req.body
    if (!name) return res.status(400).json({ error: 'Name required' })
    const result = await query(`
      INSERT INTO modifier_groups (name, name_am, required, multi_select, max_select)
      OUTPUT INSERTED.*
      VALUES (@name, @nameAm, @req, @multi, @maxSel)
    `, {
      name: { type: sql.NVarChar, value: name },
      nameAm: { type: sql.NVarChar, value: name_am || '' },
      req: { type: sql.Bit, value: required ? 1 : 0 },
      multi: { type: sql.Bit, value: multi_select ? 1 : 0 },
      maxSel: { type: sql.Int, value: max_select || 1 },
    })
    res.status(201).json({ ...result.recordset[0], modifiers: [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/modifiers/groups/:id
router.put('/groups/:id', auth, async (req, res) => {
  try {
    const { name, name_am, required, multi_select, max_select } = req.body
    const result = await query(`
      UPDATE modifier_groups SET name=@name, name_am=@nameAm, required=@req, multi_select=@multi, max_select=@maxSel
      OUTPUT INSERTED.*
      WHERE id=@id
    `, {
      id: { type: sql.Int, value: parseInt(req.params.id) },
      name: { type: sql.NVarChar, value: name },
      nameAm: { type: sql.NVarChar, value: name_am || '' },
      req: { type: sql.Bit, value: required ? 1 : 0 },
      multi: { type: sql.Bit, value: multi_select ? 1 : 0 },
      maxSel: { type: sql.Int, value: max_select || 1 },
    })
    res.json(result.recordset[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/modifiers/groups/:id
router.delete('/groups/:id', auth, async (req, res) => {
  try {
    await query(`DELETE FROM modifiers WHERE group_id=@id`, { id: { type: sql.Int, value: parseInt(req.params.id) } })
    await query(`DELETE FROM modifier_groups WHERE id=@id`, { id: { type: sql.Int, value: parseInt(req.params.id) } })
    res.status(204).end()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/modifiers/groups/:groupId/items
router.post('/groups/:groupId/items', auth, async (req, res) => {
  try {
    const { name, name_am, price } = req.body
    if (!name) return res.status(400).json({ error: 'Name required' })
    const result = await query(`
      INSERT INTO modifiers (group_id, name, name_am, price)
      OUTPUT INSERTED.*
      VALUES (@gid, @name, @nameAm, @price)
    `, {
      gid: { type: sql.Int, value: parseInt(req.params.groupId) },
      name: { type: sql.NVarChar, value: name },
      nameAm: { type: sql.NVarChar, value: name_am || '' },
      price: { type: sql.Float, value: parseFloat(price) || 0 },
    })
    res.status(201).json(result.recordset[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/modifiers/items/:id
router.put('/items/:id', auth, async (req, res) => {
  try {
    const { name, name_am, price, is_available } = req.body
    const result = await query(`
      UPDATE modifiers SET name=@name, name_am=@nameAm, price=@price, is_available=@avail
      OUTPUT INSERTED.*
      WHERE id=@id
    `, {
      id: { type: sql.Int, value: parseInt(req.params.id) },
      name: { type: sql.NVarChar, value: name },
      nameAm: { type: sql.NVarChar, value: name_am || '' },
      price: { type: sql.Float, value: parseFloat(price) || 0 },
      avail: { type: sql.Bit, value: is_available !== false ? 1 : 0 },
    })
    res.json(result.recordset[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/modifiers/items/:id
router.delete('/items/:id', auth, async (req, res) => {
  try {
    await query(`DELETE FROM modifiers WHERE id=@id`, { id: { type: sql.Int, value: parseInt(req.params.id) } })
    res.status(204).end()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
