import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createUser, getUserByEmail, getUserById } from '../../db/provider.js'

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'

export async function register(req, res) {
  const { email, password } = req.body || {}
  if (!email?.trim() || !password) {
    return res.status(400).json({ ok: false, message: 'Email and password are required.' })
  }
  const normalized = email.trim().toLowerCase()
  const existing = await getUserByEmail(normalized)
  if (existing) return res.status(409).json({ ok: false, message: 'Email already registered.' })

  const password_hash = await bcrypt.hash(password, 10)
  const user = await createUser({ email: normalized, password_hash })
  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' })
  res.json({ ok: true, token, user })
}

export async function login(req, res) {
  const { email, password } = req.body || {}
  if (!email?.trim() || !password) {
    return res.status(400).json({ ok: false, message: 'Email and password are required.' })
  }
  const normalized = email.trim().toLowerCase()
  const user = await getUserByEmail(normalized)
  if (!user) return res.status(401).json({ ok: false, message: 'Invalid credentials.' })

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return res.status(401).json({ ok: false, message: 'Invalid credentials.' })

  const safeUser = await getUserById(user.id)
  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' })
  res.json({ ok: true, token, user: safeUser })
}

export async function me(req, res) {
  const user = await getUserById(Number(req.user?.sub))
  if (!user) return res.status(404).json({ ok: false, message: 'User not found' })
  res.json({ ok: true, user })
}

