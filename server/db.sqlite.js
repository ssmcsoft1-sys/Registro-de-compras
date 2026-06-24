// Adaptador SQLite (desarrollo local) — SQLite incorporado en Node (node:sqlite).
// El archivo de datos vive en server/data/compras.db. Para respaldar, copia ese archivo.
// Expone la MISMA interfaz async que el adaptador Postgres (server/db.postgres.js).

import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { seedPurchases } from '../src/data/seed.js'

const DATA_DIR = path.join(import.meta.dirname, 'data')
const DB_PATH = path.join(DATA_DIR, 'compras.db')

mkdirSync(DATA_DIR, { recursive: true })

const db = new DatabaseSync(DB_PATH)

// Esquema. El recibo se guarda como JSON (objeto { name, url }) o NULL.
db.exec(`
  CREATE TABLE IF NOT EXISTS purchases (
    id          TEXT PRIMARY KEY,
    fecha       TEXT NOT NULL,
    proyecto    TEXT NOT NULL,
    categoria   TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    proveedor   TEXT NOT NULL,
    metodo      TEXT NOT NULL,
    estado      TEXT NOT NULL,
    importe     REAL NOT NULL,
    recibo      TEXT,
    pagadoPor   TEXT,
    creado_por  TEXT,
    created_at  TEXT NOT NULL
  );
`)

// Migración: añade columnas a bases de datos ya existentes.
const cols = db.prepare('PRAGMA table_info(purchases)').all().map((c) => c.name)
if (!cols.includes('pagadoPor')) {
  db.exec('ALTER TABLE purchases ADD COLUMN pagadoPor TEXT')
}
if (!cols.includes('creado_por')) {
  db.exec('ALTER TABLE purchases ADD COLUMN creado_por TEXT')
}

// Usuarios (cuentas individuales con correo corporativo).
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    nombre        TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL,
    created_at    TEXT NOT NULL
  );
`)

// Solicitudes de compra (flujo: Pendiente -> Comprada | Rechazada).
db.exec(`
  CREATE TABLE IF NOT EXISTS requests (
    id              TEXT PRIMARY KEY,
    created_at      TEXT NOT NULL,
    solicitante     TEXT NOT NULL,
    proyecto        TEXT NOT NULL,
    categoria       TEXT NOT NULL,
    descripcion     TEXT NOT NULL,
    importeEstimado REAL,
    nota            TEXT,
    estado          TEXT NOT NULL,
    notaResponsable TEXT,
    compraId        TEXT,
    decidedAt       TEXT,
    link            TEXT
  );
`)

// Migración: añade la columna link a tablas de solicitudes ya existentes.
const reqCols = db.prepare('PRAGMA table_info(requests)').all().map((c) => c.name)
if (!reqCols.includes('link')) {
  db.exec('ALTER TABLE requests ADD COLUMN link TEXT')
}

// Siembra inicial: si la tabla está vacía, carga las compras de ejemplo.
const { n } = db.prepare('SELECT COUNT(*) AS n FROM purchases').get()
if (n === 0) {
  const insert = db.prepare(`
    INSERT INTO purchases
      (id, fecha, proyecto, categoria, descripcion, proveedor, metodo, estado, importe, recibo, pagadoPor, created_at)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const p of seedPurchases()) {
    insert.run(p.id, p.fecha, p.proyecto, p.categoria, p.descripcion, p.proveedor, p.metodo, p.estado, p.importe, null, null, p.fecha)
  }
}

export async function ping() {
  db.prepare('SELECT 1').get()
  return true
}

function rowToPurchase(row) {
  return {
    id: row.id,
    fecha: row.fecha,
    proyecto: row.proyecto,
    categoria: row.categoria,
    descripcion: row.descripcion,
    proveedor: row.proveedor,
    metodo: row.metodo,
    estado: row.estado,
    importe: row.importe,
    recibo: row.recibo ? JSON.parse(row.recibo) : null,
    pagadoPor: row.pagadoPor ?? null,
    creadoPor: row.creado_por ?? null,
  }
}

const EDITABLE = ['fecha', 'proyecto', 'categoria', 'descripcion', 'proveedor', 'metodo', 'estado', 'importe', 'recibo', 'pagadoPor']

export async function getAllPurchases() {
  const rows = db.prepare('SELECT * FROM purchases ORDER BY fecha DESC, created_at DESC').all()
  return rows.map(rowToPurchase)
}

export async function getPurchase(id) {
  const row = db.prepare('SELECT * FROM purchases WHERE id = ?').get(id)
  return row ? rowToPurchase(row) : null
}

export async function updatePurchase(id, fields) {
  const keys = Object.keys(fields).filter((k) => EDITABLE.includes(k))
  if (keys.length === 0) return getPurchase(id)

  const setClause = keys.map((k) => `${k} = ?`).join(', ')
  const values = keys.map((k) =>
    k === 'recibo' ? (fields.recibo ? JSON.stringify(fields.recibo) : null) : fields[k],
  )
  db.prepare(`UPDATE purchases SET ${setClause} WHERE id = ?`).run(...values, id)
  return getPurchase(id)
}

