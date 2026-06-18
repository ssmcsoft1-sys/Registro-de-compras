import { useMemo, useState } from 'react'
import { Calendar, Folder, Tag, BarChart3 } from 'lucide-react'
import { fmtMoney } from '../lib/format.js'
import {
  summarize,
  byProyecto,
  byCategoria,
  byMonth,
  monthsFromPurchases,
  currentMonthKey,
} from '../lib/selectors.js'
import { PROYECTOS, PERIOD_LABEL, MES_LARGO } from '../lib/constants.js'

function monthLabel(key) {
  return `${MES_LARGO[+key.slice(5) - 1]} ${key.slice(0, 4)}`
}

// One label + amount row with a horizontal track; used for project & category breakdowns.
function HorizontalBars({ items }) {
  if (items.length === 0) {
    return <div className="bars-empty">Sin gastos en este periodo.</div>
  }
  return (
    <>
      {items.map((b) => (
        <div className="bar-row" key={b.label}>
          <div className="bar-row__top">
            <span className="bar-row__label">
              <span className="bar-row__dot" style={{ '--c': b.color }} />
              {b.label}
            </span>
            <span className="bar-row__amount">{fmtMoney(b.amount)}</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ '--pct': `${b.pct}%`, '--c': b.color }} />
          </div>
        </div>
      ))}
    </>
  )
}

export default function Resumen({ purchases }) {
  const [scope, setScope] = useState(currentMonthKey) // 'all' | 'YYYY-MM' — alcance del resumen
  const [monthProject, setMonthProject] = useState('all') // selector de la gráfica mensual

  // Compras dentro del alcance elegido (un mes o todo el periodo).
  const scoped = useMemo(
    () => (scope === 'all' ? purchases : purchases.filter((p) => p.fecha.slice(0, 7) === scope)),
    [purchases, scope],
  )

  const summary = useMemo(() => summarize(scoped), [scoped])
  const proyecto = useMemo(() => byProyecto(scoped), [scoped])
  const categoria = useMemo(() => byCategoria(scoped), [scoped])
  const monthChart = useMemo(() => byMonth(purchases, monthProject), [purchases, monthProject])

  const monthOptions = useMemo(
    () => monthsFromPurchases(purchases).map((k) => ({ value: k, label: monthLabel(k) })).reverse(),
    [purchases],
  )

  const scopeLabel = scope === 'all' ? PERIOD_LABEL : monthLabel(scope)
  const chips = ['all', ...PROYECTOS]

  return (
    <div className="resumen">
      {/* Selector de mes (alcance del resumen) */}
      <div className="period-picker">
        <Calendar aria-hidden />
        <select
          className="period-select"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          aria-label="Mes a mostrar"
        >
          <option value="all">Todo el periodo</option>
          {monthOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Hero — TOTAL GASTADO (del alcance elegido) */}
      <section className="hero">
        <div>
          <div className="hero__overline">TOTAL GASTADO</div>
          <div className="hero__total">{fmtMoney(summary.total)}</div>
          <div className="hero__foot">
            {scopeLabel} · {summary.count} compras
          </div>
        </div>
        <div className="hero__kpis">
          <div>
            <div className="kpi__value">{summary.recibidas}</div>
            <div className="kpi__label">Recibidas</div>
          </div>
          <div>
            <div className="kpi__value">{summary.enEnvio}</div>
            <div className="kpi__label">En envío</div>
          </div>
          <div>
            <div className="kpi__value">{fmtMoney(summary.promedio)}</div>
            <div className="kpi__label">Promedio</div>
          </div>
        </div>
      </section>

      {/* Breakdown cards (del alcance elegido) */}
      <div className="grid-2">
        <section className="card">
          <div className="card__head">
            <Folder className="card__icon" aria-hidden />
            <h3 className="card__title">Gastos por proyecto</h3>
          </div>
          <HorizontalBars items={proyecto} />
        </section>

        <section className="card">
          <div className="card__head">
            <Tag className="card__icon" aria-hidden />
            <h3 className="card__title">Gastos por categoría</h3>
          </div>
          <HorizontalBars items={categoria} />
        </section>
      </div>

      {/* Monthly chart with project selector (siempre todos los meses) */}
      <section className="card">
        <div className="month-card__head">
          <div className="card__head" style={{ margin: 0 }}>
            <BarChart3 className="card__icon" aria-hidden />
            <h3 className="card__title">Gasto por mes</h3>
          </div>
          <div className="chips">
            {chips.map((key) => (
              <button
                key={key}
                type="button"
                className={`chip${monthProject === key ? ' chip--active' : ''}`}
                onClick={() => setMonthProject(key)}
              >
                {key === 'all' ? 'Todos' : key}
              </button>
            ))}
          </div>
        </div>

        <div className="month-chart">
          {monthChart.bars.map((m) => (
            <div className="month-col" key={m.label}>
              <div className="month-bar-wrap">
                <div className="month-bar" style={{ '--pct': `${m.pct}%`, '--bar-bg': m.barBg }} />
              </div>
              <span className="month-amount">{fmtMoney(m.amount)}</span>
              <span className="month-label">{m.label}</span>
            </div>
          ))}
        </div>

        <div className="card__caption">{monthChart.caption}</div>
      </section>
    </div>
  )
}
