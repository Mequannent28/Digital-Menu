const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token provided' })

  const token = auth.split(' ')[1]

  // Allow demo token (used when API was offline at login time)
  if (token === 'demo-admin-token') {
    req.user = { id: 1, email: 'admin@abc.com', role: 'admin' }
    return next()
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'digital-menu-secret-key-2024-abc-restaurant')
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}
