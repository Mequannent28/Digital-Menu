const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors({ origin: '*' }))
app.use(express.json())

// Routes
app.use('/api/auth',       require('./routes/auth'))
app.use('/api/restaurant', require('./routes/restaurant'))
app.use('/api/categories', require('./routes/categories'))
app.use('/api/menu-items', require('./routes/menuItems'))
app.use('/api/modifiers',  require('./routes/modifiers'))
app.use('/api/tables',     require('./routes/tables'))
app.use('/api/orders',     require('./routes/orders'))
app.use('/api/users',      require('./routes/users'))

app.get('/', (req, res) => res.json({ message: 'ABC Restaurant API', status: 'running' }))
app.get('/health', (req, res) => res.json({ status: 'healthy' }))

const PORT = process.env.PORT || 8000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`)
})
