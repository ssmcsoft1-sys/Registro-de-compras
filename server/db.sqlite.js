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
    created_at  TEXT NOT NULL
  );
`)

// Migración: añade la columna pagadoPor a bases de datos ya existentes.
const cols = db.prepare('PRAGMA table_info(purchases)').all().map((c) => c.name)
if (!cols.includes('pagadoPor')) {
  db.exec('ALTER TABLE purchases ADD COLUMN pagadoPor TEXT')
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
      (id, fecha, proyecto, categoria, descripcion, proveedor, metodo, estado, importe, recibo, pagadoPor, created_at)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    p.created_at,
  )
  return getPurchase(p.id)
}

export async function deletePurchase(id) {
  const info = db.prepare('DELETE FROM purchases WHERE id = ?').run(id)
  return info.changes > 0
}
