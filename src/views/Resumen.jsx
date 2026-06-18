import { useMemo, useState } from 'react'
import { Calendar, Folder, Tag, BarChart3 } from 'lucide-react'
import {
  summarize,
  byProyecto,
  byCategoria,
  byMonth,
  monthsFromPurchases,
  currentMonthKey,
} from '../lib/selectors.js'
import { PROYECTOS } from '../lib/constants.js'
import { useSettings } from '../lib/settings.jsx'

// One label + amount row with a horizontal track; used for project & category breakdowns.
function HorizontalBars({ items, money, emptyText }) {
  if (items.length === 0) {
    return <div className="bars-empty">{emptyText}</div>
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
            <span className="bar-row__amount">{money(b.amount)}</span>
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
  const { t, money, monthsLong, months, tProject, tCategory } = useSettings()
  const [scope, setScope] = useState(currentMonthKey) // 'all' | 'YYYY-MM'
  const [monthProject, setMonthProject] = useState('all')

  const scoped = useMemo(
    () => (scope === 'all' ? purchases : purchases.filter((p) => p.fecha.slice(0, 7) === scope)),
    [purchases, scope],
  )

  const summary = useMemo(() => summarize(scoped), [scoped])
  const proyecto = useMemo(
    () => byProyecto(scoped).map((b) => ({ ...b, label: tProject(b.label) })),
    [scoped, tProject],
  )
  const categoria = useMemo(
    () => byCategoria(scoped).map((b) => ({ ...b, label: tCategory(b.label) })),
    [scoped, tCategory],
  )
  const monthChart = useMemo(() => byMonth(purchases, monthProject), [purchases, monthProject])

  const monthLabel = (key) => `${monthsLong[+key.slice(5) - 1]} ${key.slice(0, 4)}`
  const monthOptions = useMemo(
    () => monthsFromPurchases(purchases).map((k) => ({ value: k, label: monthLabel(k) })).reverse(),
    [purchases, monthsLong],
  )

  const scopeLabel = scope === 'all' ? t('resumen.allPeriod') : monthLabel(scope)
  const chips = ['all', ...PROYECTOS]
  const caption =
    monthProject === 'all'
      ? t('resumen.captionAll')
      : t('resumen.captionProject', { project: tProject(monthProject) })

  return (
    <div className="resumen">
      {/* Selector de mes (alcance del resumen) */}
      <div className="period-picker">
        <Calendar aria-hidden />
        <select
          className="period-select"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          aria-label="Mes"
        >
          <option value="all">{t('resumen.allPeriod')}</option>
          {monthOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Hero — TOTAL GASTADO */}
      <section className="hero">
        <div>
          <div className="hero__overline">{t('resumen.totalSpent')}</div>
          <div className="hero__total">{money(summary.total)}</div>
          <div className="hero__foot">
            {scopeLabel} · {summary.count} {t('common.purchases')}
          </div>
        </div>
        <div className="hero__kpis">
          <div>
            <div className="kpi__value">{summary.recibidas}</div>
            <div className="kpi__label">{t('resumen.received')}</div>
          </div>
          <div>
            <div className="kpi__value">{summary.enEnvio}</div>
            <div className="kpi__label">{t('resumen.inTransit')}</div>
          </div>
          <div>
            <div className="kpi__value">{money(summary.promedio)}</div>
            <div className="kpi__label">{t('resumen.average')}</div>
          </div>
        </div>
      </section>

      {/* Breakdown cards */}
      <div className="grid-2">
        <section className="card">
          <div className="card__head">
            <Folder className="card__icon" aria-hidden />
            <h3 className="card__title">{t('resumen.byProject')}</h3>
          </div>
          <HorizontalBars items={proyecto} money={money} emptyText={t('resumen.noBars')} />
        </section>

        <section className="card">
          <div className="card__head">
            <Tag className="card__icon" aria-hidden />
            <h3 className="card__title">{t('resumen.byCategory')}</h3>
          </div>
          <HorizontalBars items={categoria} money={money} emptyText={t('resumen.noBars')} />
        </section>
      </div>

      {/* Monthly chart with project selector */}
      <section className="card">
        <div className="month-card__head">
          <div className="card__head" style={{ margin: 0 }}>
            <BarChart3 className="card__icon" aria-hidden />
            <h3 className="card__title">{t('resumen.byMonth')}</h3>
          </div>
          <div className="chips">
            {chips.map((key) => (
              <button
                key={key}
                type="button"
                className={`chip${monthProject === key ? ' chip--active' : ''}`}
                onClick={() => setMonthProject(key)}
              >
                {key === 'all' ? t('resumen.chipAll') : tProject(key)}
              </button>
            ))}
          </div>
        </div>

        <div className="month-chart">
          {monthChart.bars.map((m) => (
            <div className="month-col" key={m.month}>
              <div className="month-bar-wrap">
                <div className="month-bar" style={{ '--pct': `${m.pct}%`, '--bar-bg': m.barBg }} />
              </div>
              <span className="month-amount">{money(m.amount)}</span>
              <span className="month-label">{months[m.month]}</span>
            </div>
          ))}
        </div>

        <div className="card__caption">{caption}</div>
      </section>
    </div>
  )
}
