// Servidor: API REST de compras + solicitudes + usuarios (cuentas individuales) +
// login por correo + sirve el frontend compilado.

import express from 'express'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  ping,
  getAllPurchases,
  insertPurchase,
  updatePurchase,
  deletePurchase,
  getAllRequests,
  getRequest,
  insertRequest,
  rejectRequest,
  markRequestBought,
  deleteRequest,
  getUserByEmail,
  getUserById,
  getAllUsers,
  countUsers,
  countAdmins,
  insertUser,
  updateUserPassword,
  updateUserRole,
  deleteUser,
} from './db.js'
import {
  configProblem,
  emailAllowed,
  hashPassword,
  verifyPassword,
  setAuthCookie,
  clearAuthCookie,
  userFromReq,
  requireAuth,
  requireManager,
  ALLOWED_DOMAIN,
} from './auth.js'

const problem = configProblem()
if (problem) {
  console.error(`\n  ERROR DE CONFIGURACIÓN: ${problem}\n  Define esa variable de entorno y reinicia.\n`)
  process.exit(1)
}

// Admin inicial (bootstrap): si no hay usuarios, lo crea desde ADMIN_EMAIL/ADMIN_PASSWORD.
async function bootstrapAdmin() {
  try {
    if ((await countUsers()) > 0) return
    const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim()
    const password = process.env.ADMIN_PASSWORD
    if (!email || !password) {
      console.error('\n  ⚠ No hay usuarios y faltan ADMIN_EMAIL / ADMIN_PASSWORD.')
      console.error('  Define esas variables para crear el administrador inicial y reinicia.\n')
      return
    }
    await insertUser({
      id: randomUUID(),
      email,
      nombre: email.split('@')[0],
      password_hash: hashPassword(password),
      role: 'manager',
      created_at: new Date().toISOString(),
    })
    console.log(`  Administrador inicial creado: ${email}`)
  } catch (e) {
    console.error('Bootstrap admin error:', e.message)
  }
}

const app = express()
app.set('trust proxy', 1)
app.use(express.json({ limit: '25mb' }))

const REQUIRED = ['fecha', 'proyecto', 'categoria', 'descripcion', 'proveedor', 'metodo', 'estado']
const ESTADOS = ['Recibido', 'En envío']

function buildPurchase(b) {
  const importe = Number(b.importe)
  const missing = REQUIRED.filter((k) => !b[k] || !String(b[k]).trim())
  if (missing.length || !(importe > 0) || !ESTADOS.includes(b.estado)) {
    return { error: { status: 400, body: { error: 'Datos incompletos', missing } } }
  }
  return {
    purchase: {
      id: randomUUID(),
      fecha: b.fecha,
      proyecto: b.proyecto,
      categoria: b.categoria,
      descripcion: String(b.descripcion).trim(),
      proveedor: String(b.proveedor).trim(),
      metodo: b.metodo,
      estado: b.estado,
      importe,
      recibo: b.recibo ?? null,
      pagadoPor: b.pagadoPor ? String(b.pagadoPor).trim() : null,
      created_at: new Date().toISOString(),
    },
  }
}

// ── Autenticación ────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  const email = String(req.body?.email || '').toLowerCase().trim()
  const password = req.body?.password
  try {
    const user = await getUserByEmail(email)
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' })
    }
    setAuthCookie(res, user.id)
    res.json({ role: user.role, email: user.email, nombre: user.nombre })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al iniciar sesión' })
  }
})

app.post('/api/logout', (req, res) => {
  clearAuthCookie(res)
  res.status(204).end()
})

app.get('/api/session', async (req, res) => {
  const u = await userFromReq(req)
  res.json({ authed: !!u, role: u?.role || null, email: u?.email || null, nombre: u?.nombre || null })
})

