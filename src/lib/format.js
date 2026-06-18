import { MES, PROYECTO_TODOS } from './constants.js'

// Peso, formato $1,234,567 — Intl es-MX, sin decimales en los resúmenes.
export function fmtMoney(n) {
  return '$' + Math.round(n).toLocaleString('es-MX')
}

// "2026-06-12" -> "12 jun 2026"
export function fmtDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${+d} ${MES[+m - 1]} ${y}`
}

// Etiqueta corta de proyecto para celdas estrechas: "Proyecto 1" -> "P1",
// "Todos los proyectos" -> "Todos".
export function projShort(proyecto) {
  if (proyecto === PROYECTO_TODOS) return 'Todos'
  return proyecto.replace('Proyecto ', 'P')
}
