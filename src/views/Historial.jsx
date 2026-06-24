import { useMemo, useState } from 'react'
import { Search, X, Check, Truck, Inbox, Trash2, Pencil, Receipt, Download, ZoomIn, ZoomOut } from 'lucide-react'
import { filterRows, monthsFromPurchases, currentMonthKey } from '../lib/selectors.js'
import { PROYECTOS_FORM, CATEGORIAS, PROJ_COLORS } from '../lib/constants.js'
import { useSettings } from '../lib/settings.jsx'
import Registrar from './Registrar.jsx'

const ALL_FILTERS = { q: '', fMonth: 'all', fProyecto: 'all', fCategoria: 'all' }
// Al abrir, mostramos solo el mes actual.
const initialFilters = () => ({ ...ALL_FILTERS, fMonth: currentMonthKey() })

const isImage = (url) => url.startsWith('data:image/')

// Etiqueta de estado, clicable para alternar Recibido ⇄ En envío.
function StatusChip({ estado, onToggle }) {
  const { t, tStatus } = useSettings()
  const recibido = estado === 'Recibido'
  return (
    <button
      type="button"
      className={`status-chip status-chip--btn ${recibido ? 'status-chip--recibido' : 'status-chip--envio'}`}
      onClick={onToggle}
      title={recibido ? t('hist.statusToTransit') : t('hist.statusToReceived')}
    >
      {recibido ? <Check aria-hidden /> : <Truck aria-hidden />}
      {tStatus(estado)}
    </button>
  )
}

