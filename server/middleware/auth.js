const jwt = require('jsonwebtoken')

module.exports = function requireAuth(req, res, next) {
  const token = req.cookies?.session
  if (!token) return res.status(401).json({ error: 'Not authenticated' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Session expired — please log in again' })
  }
}
