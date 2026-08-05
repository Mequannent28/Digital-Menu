const router = require('express').Router()
const { sql, query } = require('../db')
const auth = require('../middleware/auth')

// POST /api/reviews  (customer submits a review)
router.post('/', async (req, res) => {
  try {
    const { orderRef, tableNumber, customerName, phone, overallRating, foodRating, serviceRating, comment } = req.body
    if (!overallRating || overallRating < 1 || overallRating > 5)
      return res.status(400).json({ error: 'overall_rating must be 1–5' })

    const result = await query(`
      INSERT INTO reviews
        (order_ref, table_number, customer_name, phone, overall_rating, food_rating, service_rating, comment)
      OUTPUT INSERTED.*
      VALUES (@ref, @table, @name, @phone, @overall, @food, @service, @comment)
    `, {
      ref:     { type: sql.NVarChar, value: orderRef     || '' },
      table:   { type: sql.NVarChar, value: tableNumber  || '' },
      name:    { type: sql.NVarChar, value: customerName || '' },
      phone:   { type: sql.NVarChar, value: phone        || '' },
      overall: { type: sql.Int,      value: parseInt(overallRating) },
      food:    { type: sql.Int,      value: parseInt(foodRating)    || null },
      service: { type: sql.Int,      value: parseInt(serviceRating) || null },
      comment: { type: sql.NVarChar, value: comment      || '' },
    })

    // Update restaurant average rating
    await query(`
      UPDATE restaurant SET
        rating       = (SELECT AVG(CAST(overall_rating AS FLOAT)) FROM reviews),
        review_count = (SELECT COUNT(*) FROM reviews)
      WHERE id = 1
    `)

    res.status(201).json(result.recordset[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reviews  (admin views all reviews)
router.get('/', auth, async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM reviews ORDER BY created_at DESC
    `)
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reviews/summary  (public — for customer-facing star display)
router.get('/summary', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        COUNT(*)                                   AS total,
        AVG(CAST(overall_rating AS FLOAT))         AS avg_overall,
        AVG(CAST(food_rating    AS FLOAT))         AS avg_food,
        AVG(CAST(service_rating AS FLOAT))         AS avg_service,
        SUM(CASE WHEN overall_rating = 5 THEN 1 ELSE 0 END) AS five_star,
        SUM(CASE WHEN overall_rating = 4 THEN 1 ELSE 0 END) AS four_star,
        SUM(CASE WHEN overall_rating = 3 THEN 1 ELSE 0 END) AS three_star,
        SUM(CASE WHEN overall_rating = 2 THEN 1 ELSE 0 END) AS two_star,
        SUM(CASE WHEN overall_rating = 1 THEN 1 ELSE 0 END) AS one_star
      FROM reviews
    `)
    res.json(result.recordset[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/reviews/:id  (admin removes a review)
router.delete('/:id', auth, async (req, res) => {
  try {
    await query(`DELETE FROM reviews WHERE id = @id`, {
      id: { type: sql.Int, value: parseInt(req.params.id) },
    })
    // Recalculate restaurant rating after deletion
    await query(`
      UPDATE restaurant SET
        rating       = ISNULL((SELECT AVG(CAST(overall_rating AS FLOAT)) FROM reviews), 4.8),
        review_count = (SELECT COUNT(*) FROM reviews)
      WHERE id = 1
    `)
    res.status(204).end()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
