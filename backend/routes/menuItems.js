const router = require('express').Router()
const { sql, query } = require('../db')
const auth = require('../middleware/auth')

const cols = `id, category_id, name, name_am, description, description_am,
  price, image_url, prep_time, is_spicy, is_vegetarian, is_available,
  is_featured, is_popular, is_best_seller, chef_recommended,
  rating, review_count, calories, discount, allergens`

// GET /api/menu-items  (public - available only)
router.get('/', async (req, res) => {
  try {
    const { category_id } = req.query
    let sql2 = `SELECT ${cols} FROM menu_items WHERE is_available=1`
    const params = {}
    if (category_id) {
      sql2 += ` AND category_id=@catId`
      params.catId = { type: sql.Int, value: parseInt(category_id) }
    }
    sql2 += ` ORDER BY is_featured DESC, is_best_seller DESC, name`
    const result = await query(sql2, params)
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/menu-items/all  (admin - all items)
router.get('/all', auth, async (req, res) => {
  try {
    const result = await query(`SELECT ${cols} FROM menu_items ORDER BY category_id, name`)
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/menu-items/featured
router.get('/featured', async (req, res) => {
  try {
    const result = await query(`SELECT ${cols} FROM menu_items WHERE is_featured=1 AND is_available=1`)
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/menu-items/search?q=
router.get('/search', async (req, res) => {
  try {
    const q = `%${req.query.q || ''}%`
    const result = await query(
      `SELECT ${cols} FROM menu_items WHERE is_available=1 AND (name LIKE @q OR name_am LIKE @q OR description LIKE @q)`,
      { q: { type: sql.NVarChar, value: q } }
    )
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/menu-items/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query(`SELECT ${cols} FROM menu_items WHERE id=@id`,
      { id: { type: sql.Int, value: parseInt(req.params.id) } })
    if (!result.recordset[0]) return res.status(404).json({ error: 'Not found' })
    res.json(result.recordset[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/menu-items
router.post('/', auth, async (req, res) => {
  try {
    const d = req.body
    if (!d.name || !d.price || !d.category_id)
      return res.status(400).json({ error: 'Name, price and category required' })
    const result = await query(`
      INSERT INTO menu_items (category_id,name,name_am,description,description_am,price,image_url,
        prep_time,is_spicy,is_vegetarian,is_available,is_featured,is_popular,is_best_seller,
        chef_recommended,rating,calories,discount,allergens)
      OUTPUT INSERTED.*
      VALUES (@catId,@name,@nameAm,@desc,@descAm,@price,@img,
        @prep,@spicy,@veg,@avail,@feat,@pop,@best,@chef,@rating,@cal,@disc,@alg)
    `, {
      catId: { type: sql.Int, value: parseInt(d.category_id) },
      name: { type: sql.NVarChar, value: d.name },
      nameAm: { type: sql.NVarChar, value: d.name_am || '' },
      desc: { type: sql.NVarChar, value: d.description || '' },
      descAm: { type: sql.NVarChar, value: d.description_am || '' },
      price: { type: sql.Float, value: parseFloat(d.price) },
      img: { type: sql.NVarChar, value: d.image_url || '' },
      prep: { type: sql.Int, value: d.prep_time || 15 },
      spicy: { type: sql.Bit, value: d.is_spicy ? 1 : 0 },
      veg: { type: sql.Bit, value: d.is_vegetarian ? 1 : 0 },
      avail: { type: sql.Bit, value: d.is_available !== false ? 1 : 0 },
      feat: { type: sql.Bit, value: d.is_featured ? 1 : 0 },
      pop: { type: sql.Bit, value: d.is_popular ? 1 : 0 },
      best: { type: sql.Bit, value: d.is_best_seller ? 1 : 0 },
      chef: { type: sql.Bit, value: d.chef_recommended ? 1 : 0 },
      rating: { type: sql.Float, value: parseFloat(d.rating) || 4.5 },
      cal: { type: sql.Int, value: d.calories ? parseInt(d.calories) : null },
      disc: { type: sql.Float, value: parseFloat(d.discount) || 0 },
      alg: { type: sql.NVarChar, value: Array.isArray(d.allergens) ? d.allergens.join(',') : d.allergens || '' },
    })
    res.status(201).json(result.recordset[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/menu-items/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const d = req.body
    const result = await query(`
      UPDATE menu_items SET
        category_id=@catId, name=@name, name_am=@nameAm, description=@desc,
        description_am=@descAm, price=@price, image_url=@img, prep_time=@prep,
        is_spicy=@spicy, is_vegetarian=@veg, is_available=@avail,
        is_featured=@feat, is_popular=@pop, is_best_seller=@best,
        chef_recommended=@chef, rating=@rating, calories=@cal,
        discount=@disc, allergens=@alg
      OUTPUT INSERTED.*
      WHERE id=@id
    `, {
      id: { type: sql.Int, value: parseInt(req.params.id) },
      catId: { type: sql.Int, value: parseInt(d.category_id) },
      name: { type: sql.NVarChar, value: d.name },
      nameAm: { type: sql.NVarChar, value: d.name_am || '' },
      desc: { type: sql.NVarChar, value: d.description || '' },
      descAm: { type: sql.NVarChar, value: d.description_am || '' },
      price: { type: sql.Float, value: parseFloat(d.price) },
      img: { type: sql.NVarChar, value: d.image_url || '' },
      prep: { type: sql.Int, value: d.prep_time || 15 },
      spicy: { type: sql.Bit, value: d.is_spicy ? 1 : 0 },
      veg: { type: sql.Bit, value: d.is_vegetarian ? 1 : 0 },
      avail: { type: sql.Bit, value: d.is_available !== false ? 1 : 0 },
      feat: { type: sql.Bit, value: d.is_featured ? 1 : 0 },
      pop: { type: sql.Bit, value: d.is_popular ? 1 : 0 },
      best: { type: sql.Bit, value: d.is_best_seller ? 1 : 0 },
      chef: { type: sql.Bit, value: d.chef_recommended ? 1 : 0 },
      rating: { type: sql.Float, value: parseFloat(d.rating) || 4.5 },
      cal: { type: sql.Int, value: d.calories ? parseInt(d.calories) : null },
      disc: { type: sql.Float, value: parseFloat(d.discount) || 0 },
      alg: { type: sql.NVarChar, value: Array.isArray(d.allergens) ? d.allergens.join(',') : d.allergens || '' },
    })
    if (!result.recordset[0]) return res.status(404).json({ error: 'Not found' })
    res.json(result.recordset[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/menu-items/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await query(`DELETE FROM menu_items WHERE id=@id`,
      { id: { type: sql.Int, value: parseInt(req.params.id) } })
    res.status(204).end()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
