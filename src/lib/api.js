// Cliente HTTP hacia el servidor de compras.
// Las rutas son relativas: en desarrollo Vite hace proxy de /api al backend;
// en producción el mismo servidor sirve la app y la API (mismo origen).

const BASE = '/api/purchases'

// Error específico cuando el servidor responde 401 (sesión no iniciada o caducada).
export class AuthError extends Error {}

async function ensureOk(res, message) {
  if (res.status === 401) throw new AuthError('No autenticado')
  if (!res.ok) throw new Error(message)
  return res
}

// ── Sesión ── (devuelven el rol: 'manager' | 'team' | null)
export async function checkSession() {
  try {
    const res = await fetch('/api/session')
    const data = await res.json()
    return data.authed ? data.role : null
  } catch {
    return null
  }
}

export async function login(password) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.role
}

export async function logout() {
  await fetch('/api/logout', { method: 'POST' })
}

// ── Solicitudes ──
const RBASE = '/api/requests'

export async function fetchRequests() {
  const res = await fetch(RBASE)
  await ensureOk(res, 'No se pudieron cargar las solicitudes')
  return res.json()
}

export async function createRequest(request) {
  const res = await fetch(RBASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  await ensureOk(res, 'No se pudo crear la solicitud')
  return res.json()
}

export async function rejectRequest(id, notaResponsable) {
  const res = await fetch(`${RBASE}/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notaResponsable }),
  })
  await ensureOk(res, 'No se pudo rechazar la solicitud')
  return res.json()
}

export async function buyRequest(id, purchase) {
  const res = await fetch(`${RBASE}/${id}/buy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(purchase),
  })
  await ensureOk(res, 'No se pudo registrar la compra')
  return res.json()
}

export async function deleteRequest(id) {
  const res = await fetch(`${RBASE}/${id}`, { method: 'DELETE' })
  await ensureOk(res, 'No se pudo eliminar la solicitud')
}

// ── Compras ──
export async function fetchPurchases() {
  const res = await fetch(BASE)
  await ensureOk(res, 'No se pudieron cargar las compras')
  return res.json()
}

export async function createPurchase(purchase) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(purchase),
  })
  await ensureOk(res, 'No se pudo guardar la compra')
  return res.json()
}

export async function updatePurchase(id, fields) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  })
  await ensureOk(res, 'No se pudo actualizar la compra')
  return res.json()
}

export async function deletePurchase(id) {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' })
  await ensureOk(res, 'No se pudo eliminar la compra')
}