app.get('/api/health', async (req, res) => {
  const started = Date.now()
  try {
    await ping()
    res.json({ ok: true, ms: Date.now() - started })
  } catch (e) {
    console.error('Healthcheck DB error:', e.message)
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ── Usuarios (solo responsable/admin) ────────────────────────────
app.get('/api/users', requireManager, async (req, res) => {
  try {
    res.json(await getAllUsers())
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al leer los usuarios' })
  }
})

app.post('/api/users', requireManager, async (req, res) => {
  const b = req.body ?? {}
  const email = String(b.email || '').toLowerCase().trim()
  const nombre = String(b.nombre || '').trim() || email.split('@')[0]
  const role = b.role === 'manager' ? 'manager' : 'team'
  if (!emailAllowed(email)) return res.status(400).json({ error: `El correo debe ser @${ALLOWED_DOMAIN}` })
  if (!b.password || String(b.password).length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
  }
  try {
    if (await getUserByEmail(email)) return res.status(409).json({ error: 'Ya existe un usuario con ese correo' })
    const user = await insertUser({
      id: randomUUID(),
      email,
      nombre,
      password_hash: hashPassword(b.password),
      role,
      created_at: new Date().toISOString(),
    })
    res.status(201).json(user)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al crear el usuario' })
  }
})

app.patch('/api/users/:id', requireManager, async (req, res) => {
  const b = req.body ?? {}
  try {
    const target = await getUserById(req.params.id)
    if (!target) return res.status(404).json({ error: 'No encontrado' })

    if ('password' in b) {
      if (!b.password || String(b.password).length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
      }
      await updateUserPassword(target.id, hashPassword(b.password))
    }
    if ('role' in b) {
      const role = b.role === 'manager' ? 'manager' : 'team'
      if (target.id === req.user.id && role !== 'manager') {
        return res.status(400).json({ error: 'No puedes quitarte el rol de administrador a ti mismo' })
      }
      if (role !== 'manager' && target.role === 'manager' && (await countAdmins()) <= 1) {
        return res.status(400).json({ error: 'Debe quedar al menos un administrador' })
      }
      await updateUserRole(target.id, role)
    }
    const u = await getUserById(target.id)
    res.json({ id: u.id, email: u.email, nombre: u.nombre, role: u.role, created_at: u.created_at })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al actualizar el usuario' })
  }
})

app.delete('/api/users/:id', requireManager, async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' })
    const target = await getUserById(req.params.id)
    if (!target) return res.status(404).json({ error: 'No encontrado' })
    if (target.role === 'manager' && (await countAdmins()) <= 1) {
      return res.status(400).json({ error: 'Debe quedar al menos un administrador' })
    }
    await deleteUser(req.params.id)
    res.status(204).end()
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al eliminar el usuario' })
  }
})

// ── Compras (equipo y responsable) ───────────────────────────────
app.use('/api/purchases', requireAuth)

app.get('/api/purchases', async (req, res) => {
  try {
    res.json(await getAllPurchases())
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al leer las compras' })
  }
})

app.post('/api/purchases', async (req, res) => {
  const { purchase, error } = buildPurchase(req.body ?? {})
  if (error) return res.status(error.status).json(error.body)
  purchase.creadoPor = req.user.email
  try {
    const saved = await insertPurchase(purchase)
    res.status(201).json(saved ?? purchase)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al guardar la compra' })
  }
})

app.patch('/api/purchases/:id', async (req, res) => {
  const fields = { ...(req.body ?? {}) }
  if ('importe' in fields) {
    const n = Number(fields.importe)
    if (!(n > 0)) return res.status(400).json({ error: 'Importe inválido' })
    fields.importe = n
  }
  if ('estado' in fields && !ESTADOS.includes(fields.estado)) {
    return res.status(400).json({ error: 'Estado inválido' })
  }
  for (const k of ['proyecto', 'categoria', 'descripcion', 'proveedor', 'metodo', 'fecha']) {
    if (k in fields) {
      if (!String(fields[k]).trim()) return res.status(400).json({ error: `Campo vacío: ${k}` })
      fields[k] = String(fields[k]).trim()
    }
  }
  try {
    const updated = await updatePurchase(req.params.id, fields)
    if (!updated) return res.status(404).json({ error: 'No encontrada' })
    res.json(updated)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al actualizar la compra' })
  }
})

app.delete('/api/purchases/:id', async (req, res) => {
  try {
    const removed = await deletePurchase(req.params.id)
    if (!removed) return res.status(404).json({ error: 'No encontrada' })
    res.status(204).end()
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al eliminar la compra' })
  }
})

// ── Solicitudes ──────────────────────────────────────────────────
app.get('/api/requests', requireAuth, async (req, res) => {
  try {
    res.json(await getAllRequests())
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al leer las solicitudes' })
  }
})

app.post('/api/requests', requireAuth, async (req, res) => {
  const b = req.body ?? {}
  const required = ['proyecto', 'categoria', 'descripcion']
  const missing = required.filter((k) => !b[k] || !String(b[k]).trim())
  if (missing.length) return res.status(400).json({ error: 'Datos incompletos', missing })

  const est = b.importeEstimado === '' || b.importeEstimado == null ? null : Number(b.importeEstimado)
  const request = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    solicitante: req.user.email, // autor automático
    proyecto: b.proyecto,
    categoria: b.categoria,
    descripcion: String(b.descripcion).trim(),
    importeEstimado: est != null && est > 0 ? est : null,
    nota: b.nota ? String(b.nota).trim() : null,
    link: b.link ? String(b.link).trim() : null,
  }
  try {
    res.status(201).json(await insertRequest(request))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al crear la solicitud' })
  }
})

app.post('/api/requests/:id/reject', requireManager, async (req, res) => {
  try {
    const r = await getRequest(req.params.id)
    if (!r) return res.status(404).json({ error: 'No encontrada' })
    if (r.estado !== 'Pendiente') return res.status(409).json({ error: 'La solicitud ya fue decidida' })
    const nota = req.body?.notaResponsable ? String(req.body.notaResponsable).trim() : null
    res.json(await rejectRequest(req.params.id, nota, new Date().toISOString()))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al rechazar la solicitud' })
  }
})

app.post('/api/requests/:id/buy', requireManager, async (req, res) => {
  try {
    const r = await getRequest(req.params.id)
    if (!r) return res.status(404).json({ error: 'No encontrada' })
    if (r.estado !== 'Pendiente') return res.status(409).json({ error: 'La solicitud ya fue decidida' })

    const { purchase, error } = buildPurchase(req.body ?? {})
    if (error) return res.status(error.status).json(error.body)
    purchase.creadoPor = req.user.email

    const saved = await insertPurchase(purchase)
    const request = await markRequestBought(req.params.id, purchase.id, new Date().toISOString())
    res.json({ request, purchase: saved ?? purchase })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al registrar la compra de la solicitud' })
  }
})

app.delete('/api/requests/:id', requireManager, async (req, res) => {
  try {
    const removed = await deleteRequest(req.params.id)
    if (!removed) return res.status(404).json({ error: 'No encontrada' })
    res.status(204).end()
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al eliminar la solicitud' })
  }
})

// ── Frontend compilado ───────────────────────────────────────────
const distDir = path.join(import.meta.dirname, '..', 'dist')
if (existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

const PORT = process.env.PORT || 3001
await bootstrapAdmin()
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  Registro de compras — servidor activo`)
  console.log(`  Local:   http://localhost:${PORT}`)
  console.log(`  Red:     http://<IP-de-esta-PC>:${PORT}\n`)
})