export async function insertPurchase(p) {
  db.prepare(`
    INSERT INTO purchases
      (id, fecha, proyecto, categoria, descripcion, proveedor, metodo, estado, importe, recibo, pagadoPor, creado_por, created_at)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    p.id,
    p.fecha,
    p.proyecto,
    p.categoria,
    p.descripcion,
    p.proveedor,
    p.metodo,
    p.estado,
    p.importe,
    p.recibo ? JSON.stringify(p.recibo) : null,
    p.pagadoPor ?? null,
    p.creadoPor ?? null,
    p.created_at,
  )
  return getPurchase(p.id)
}

export async function deletePurchase(id) {
  const info = db.prepare('DELETE FROM purchases WHERE id = ?').run(id)
  return info.changes > 0
}

// ── Solicitudes ──
function rowToRequest(row) {
  return {
    id: row.id,
    created_at: row.created_at,
    solicitante: row.solicitante,
    proyecto: row.proyecto,
    categoria: row.categoria,
    descripcion: row.descripcion,
    importeEstimado: row.importeEstimado ?? null,
    nota: row.nota ?? null,
    estado: row.estado,
    notaResponsable: row.notaResponsable ?? null,
    compraId: row.compraId ?? null,
    decidedAt: row.decidedAt ?? null,
    link: row.link ?? null,
    compraEstado: row.compraEstado ?? null, // estado de envío de la compra ligada
  }
}

const REQUESTS_SELECT = `
  SELECT r.*, p.estado AS compraEstado
  FROM requests r LEFT JOIN purchases p ON p.id = r.compraId
`

export async function getAllRequests() {
  const rows = db.prepare(`${REQUESTS_SELECT} ORDER BY r.created_at DESC`).all()
  return rows.map(rowToRequest)
}

export async function getRequest(id) {
  const row = db.prepare(`${REQUESTS_SELECT} WHERE r.id = ?`).get(id)
  return row ? rowToRequest(row) : null
}

export async function insertRequest(r) {
  db.prepare(`
    INSERT INTO requests
      (id, created_at, solicitante, proyecto, categoria, descripcion, importeEstimado, nota, estado, notaResponsable, compraId, decidedAt, link)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    r.id, r.created_at, r.solicitante, r.proyecto, r.categoria, r.descripcion,
    r.importeEstimado ?? null, r.nota ?? null, 'Pendiente', null, null, null, r.link ?? null,
  )
  return getRequest(r.id)
}

export async function rejectRequest(id, notaResponsable, decidedAt) {
  db.prepare('UPDATE requests SET estado = ?, notaResponsable = ?, decidedAt = ? WHERE id = ?')
    .run('Rechazada', notaResponsable ?? null, decidedAt, id)
  return getRequest(id)
}

export async function markRequestBought(id, compraId, decidedAt) {
  db.prepare('UPDATE requests SET estado = ?, compraId = ?, decidedAt = ? WHERE id = ?')
    .run('Comprada', compraId, decidedAt, id)
  return getRequest(id)
}

export async function deleteRequest(id) {
  const info = db.prepare('DELETE FROM requests WHERE id = ?').run(id)
  return info.changes > 0
}

// ── Usuarios ──
function rowToUser(row) {
  if (!row) return null
  return { id: row.id, email: row.email, nombre: row.nombre, role: row.role, created_at: row.created_at, password_hash: row.password_hash }
}
// Versión pública (sin el hash de la contraseña).
const publicUser = (u) => (u ? { id: u.id, email: u.email, nombre: u.nombre, role: u.role, created_at: u.created_at } : null)

export async function getUserByEmail(email) {
  return rowToUser(db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase()))
}
export async function getUserById(id) {
  return rowToUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id))
}
export async function getAllUsers() {
  return db.prepare('SELECT * FROM users ORDER BY created_at ASC').all().map((r) => publicUser(rowToUser(r)))
}
export async function countUsers() {
  return db.prepare('SELECT COUNT(*) AS n FROM users').get().n
}
export async function countAdmins() {
  return db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'manager'").get().n
}
export async function insertUser(u) {
  db.prepare('INSERT INTO users (id, email, nombre, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(u.id, u.email, u.nombre, u.password_hash, u.role, u.created_at)
  return publicUser(await getUserById(u.id))
}
export async function updateUserPassword(id, password_hash) {
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(password_hash, id)
  return publicUser(await getUserById(id))
}
export async function updateUserRole(id, role) {
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id)
  return publicUser(await getUserById(id))
}
export async function deleteUser(id) {
  const info = db.prepare('DELETE FROM users WHERE id = ?').run(id)
  return info.changes > 0
}
