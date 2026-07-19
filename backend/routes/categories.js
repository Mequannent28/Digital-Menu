const router = require('express').Router()
const { sql, query } = require('../db')
const auth = require('../middleware/auth')

// GET /api/categories  (public)
router.get('/', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM categories WHERE is_active=1 ORDER BY sort_order`)
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/categories/all  (admin - includes inactive)
router.get('/all', auth, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM categories ORDER BY sort_order`)
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/categories
router.post('/', auth, async (req, res) => {
  try {
    const { name, name_am, icon, color, sort_order } = req.body
    if (!name) return res.status(400).json({ error: 'Name required' })
    const result = await query(`
      INSERT INTO categories (name, name_am, icon, color, sort_order)
      OUTPUT INSERTED.*
      VALUES (@name, @nameAm, @icon, @color, @sortOrder)
    `, {
      name: { type: sql.NVarChar, value: name },
      nameAm: { type: sql.NVarChar, value: name_am || '' },
      icon: { type: sql.NVarChar, value: icon || '🍽️' },
      color: { type: sql.NVarChar, value: color || '#e85d04' },
      sortOrder: { type: sql.Int, value: sort_order || 0 },
    })
    res.status(201).json(result.recordset[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/categories/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, name_am, icon, color, sort_order, is_active } = req.body
    const result = await query(`
      UPDATE categories SET
        name=@name, name_am=@nameAm, icon=@icon,
        color=@color, sort_order=@sortOrder, is_active=@active
      OUTPUT INSERTED.*
      WHERE id=@id
    `, {
      id: { type: sql.Int, value: parseInt(req.params.id) },
      name: { type: sql.NVarChar, value: name },
      nameAm: { type: sql.NVarChar, value: name_am || '' },
      icon: { type: sql.NVarChar, value: icon || '🍽️' },
      color: { type: sql.NVarChar, value: color || '#e85d04' },
      sortOrder: { type: sql.Int, value: sort_order || 0 },
      active: { type: sql.Bit, value: is_active !== false ? 1 : 0 },
    })
    if (!result.recordset[0]) return res.status(404).json({ error: 'Not found' })
    res.json(result.recordset[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/categories/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await query(`DELETE FROM categories WHERE id=@id`,
      { id: { type: sql.Int, value: parseInt(req.params.id) } })
    res.status(204).end()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
