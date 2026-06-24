// Cliente HTTP hacia el servidor de compras.
// Las rutas son relativas: en desarrollo Vite hace proxy de /api al backend;
// en producción el mismo servidor sirve la app y la API (mismo origen).

const BASE = '/api/purchases'

// Error específico cuando el servidor responde 401 (sesión no iniciada o caducada).
export class AuthError extends Error {}

// fetch con límite de tiempo: evita que la app se quede cargando para siempre
// si el servidor o la base de datos tardan demasiado (p. ej. al "despertar").
function timedFetch(url, opts = {}, ms = 60000) {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), ms)
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(id))
}

async function ensureOk(res, message) {
  if (res.status === 401) throw new AuthError('No autenticado')
  if (!res.ok) throw new Error(message)
  return res
}

// ── Sesión ── (devuelven el usuario { role, email, nombre } o null)
export async function checkSession() {
  try {
    const res = await timedFetch('/api/session')
    const data = await res.json()
    return data.authed ? { role: data.role, email: data.email, nombre: data.nombre } : null
  } catch {
    return null
  }
}

// Devuelve el usuario en caso de éxito, o null si las credenciales fallan.
export async function login(email, password) {
  const res = await timedFetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) return null
  return res.json() // { role, email, nombre }
}

export async function logout() {
  await timedFetch('/api/logout', { method: 'POST' })
}

// ── Usuarios (solo admin) ──
const UBASE = '/api/users'

export async function fetchUsers() {
  const res = await timedFetch(UBASE)
  await ensureOk(res, 'No se pudieron cargar los usuarios')
  return res.json()
}

export async function createUser(user) {
  const res = await timedFetch(UBASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  })
  if (res.status === 401) throw new AuthError('No autenticado')
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'No se pudo crear el usuario')
  return data
}

export async function updateUser(id, fields) {
  const res = await timedFetch(`${UBASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  })
  if (res.status === 401) throw new AuthError('No autenticado')
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'No se pudo actualizar el usuario')
  return data
}

export async function deleteUser(id) {
  const res = await timedFetch(`${UBASE}/${id}`, { method: 'DELETE' })
  if (res.status === 401) throw new AuthError('No autenticado')
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'No se pudo eliminar el usuario')
  }
}

// ── Solicitudes ──
const RBASE = '/api/requests'

export async function fetchRequests() {
  const res = await timedFetch(RBASE)
  await ensureOk(res, 'No se pudieron cargar las solicitudes')
  return res.json()
}

export async function createRequest(request) {
  const res = await timedFetch(RBASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  await ensureOk(res, 'No se pudo crear la solicitud')
  return res.json()
}

export async function rejectRequest(id, notaResponsable) {
  const res = await timedFetch(`${RBASE}/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notaResponsable }),
  })
  await ensureOk(res, 'No se pudo rechazar la solicitud')
  return res.json()
}

export async function buyRequest(id, purchase) {
  const res = await timedFetch(`${RBASE}/${id}/buy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(purchase),
  })
  await ensureOk(res, 'No se pudo registrar la compra')
  return res.json()
}

export async function deleteRequest(id) {
  const res = await timedFetch(`${RBASE}/${id}`, { method: 'DELETE' })
  await ensureOk(res, 'No se pudo eliminar la solicitud')
}

// ── Compras ──
export async function fetchPurchases() {
  const res = await timedFetch(BASE)
  await ensureOk(res, 'No se pudieron cargar las compras')
  return res.json()
}

export async function createPurchase(purchase) {
  const res = await timedFetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(purchase),
  })
  await ensureOk(res, 'No se pudo guardar la compra')
  return res.json()
}

export async function updatePurchase(id, fields) {
  const res = await timedFetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  })
  await ensureOk(res, 'No se pudo actualizar la compra')
  return res.json()
}

export async function deletePurchase(id) {
  const res = await timedFetch(`${BASE}/${id}`, { method: 'DELETE' })
  await ensureOk(res, 'No se pudo eliminar la compra')
}
