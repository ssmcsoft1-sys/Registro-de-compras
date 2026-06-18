// Autenticación simple por contraseña compartida, con cookie de sesión firmada (sin estado).
// La cookie sobrevive a reinicios del servidor porque se valida con HMAC, no con memoria.

import { createHmac, timingSafeEqual } from 'node:crypto'
import { parse, serialize } from 'cookie'

const IS_PROD = process.env.NODE_ENV === 'production'
const COOKIE_NAME = 'rc_auth'
const MAX_AGE_S = 30 * 24 * 60 * 60 // 30 días

// En producción exigimos configurarlas; en local hay valores por defecto (con aviso).
const APP_PASSWORD = process.env.APP_PASSWORD || (IS_PROD ? null : 'compras')
const SESSION_SECRET = process.env.SESSION_SECRET || (IS_PROD ? null : 'dev-secret-cambiar')

// Devuelve un mensaje si falta configuración obligatoria en producción.
export function configProblem() {
  if (IS_PROD && (!APP_PASSWORD || !SESSION_SECRET)) {
    return 'Faltan variables de entorno APP_PASSWORD y/o SESSION_SECRET en producción.'
  }
  return null
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a))
  const bb = Buffer.from(String(b))
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

export function checkPassword(input) {
  return APP_PASSWORD != null && safeEqual(input ?? '', APP_PASSWORD)
}

function sign(value) {
  return createHmac('sha256', SESSION_SECRET ?? '').update(value).digest('hex')
}

function makeToken() {
  const exp = String(Date.now() + MAX_AGE_S * 1000)
  return `${exp}.${sign(exp)}`
}

function verifyToken(token) {
  if (!token || !token.includes('.')) return false
  const [exp, sig] = token.split('.')
  if (!safeEqual(sig, sign(exp))) return false
  return Number(exp) > Date.now()
}

export function setAuthCookie(res) {
  res.setHeader(
    'Set-Cookie',
    serialize(COOKIE_NAME, makeToken(), {
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

export function isAuthed(req) {
  const cookies = parse(req.headers.cookie || '')
  return verifyToken(cookies[COOKIE_NAME])
}

// Middleware: 401 si la petición no trae una cookie de sesión válida.
export function requireAuth(req, res, next) {
  if (isAuthed(req)) return next()
  res.status(401).json({ error: 'No autenticado' })
}
