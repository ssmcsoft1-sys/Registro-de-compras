// Autenticación por contraseña compartida con DOS roles:
//   - 'manager' (responsable): contraseña MANAGER_PASSWORD (o APP_PASSWORD por compatibilidad)
//   - 'team' (equipo): contraseña TEAM_PASSWORD
// La cookie firmada (HMAC, sin estado) lleva el rol y sobrevive a reinicios.

import { createHmac, timingSafeEqual } from 'node:crypto'
import { parse, serialize } from 'cookie'

const IS_PROD = process.env.NODE_ENV === 'production'
const COOKIE_NAME = 'rc_auth'
const MAX_AGE_S = 30 * 24 * 60 * 60 // 30 días

const MANAGER_PASSWORD =
  process.env.MANAGER_PASSWORD || process.env.APP_PASSWORD || (IS_PROD ? null : 'jefe')
const TEAM_PASSWORD = process.env.TEAM_PASSWORD || (IS_PROD ? null : 'equipo')
const SESSION_SECRET = process.env.SESSION_SECRET || (IS_PROD ? null : 'dev-secret-cambiar')

export function configProblem() {
  if (IS_PROD && (!MANAGER_PASSWORD || !SESSION_SECRET)) {
    return 'Faltan variables de entorno MANAGER_PASSWORD (o APP_PASSWORD) y/o SESSION_SECRET en producción.'
  }
  return null
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a))
  const bb = Buffer.from(String(b))
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

// Devuelve el rol que corresponde a la contraseña, o null. El responsable tiene prioridad.
export function roleForPassword(input) {
  if (MANAGER_PASSWORD != null && safeEqual(input ?? '', MANAGER_PASSWORD)) return 'manager'
  if (TEAM_PASSWORD != null && safeEqual(input ?? '', TEAM_PASSWORD)) return 'team'
  return null
}

function sign(value) {
  return createHmac('sha256', SESSION_SECRET ?? '').update(value).digest('hex')
}

function makeToken(role) {
  const exp = String(Date.now() + MAX_AGE_S * 1000)
  const payload = `${exp}.${role}`
  return `${payload}.${sign(payload)}`
}

// Devuelve el rol válido del token, o null.
function roleFromToken(token) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [exp, role, sig] = parts
  if (!safeEqual(sig, sign(`${exp}.${role}`))) return null
  if (!(Number(exp) > Date.now())) return null
  return role === 'manager' || role === 'team' ? role : null
}

export function setAuthCookie(res, role) {
  res.setHeader(
    'Set-Cookie',
    serialize(COOKIE_NAME, makeToken(role), {
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

export function roleOf(req) {
  const cookies = parse(req.headers.cookie || '')
  return roleFromToken(cookies[COOKIE_NAME])
}

// Middleware: cualquier rol válido. Adjunta req.role.
export function requireAuth(req, res, next) {
  const role = roleOf(req)
  if (!role) return res.status(401).json({ error: 'No autenticado' })
  req.role = role
  next()
}

// Middleware: solo el responsable.
export function requireManager(req, res, next) {
  const role = roleOf(req)
  if (!role) return res.status(401).json({ error: 'No autenticado' })
  if (role !== 'manager') return res.status(403).json({ error: 'Solo el responsable' })
  req.role = role
  next()
}
