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
    creadoPor: row.creado_por ?? null,
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
    creado_por  text,
    created_at  text NOT NULL
  );
`)
await pool.query('ALTER TABLE purchases ADD COLUMN IF NOT EXISTS pagado_por text')
await pool.query('ALTER TABLE purchases ADD COLUMN IF NOT EXISTS creado_por text')

await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id            text PRIMARY KEY,
    email         text NOT NULL UNIQUE,
    nombre        text NOT NULL,
    password_hash text NOT NULL,
    role          text NOT NULL,
    created_at    text NOT NULL
  );
`)

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
    decided_at       text,
    link             text,
    cantidad         integer
  );
`)
await pool.query('ALTER TABLE requests ADD COLUMN IF NOT EXISTS link text')
await pool.query('ALTER TABLE requests ADD COLUMN IF NOT EXISTS cantidad integer')

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
      (id, fecha, proyecto, categoria, descripcion, proveedor, metodo, estado, importe, recibo, pagado_por, creado_por, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
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
      p.creadoPor ?? null,
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
    link: row.link ?? null,
    cantidad: row.cantidad ?? null,
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
      (id, created_at, solicitante, proyecto, categoria, descripcion, importe_estimado, nota, estado, nota_responsable, compra_id, decided_at, link, cantidad)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [r.id, r.created_at, r.solicitante, r.proyecto, r.categoria, r.descripcion, r.importeEstimado ?? null, r.nota ?? null, 'Pendiente', null, null, null, r.link ?? null, r.cantidad ?? null],
  )
  return getRequest(r.id)
}

export async function updateRequest(id, f) {
  await pool.query(
    `UPDATE requests SET proyecto = $1, categoria = $2, descripcion = $3, importe_estimado = $4, nota = $5, link = $6, cantidad = $7 WHERE id = $8`,
    [f.proyecto, f.categoria, f.descripcion, f.importeEstimado ?? null, f.nota ?? null, f.link ?? null, f.cantidad ?? null, id],
  )
  return getRequest(id)
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

// ── Usuarios ──
const publicUser = (u) => (u ? { id: u.id, email: u.email, nombre: u.nombre, role: u.role, created_at: u.created_at } : null)

export async function getUserByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [String(email).toLowerCase()])
  return rows[0] ?? null
}
export async function getUserById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id])
  return rows[0] ?? null
}
export async function getAllUsers() {
  const { rows } = await pool.query('SELECT * FROM users ORDER BY created_at ASC')
  return rows.map(publicUser)
}
export async function countUsers() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM users')
  return rows[0].n
}
export async function countAdmins() {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM users WHERE role = 'manager'")
  return rows[0].n
}
export async function insertUser(u) {
  await pool.query('INSERT INTO users (id, email, nombre, password_hash, role, created_at) VALUES ($1,$2,$3,$4,$5,$6)', [
    u.id, u.email, u.nombre, u.password_hash, u.role, u.created_at,
  ])
  return publicUser(await getUserById(u.id))
}
export async function updateUserPassword(id, password_hash) {
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, id])
  return publicUser(await getUserById(id))
}
export async function updateUserRole(id, role) {
  await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, id])
  return publicUser(await getUserById(id))
}
export async function deleteUser(id) {
  const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id])
  return rowCount > 0
}
