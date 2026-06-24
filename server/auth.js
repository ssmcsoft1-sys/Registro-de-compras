// Autenticación con cuentas individuales (correo + contraseña).
// Contraseñas con hash scrypt (node:crypto, sin dependencias). Cookie firmada HMAC
// sin estado que lleva el id de usuario; el rol se lee de la cuenta en cada petición
// (así, borrar/cambiar un usuario tiene efecto inmediato).

import { createHmac, timingSafeEqual, scryptSync, randomBytes } from 'node:crypto'
import { parse, serialize } from 'cookie'
import { getUserById } from './db.js'

const IS_PROD = process.env.NODE_ENV === 'production'
const COOKIE_NAME = 'rc_auth'
const MAX_AGE_S = 30 * 24 * 60 * 60 // 30 días
const SESSION_SECRET = process.env.SESSION_SECRET || (IS_PROD ? null : 'dev-secret-cambiar')

export const ALLOWED_DOMAIN = (process.env.ALLOWED_DOMAIN || 'candelasoft.com').toLowerCase()

export function configProblem() {
  if (IS_PROD && !SESSION_SECRET) return 'Falta la variable de entorno SESSION_SECRET en producción.'
  return null
}

export function emailAllowed(email) {
  return typeof email === 'string' && email.toLowerCase().trim().endsWith(`@${ALLOWED_DOMAIN}`)
}

function safeEqualHex(aHex, bBuf) {
  const a = Buffer.from(aHex, 'hex')
  return a.length === bBuf.length && timingSafeEqual(a, bBuf)
}

// ── Hash de contraseñas (scrypt) ──
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(String(password), salt, 64).toString('hex')
  return `${salt}:${hash}`
}
export function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false
  const [salt, hash] = stored.split(':')
  return safeEqualHex(hash, scryptSync(String(password), salt, 64))
}

// ── Cookie de sesión firmada (lleva el userId) ──
function sign(value) {
  return createHmac('sha256', SESSION_SECRET ?? '').update(value).digest('hex')
}
function makeToken(userId) {
  const exp = String(Date.now() + MAX_AGE_S * 1000)
  const payload = `${exp}.${userId}`
  return `${payload}.${sign(payload)}`
}
function userIdFromToken(token) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [exp, userId, sig] = parts
  if (sig !== sign(`${exp}.${userId}`)) return null
  if (!(Number(exp) > Date.now())) return null
  return userId
}

export function setAuthCookie(res, userId) {
  res.setHeader(
    'Set-Cookie',
    serialize(COOKIE_NAME, makeToken(userId), {
      httpOnly: true,
      sameSite: 'lax',
      secure: IS_PROD,
      path: '/',
      maxAge: MAX_AGE_S,
    }),
  )
}
export function clearAuthCookie(res) {
  res.setHeader(
    'Set-Cookie',
    serialize(COOKIE_NAME, '', { httpOnly: true, sameSite: 'lax', secure: IS_PROD, path: '/', maxAge: 0 }),
  )
}

// Usuario de la petición (o null). Lee la cuenta de la BD según el id de la cookie.
export async function userFromReq(req) {
  const cookies = parse(req.headers.cookie || '')
  const id = userIdFromToken(cookies[COOKIE_NAME])
  if (!id) return null
  const u = await getUserById(id)
  return u ? { id: u.id, email: u.email, nombre: u.nombre, role: u.role } : null
}

export async function requireAuth(req, res, next) {
  try {
    const u = await userFromReq(req)
    if (!u) return res.status(401).json({ error: 'No autenticado' })
    req.user = u
    next()
  } catch (e) {
    console.error('Auth error:', e.message)
    res.status(500).json({ error: 'Error de autenticación' })
  }
}

export async function requireManager(req, res, next) {
  try {
    const u = await userFromReq(req)
    if (!u) return res.status(401).json({ error: 'No autenticado' })
    if (u.role !== 'manager') return res.status(403).json({ error: 'Solo el responsable' })
    req.user = u
    next()
  } catch (e) {
    console.error('Auth error:', e.message)
    res.status(500).json({ error: 'Error de autenticación' })
  }
}
