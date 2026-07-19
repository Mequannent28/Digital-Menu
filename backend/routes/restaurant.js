const router = require('express').Router()
const { sql, query } = require('../db')
const auth = require('../middleware/auth')

// GET /api/restaurant
router.get('/', async (req, res) => {
  try {
    const result = await query(`SELECT TOP 1 * FROM restaurant`)
    res.json(result.recordset[0] || {})
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/restaurant
router.put('/', auth, async (req, res) => {
  try {
    const { name, name_am, tagline, address, phone, wifi_password, working_hours, vat_rate, service_charge_rate, currency } = req.body
    await query(`
      UPDATE restaurant SET
        name = @name, name_am = @nameAm, tagline = @tagline,
        address = @address, phone = @phone, wifi_password = @wifi,
        working_hours = @hours, vat_rate = @vat,
        service_charge_rate = @svc, currency = @currency
      WHERE id = 1
    `, {
      name: { type: sql.NVarChar, value: name },
      nameAm: { type: sql.NVarChar, value: name_am },
      tagline: { type: sql.NVarChar, value: tagline },
      address: { type: sql.NVarChar, value: address },
      phone: { type: sql.NVarChar, value: phone },
      wifi: { type: sql.NVarChar, value: wifi_password },
      hours: { type: sql.NVarChar, value: working_hours },
      vat: { type: sql.Float, value: vat_rate },
      svc: { type: sql.Float, value: service_charge_rate },
      currency: { type: sql.NVarChar, value: currency },
    })
    const result = await query(`SELECT TOP 1 * FROM restaurant`)
    res.json(result.recordset[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
