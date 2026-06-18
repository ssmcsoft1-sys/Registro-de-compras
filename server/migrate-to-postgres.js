// Migración OPCIONAL: copia las compras de la SQLite local (server/data/compras.db)
// a la base de datos Postgres indicada por DATABASE_URL. Seguro de re-ejecutar:
// las compras que ya existan (mismo id) se omiten.
//
// Uso (con DATABASE_URL ya configurada en el entorno o en .env):
//   node --disable-warning=ExperimentalWarning server/migrate-to-postgres.js

import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'
import { existsSync } from 'node:fs'
import pg from 'pg'

if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL. Define la conexión a Postgres antes de migrar.')
  process.exit(1)
}

const DB_PATH = path.join(import.meta.dirname, 'data', 'compras.db')
if (!existsSync(DB_PATH)) {
  console.error(`No se encontró la base local en ${DB_PATH}. Nada que migrar.`)
  process.exit(1)
}

const sqlite = new DatabaseSync(DB_PATH)
const rows = sqlite.prepare('SELECT * FROM purchases').all()
console.log(`Compras locales encontradas: ${rows.length}`)

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

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

let inserted = 0
for (const r of rows) {
  const result = await pool.query(
    `INSERT INTO purchases
      (id, fecha, proyecto, categoria, descripcion, proveedor, metodo, estado, importe, recibo, pagado_por, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (id) DO NOTHING`,
    [
      r.id, r.fecha, r.proyecto, r.categoria, r.descripcion, r.proveedor,
      r.metodo, r.estado, r.importe, r.recibo ?? null, r.pagadoPor ?? null,
      r.created_at ?? r.fecha,
    ],
  )
  inserted += result.rowCount
}

console.log(`Migración completa. Compras nuevas insertadas: ${inserted} (las repetidas se omitieron).`)
await pool.end()
