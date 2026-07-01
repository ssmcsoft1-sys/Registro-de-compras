// Selector de base de datos:
//  - Si existe DATABASE_URL (nube) -> adaptador Postgres.
//  - Si no (desarrollo local)      -> adaptador SQLite.
// Ambos adaptadores exponen la misma interfaz async.

const adapter = process.env.DATABASE_URL
  ? await import('./db.postgres.js')
  : await import('./db.sqlite.js')

console.log(`  Base de datos: ${process.env.DATABASE_URL ? 'Postgres (nube)' : 'SQLite (local)'}`)

export const ping = adapter.ping
export const getAllPurchases = adapter.getAllPurchases
export const getPurchase = adapter.getPurchase
export const insertPurchase = adapter.insertPurchase
export const updatePurchase = adapter.updatePurchase
export const deletePurchase = adapter.deletePurchase

export const getAllRequests = adapter.getAllRequests
export const getRequest = adapter.getRequest
export const insertRequest = adapter.insertRequest
export const updateRequest = adapter.updateRequest
export const rejectRequest = adapter.rejectRequest
export const markRequestBought = adapter.markRequestBought
export const deleteRequest = adapter.deleteRequest

export const getUserByEmail = adapter.getUserByEmail
export const getUserById = adapter.getUserById
export const getAllUsers = adapter.getAllUsers
export const countUsers = adapter.countUsers
export const countAdmins = adapter.countAdmins
export const insertUser = adapter.insertUser
export const updateUserPassword = adapter.updateUserPassword
export const updateUserRole = adapter.updateUserRole
export const deleteUser = adapter.deleteUser
