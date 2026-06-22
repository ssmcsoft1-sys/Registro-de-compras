// Adaptador Postgres (producción / nube). Usa la variable de entorno DATABASE_URL
// (Neon, Supabase, etc.). Expone la MISMA interfaz async que el adaptador SQLite.
// Nota: Postgres normaliza identificadores a minúsculas, por eso la columna es
// `pagado_por` y se mapea a `pagadoPor` en el modelo del frontend.

import pg from 'pg'
import { seedPurchases } from '../src/data/seed.js'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // requerido por Neon/Supabase
  max: 5,
  idleTimeoutMillis: 30000, // cierra conexiones ociosas (evita sockets muertos si Neon se suspende)
  connectionTimeoutMillis: 15000, // falla en 15s en vez de colgarse para siempre
  keepAlive: true,
})

// Evita que un error de cliente ocioso tumbe el proceso.
pool.on('error', (err) => console.error('Postgres pool error:', err.message))

export async function ping() {
  await pool.query('SELECT 1')
  return true
}

const EDITABLE = ['fecha', 'proyecto', 'categoria', 'descripcion', 'proveedor', 'metodo', 'estado', 'importe', 'recibo', 'pagadoPor']
const columnFor = (key) => (key === 'pagadoPor' ? 'pagado_por' : key)

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
    pagadoPor: row.pagado_por ?? null,
  }
}

// Inicialización: crea la tabla, migra la columna y siembra si está vacía.
await pool.query(`
  CREATE TABLE IF NOT EXISTS purchases (
    id          text PRIMARY KEY,
    fecha       text NOT NULL,
    proyecto    text NOT NULL,
    categoria   text NOT NULL,
    descripcion text NOT NULL,
    proveedor   text NOT NULL,
    metodo      text NOT NULL,
    estado      text NOT NULL,
    importe     double precision NOT NULL,
    recibo      text,
    pagado_por  text,
    created_at  text NOT NULL
  );
`)
await pool.query('ALTER TABLE purchases ADD COLUMN IF NOT EXISTS pagado_por text')

await pool.query(`
  CREATE TABLE IF NOT EXISTS requests (
    id               text PRIMARY KEY,
    created_at       text NOT NULL,
    solicitante      text NOT NULL,
    proyecto         text NOT NULL,
    categoria        text NOT NULL,
    descripcion      text NOT NULL,
    importe_estimado double precision,
    nota             text,
    estado           text NOT NULL,
    nota_responsable text,
    compra_id        text,
    decided_at       text
  );
`)

const { rows: countRows } = await pool.query('SELECT COUNT(*)::int AS n FROM purchases')
if (countRows[0].n === 0) {
  for (const p of seedPurchases()) {
    await pool.query(
      `INSERT INTO purchases
        (id, fecha, proyecto, categoria, descripcion, proveedor, metodo, estado, importe, recibo, pagado_por, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [p.id, p.fecha, p.proyecto, p.categoria, p.descripcion, p.proveedor, p.metodo, p.estado, p.importe, null, null, p.fecha],
    )
  }
}

export async function getAllPurchases() {
  const { rows } = await pool.query('SELECT * FROM purchases ORDER BY fecha DESC, created_at DESC')
  return rows.map(rowToPurchase)
}

export async function getPurchase(id) {
  const { rows } = await pool.query('SELECT * FROM purchases WHERE id = $1', [id])
  return rows[0] ? rowToPurchase(rows[0]) : null
}

export async function updatePurchase(id, fields) {
  const keys = Object.keys(fields).filter((k) => EDITABLE.includes(k))
  if (keys.length === 0) return getPurchase(id)

  const setClause = keys.map((k, i) => `${columnFor(k)} = $${i + 1}`).join(', ')
  const values = keys.map((k) =>
    k === 'recibo' ? (fields.recibo ? JSON.stringify(fields.recibo) : null) : fields[k],
  )
  await pool.query(`UPDATE purchases SET ${setClause} WHERE id = $${keys.length + 1}`, [...values, id])
  return getPurchase(id)
}

export async function insertPurchase(p) {
  await pool.query(
    `INSERT INTO purchases
      (id, fecha, proyecto, categoria, descripcion, proveedor, metodo, estado, importe, recibo, pagado_por, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
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
    ],
  )
  return getPurchase(p.id)
}

export async function deletePurchase(id) {
  const { rowCount } = await pool.query('DELETE FROM purchases WHERE id = $1', [id])
  return rowCount > 0
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
    importeEstimado: row.importe_estimado ?? null,
    nota: row.nota ?? null,
    estado: row.estado,
    notaResponsable: row.nota_responsable ?? null,
    compraId: row.compra_id ?? null,
    decidedAt: row.decided_at ?? null,
    compraEstado: row.compra_estado ?? null,
  }
}

const REQUESTS_SELECT = `
  SELECT r.*, p.estado AS compra_estado
  FROM requests r LEFT JOIN purchases p ON p.id = r.compra_id
`

export async function getAllRequests() {
  const { rows } = await pool.query(`${REQUESTS_SELECT} ORDER BY r.created_at DESC`)
  return rows.map(rowToRequest)
}

export async function getRequest(id) {
  const { rows } = await pool.query(`${REQUESTS_SELECT} WHERE r.id = $1`, [id])
  return rows[0] ? rowToRequest(rows[0]) : null
}

export async function insertRequest(r) {
  await pool.query(
    `INSERT INTO requests
      (id, created_at, solicitante, proyecto, categoria, descripcion, importe_estimado, nota, estado, nota_responsable, compra_id, decided_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [r.id, r.created_at, r.solicitante, r.proyecto, r.categoria, r.descripcion, r.importeEstimado ?? null, r.nota ?? null, 'Pendiente', null, null, null],
  )
  return getRequest(r.id)
}

export async function rejectRequest(id, notaResponsable, decidedAt) {
  await pool.query('UPDATE requests SET estado = $1, nota_responsable = $2, decided_at = $3 WHERE id = $4', [
    'Rechazada',
    notaResponsable ?? null,
    decidedAt,
    id,
  ])
  return getRequest(id)
}

export async function markRequestBought(id, compraId, decidedAt) {
  await pool.query('UPDATE requests SET estado = $1, compra_id = $2, decided_at = $3 WHERE id = $4', [
    'Comprada',
    compraId,
    decidedAt,
    id,
  ])
  return getRequest(id)
}

export async function deleteRequest(id) {
  const { rowCount } = await pool.query('DELETE FROM requests WHERE id = $1', [id])
  return rowCount > 0
}
