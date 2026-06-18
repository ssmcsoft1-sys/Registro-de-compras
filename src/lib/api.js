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

// ── Sesión ──
export async function checkSession() {
  try {
    const res = await fetch('/api/session')
    const data = await res.json()
    return !!data.authed
  } catch {
    return false
  }
}

export async function login(password) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  return res.ok
}

export async function logout() {
  await fetch('/api/logout', { method: 'POST' })
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