export default function Historial({ purchases, onDelete, onEdit }) {
  const { t, money, formatDate, monthsLong, tProject, tCategory, tMethod, projShort } = useSettings()
  const [filters, setFilters] = useState(initialFilters)
  const [editing, setEditing] = useState(null)
  const [receipt, setReceipt] = useState(null)
  const [zoom, setZoom] = useState(1)

  const openReceipt = (r) => {
    setZoom(1)
    setReceipt(r)
  }
  const set = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }))

  const { rows, total } = useMemo(() => filterRows(purchases, filters), [purchases, filters])

  // Opciones de mes derivadas de los datos (incluye el mes actual), más recientes primero.
  const monthOptions = useMemo(() => {
    const opts = monthsFromPurchases(purchases)
      .map((k) => ({ value: k, label: `${monthsLong[+k.slice(5) - 1]} ${k.slice(0, 4)}` }))
      .reverse()
    return [{ value: 'all', label: t('hist.allMonths') }, ...opts]
  }, [purchases, monthsLong, t])

  const subLabel = (r) => {
    let s = r.proveedor
    if (r.pagadoPor) s += ` · ${t('hist.paidBy')}: ${r.pagadoPor}`
    if (r.creadoPor) s += ` · ${t('hist.createdBy')}: ${r.creadoPor.split('@')[0]}`
    return s
  }

  const handleDelete = (row) => {
    const ok = window.confirm(
      t('hist.deleteConfirm', {
        desc: row.descripcion,
        date: formatDate(row.fecha),
        amount: money(row.importe),
      }),
    )
    if (ok) onDelete(row.id)
  }

  const toggleEstado = (row) => {
    onEdit(row.id, { estado: row.estado === 'Recibido' ? 'En envío' : 'Recibido' })
  }

  return (
    <div>
      {/* Filters */}
      <div className="filters">
        <div className="search">
          <Search className="search__icon" aria-hidden />
          <input
            className="search__input"
            placeholder={t('hist.search')}
            value={filters.q}
            onChange={set('q')}
          />
        </div>
        <select className="filter-select" value={filters.fMonth} onChange={set('fMonth')}>
          {monthOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select className="filter-select" value={filters.fProyecto} onChange={set('fProyecto')}>
          <option value="all">{t('hist.allProjects')}</option>
          {PROYECTOS_FORM.map((p) => (
            <option key={p} value={p}>
              {tProject(p)}
            </option>
          ))}
        </select>
        <select className="filter-select" value={filters.fCategoria} onChange={set('fCategoria')}>
          <option value="all">{t('hist.allCategories')}</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {tCategory(c)}
            </option>
          ))}
        </select>
      </div>

      {/* Results summary */}
      <div className="results-bar">
        <span className="results-summary">
          {rows.length} {t('common.purchases')} · <span className="results-total">{money(total)}</span>
        </span>
        <button type="button" className="btn btn--ghost" onClick={() => setFilters(ALL_FILTERS)}>
          <X size={14} aria-hidden />
          {t('hist.clear')}
        </button>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-head">
          <span>{t('hist.col.fecha')}</span>
          <span>{t('hist.col.proyecto')}</span>
          <span>{t('hist.col.categoria')}</span>
          <span>{t('hist.col.metodo')}</span>
          <span>{t('hist.col.descripcion')}</span>
          <span className="num">{t('hist.col.importe')}</span>
          <span>{t('hist.col.estado')}</span>
          <span className="sr-only">{t('hist.edit')}</span>
        </div>

        {rows.length > 0 ? (
          rows.map((r) => (
            <div className="table-row" key={r.id}>
              <span className="cell-date">{formatDate(r.fecha)}</span>
              <span className="cell-proj">
                <span className="cell-proj__dot" style={{ '--c': PROJ_COLORS[r.proyecto] }} />
                {projShort(r.proyecto)}
              </span>
              <span className="cell-cat" title={tCategory(r.categoria)}>{tCategory(r.categoria)}</span>
              <span className="cell-method" title={tMethod(r.metodo)}>{tMethod(r.metodo)}</span>
              <div className="cell-desc">
                <div className="cell-desc__main" title={r.descripcion}>{r.descripcion}</div>
                <div className="cell-desc__sub" title={subLabel(r)}>{subLabel(r)}</div>
              </div>
              <span className="cell-amount">{money(r.importe)}</span>
              <StatusChip estado={r.estado} onToggle={() => toggleEstado(r)} />
              <div className="row-actions">
                {r.recibo && (
                  <button
                    type="button"
                    className="row-action"
                    onClick={() => openReceipt(r)}
                    aria-label={t('hist.viewReceipt')}
                    title={t('hist.viewReceipt')}
                  >
                    <Receipt aria-hidden />
                  </button>
                )}
                <button
                  type="button"
                  className="row-action"
                  onClick={() => setEditing(r)}
                  aria-label={t('hist.edit')}
                  title={t('hist.edit')}
                >
                  <Pencil aria-hidden />
                </button>
                <button
                  type="button"
                  className="row-action row-action--danger"
                  onClick={() => handleDelete(r)}
                  aria-label={t('hist.delete')}
                  title={t('hist.delete')}
                >
                  <Trash2 aria-hidden />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty">
            <Inbox aria-hidden />
            <div className="empty__title">{t('hist.empty.title')}</div>
            <div className="empty__sub">{t('hist.empty.sub')}</div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head">
              <h2 className="modal__title">{t('hist.edit')}</h2>
              <button
                type="button"
                className="modal__close"
                onClick={() => setEditing(null)}
                aria-label={t('hist.close')}
              >
                <X aria-hidden />
              </button>
            </div>
            <Registrar
              initial={editing}
              onCancel={() => setEditing(null)}
              onSubmit={async (fields) => {
                const ok = await onEdit(editing.id, fields)
                if (ok) setEditing(null)
              }}
            />
          </div>
        </div>
      )}

      {/* Receipt viewer */}
      {receipt && (
        <div className="modal-overlay" onClick={() => setReceipt(null)}>
          <div className="modal modal--receipt" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head">
              <h2 className="modal__title">{t('hist.receipt')} · {receipt.descripcion}</h2>
              <div className="modal__actions">
                {isImage(receipt.recibo.url) && (
                  <div className="zoom-controls">
                    <button
                      type="button"
                      className="zoom-btn"
                      onClick={() => setZoom((z) => Math.max(1, Math.round((z - 0.5) * 10) / 10))}
                      aria-label="Zoom -"
                    >
                      <ZoomOut aria-hidden />
                    </button>
                    <span className="zoom-level">{Math.round(zoom * 100)}%</span>
                    <button
                      type="button"
                      className="zoom-btn"
                      onClick={() => setZoom((z) => Math.min(4, Math.round((z + 0.5) * 10) / 10))}
                      aria-label="Zoom +"
                    >
                      <ZoomIn aria-hidden />
                    </button>
                  </div>
                )}
                <a
                  className="receipt-download"
                  href={receipt.recibo.url}
                  download={receipt.recibo.name}
                >
                  <Download aria-hidden />
                  {t('hist.download')}
                </a>
                <button
                  type="button"
                  className="modal__close"
                  onClick={() => setReceipt(null)}
                  aria-label={t('hist.close')}
                >
                  <X aria-hidden />
                </button>
              </div>
            </div>
            <div className="receipt-view">
              {isImage(receipt.recibo.url) ? (
                <img
                  src={receipt.recibo.url}
                  alt={receipt.recibo.name}
                  style={{
                    maxWidth: `${zoom * 100}%`,
                    maxHeight: `${zoom * 76}vh`,
                    cursor: zoom > 1 ? 'zoom-out' : 'zoom-in',
                  }}
                  onClick={() => setZoom((z) => (z > 1 ? 1 : 2))}
                />
              ) : (
                <iframe
                  className="receipt-view__pdf"
                  src={receipt.recibo.url}
                  title={receipt.recibo.name}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
