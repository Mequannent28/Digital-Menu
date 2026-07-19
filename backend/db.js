const sql = require('mssql')
require('dotenv').config()

const config = {
  server: process.env.DB_SERVER || 'MARK\\SQLEXPRESS01',
  database: process.env.DB_NAME || 'RestaurantDB',
  user: process.env.DB_USER || 'menuapp',
  password: process.env.DB_PASS || 'MenuApp2024!',
  options: {
    trustServerCertificate: true,
    encrypt: false,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

let pool = null

async function getPool() {
  if (pool) return pool
  try {
    pool = await sql.connect(config)
    console.log('✅ Connected to SQL Server RestaurantDB')
    return pool
  } catch (err) {
    pool = null
    console.error('❌ DB Error:', err.message)
    throw err
  }
}

async function query(sqlText, params = {}) {
  const p = await getPool()
  const request = p.request()
  Object.entries(params).forEach(([key, { type, value }]) => {
    request.input(key, type, value)
  })
  return request.query(sqlText)
}

module.exports = { sql, query, getPool }
