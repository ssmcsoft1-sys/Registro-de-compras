// Servidor de la app: API REST de compras + login + sirve el frontend compilado.
// En la nube va detrás de un proxy (https); en local escucha en 0.0.0.0.

import express from 'express'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { getAllPurchases, insertPurchase, updatePurchase, deletePurchase } from './db.js'
import {
  configProblem,
  checkPassword,
  setAuthCookie,
  clearAuthCookie,
  isAuthed,
  requireAuth,
} from './auth.js'

// Guardia: en producción exige contraseña y secreto configurados.
const problem = configProblem()
if (problem) {
  console.error(`\n  ERROR DE CONFIGURACIÓN: ${problem}\n  Define esas variables de entorno y reinicia.\n`)
  process.exit(1)
}

const app = express()
app.set('trust proxy', 1) // detrás del proxy de la plataforma (Render, etc.)
// Los recibos viajan como data URL (imagen/PDF embebido), así que subimos el límite.
app.use(express.json({ limit: '25mb' }))

const REQUIRED = ['fecha', 'proyecto', 'categoria', 'descripcion', 'proveedor', 'metodo', 'estado']
const ESTADOS = ['Recibido', 'En envío']

// ── Autenticación ────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  if (!checkPassword(req.body?.password)) {
    return res.status(401).json({ error: 'Contraseña incorrecta' })
  }
  setAuthCookie(res)
  res.json({ ok: true })
})

app.post('/api/logout', (req, res) => {
  clearAuthCookie(res)
  res.status(204).end()
})

app.get('/api/session', (req, res) => {
  res.json({ authed: isAuthed(req) })
})

// ── API de compras (protegida) ───────────────────────────────────
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
  const b = req.body ?? {}
  const importe = Number(b.importe)

  const missing = REQUIRED.filter((k) => !b[k] || !String(b[k]).trim())
  if (missing.length || !(importe > 0)) {
    return res.status(400).json({ error: 'Datos incompletos', missing })
  }

  const purchase = {
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
  }

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

// ── Frontend compilado (solo cuando existe /dist) ─────────────────
const distDir = path.join(import.meta.dirname, '..', 'dist')
if (existsSync(distDir)) {
  app.use(express.static(distDir))
  // Cualquier ruta que no sea /api devuelve la SPA.
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
