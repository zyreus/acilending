import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' })
  }
  try {
    const decoded = jwt.verify(auth.slice('Bearer '.length), JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ ok: false, message: 'Token expired or invalid' })
  }
}

