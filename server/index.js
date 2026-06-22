// Servidor de la app: API REST de compras + solicitudes + login con roles
// (responsable / equipo) + sirve el frontend compilado.

import express from 'express'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import {
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
} from './db.js'
import {
  configProblem,
  roleForPassword,
  setAuthCookie,
  clearAuthCookie,
  roleOf,
  requireAuth,
  requireManager,
} from './auth.js'

const problem = configProblem()
if (problem) {
  console.error(`\n  ERROR DE CONFIGURACIÓN: ${problem}\n  Define esas variables de entorno y reinicia.\n`)
  process.exit(1)
}

const app = express()
app.set('trust proxy', 1)
app.use(express.json({ limit: '25mb' }))

const REQUIRED = ['fecha', 'proyecto', 'categoria', 'descripcion', 'proveedor', 'metodo', 'estado']
const ESTADOS = ['Recibido', 'En envío']

// Construye y valida una compra a partir del cuerpo de la petición.
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
app.post('/api/login', (req, res) => {
  const role = roleForPassword(req.body?.password)
  if (!role) return res.status(401).json({ error: 'Contraseña incorrecta' })
  setAuthCookie(res, role)
  res.json({ ok: true, role })
})

app.post('/api/logout', (req, res) => {
  clearAuthCookie(res)
  res.status(204).end()
})

app.get('/api/session', (req, res) => {
  const role = roleOf(req)
  res.json({ authed: !!role, role: role || null })
})

// ── Compras (solo responsable) ───────────────────────────────────
app.use('/api/purchases', requireManager)

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
// Cualquier rol puede ver y crear; solo el responsable decide.
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
  const required = ['solicitante', 'proyecto', 'categoria', 'descripcion']
  const missing = required.filter((k) => !b[k] || !String(b[k]).trim())
  if (missing.length) return res.status(400).json({ error: 'Datos incompletos', missing })

  const est = b.importeEstimado === '' || b.importeEstimado == null ? null : Number(b.importeEstimado)
  const request = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    solicitante: String(b.solicitante).trim(),
    proyecto: b.proyecto,
    categoria: b.categoria,
    descripcion: String(b.descripcion).trim(),
    importeEstimado: est != null && est > 0 ? est : null,
    nota: b.nota ? String(b.nota).trim() : null,
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

// Comprar una solicitud: crea la compra y marca la solicitud como Comprada.
app.post('/api/requests/:id/buy', requireManager, async (req, res) => {
  try {
    const r = await getRequest(req.params.id)
    if (!r) return res.status(404).json({ error: 'No encontrada' })
    if (r.estado !== 'Pendiente') return res.status(409).json({ error: 'La solicitud ya fue decidida' })

    const { purchase, error } = buildPurchase(req.body ?? {})
    if (error) return res.status(error.status).json(error.body)

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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  Registro de compras — servidor activo`)
  console.log(`  Local:   http://localhost:${PORT}`)
  console.log(`  Red:     http://<IP-de-esta-PC>:${PORT}\n`)
})
