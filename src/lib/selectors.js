// Derived calculations, recomputed from `purchases`.
// Ported verbatim from the prototype's renderVals(); all logic is
// framework-agnostic. Components wrap these in useMemo.

import {
  PROYECTOS,
  PROYECTO_TODOS,
  CATEGORIAS,
  PROJ_COLORS,
  CAT_COLORS,
  MONTH_KEYS,
} from './constants.js'

// Mes actual en formato 'YYYY-MM' (zona horaria local).
export function currentMonthKey() {
  const now = new Date()
  const tz = now.getTimezoneOffset() * 60000
  return new Date(now - tz).toISOString().slice(0, 7)
}

// Meses con datos (asc), unidos al rango conocido y al mes actual, sin repetir.
// Mantiene la gráfica con sentido aunque se registren compras en meses nuevos.
export function monthsFromPurchases(purchases) {
  const set = new Set([...MONTH_KEYS, currentMonthKey()])
  for (const p of purchases) set.add(p.fecha.slice(0, 7))
  return [...set].sort()
}

// Totals + status counts + average.
export function summarize(purchases) {
  const total = purchases.reduce((a, p) => a + p.importe, 0)
  const recibidas = purchases.filter((p) => p.estado === 'Recibido').length
  const enEnvio = purchases.filter((p) => p.estado === 'En envío').length
  const promedio = purchases.length ? total / purchases.length : 0
  return { total, count: purchases.length, recibidas, enEnvio, promedio }
}

// Spend per project — desc order, pct relative to the group max.
// Los 4 proyectos se muestran siempre; el bucket "Todos los proyectos" solo
// aparece si tiene gasto.
export function byProyecto(purchases) {
  const sums = PROYECTOS.map((label) => ({
    label,
    amount: purchases.filter((p) => p.proyecto === label).reduce((a, p) => a + p.importe, 0),
  }))

  const sharedAmount = purchases
    .filter((p) => p.proyecto === PROYECTO_TODOS)
    .reduce((a, p) => a + p.importe, 0)
  if (sharedAmount > 0) sums.push({ label: PROYECTO_TODOS, amount: sharedAmount })

  sums.sort((a, b) => b.amount - a.amount)

  const max = Math.max(1, ...sums.map((x) => x.amount))
  return sums.map((x) => ({
    label: x.label,
    amount: x.amount,
    pct: Math.max(3, Math.round((x.amount / max) * 100)),
    color: PROJ_COLORS[x.label],
  }))
}

// Spend per category — drops empty groups, desc order, pct relative to group max.
export function byCategoria(purchases) {
  const sums = CATEGORIAS.map((label) => ({
    label,
    amount: purchases.filter((p) => p.categoria === label).reduce((a, p) => a + p.importe, 0),
  }))
    .filter((x) => x.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  const max = Math.max(1, ...sums.map((x) => x.amount))
  return sums.map((x) => ({
    label: x.label,
    amount: x.amount,
    pct: Math.max(3, Math.round((x.amount / max) * 100)),
    color: CAT_COLORS[x.label] || '#b9b6e0',
  }))
}

// Spend per month, filtered by selected project ('all' | 'Proyecto N').
// Height is relative to the busiest month; bar fill depends on selection.
export function byMonth(purchases, monthProject) {
  const months = monthsFromPurchases(purchases)
  const sums = months.map((k) => ({
    month: +k.slice(5) - 1, // índice de mes (0-11) para traducir en la vista
    amount: purchases
      .filter((p) => p.fecha.slice(0, 7) === k && (monthProject === 'all' || p.proyecto === monthProject))
      .reduce((a, p) => a + p.importe, 0),
  }))

  const max = Math.max(1, ...sums.map((x) => x.amount))
  const barBg =
    monthProject === 'all' ? 'var(--yago-gradient-bar)' : PROJ_COLORS[monthProject]

  const bars = sums.map((x) => ({
    month: x.month,
    amount: x.amount,
    pct: Math.max(3, Math.round((x.amount / max) * 100)),
    barBg,
  }))

  return { bars }
}

// Historial: combinable filters (mes + proyecto + categoría + búsqueda),
// ordered by date desc. Returns rows + filtered total.
export function filterRows(purchases, { q, fMonth, fProyecto, fCategoria }) {
  let rows = purchases.slice()
  if (fMonth !== 'all') rows = rows.filter((p) => p.fecha.slice(0, 7) === fMonth)
  if (fProyecto !== 'all') rows = rows.filter((p) => p.proyecto === fProyecto)
  if (fCategoria !== 'all') rows = rows.filter((p) => p.categoria === fCategoria)
  if (q.trim()) {
    const needle = q.toLowerCase()
    rows = rows.filter((p) =>
      `${p.descripcion} ${p.proveedor}`.toLowerCase().includes(needle),
    )
  }
  rows.sort((a, b) => b.fecha.localeCompare(a.fecha))

  const total = rows.reduce((a, p) => a + p.importe, 0)
  return { rows, total }
}
