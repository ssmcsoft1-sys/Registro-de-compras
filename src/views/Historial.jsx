import { useMemo, useState } from 'react'
import { Search, X, Check, Truck, Inbox, Trash2, Pencil, Receipt, Download } from 'lucide-react'
import { fmtMoney, fmtDate, projShort } from '../lib/format.js'
import { filterRows, monthsFromPurchases, currentMonthKey } from '../lib/selectors.js'
import { PROYECTOS_FORM, CATEGORIAS, PROJ_COLORS, MES_LARGO } from '../lib/constants.js'
import Registrar from './Registrar.jsx'

const ALL_FILTERS = { q: '', fMonth: 'all', fProyecto: 'all', fCategoria: 'all' }
// Al abrir, mostramos solo el mes actual.
const initialFilters = () => ({ ...ALL_FILTERS, fMonth: currentMonthKey() })

// Etiqueta de estado, clicable para alternar Recibido ⇄ En envío.
function StatusChip({ estado, onToggle }) {
  const recibido = estado === 'Recibido'
  return (
    <button
      type="button"
      className={`status-chip status-chip--btn ${recibido ? 'status-chip--recibido' : 'status-chip--envio'}`}
      onClick={onToggle}
      title={recibido ? 'Marcar como En envío' : 'Marcar como Recibido'}
    >
      {recibido ? <Check aria-hidden /> : <Truck aria-hidden />}
      {estado}
    </button>
  )
}

const isImage = (url) => url.startsWith('data:image/')

// Línea secundaria: proveedor y, si se indicó, quién hizo el pago.
const subLabel = (r) => (r.pagadoPor ? `${r.proveedor} · Pagó: ${r.pagadoPor}` : r.proveedor)

export default function Historial({ purchases, onDelete, onEdit }) {
  const [filters, setFilters] = useState(initialFilters)
  const [editing, setEditing] = useState(null)
  const [receipt, setReceipt] = useState(null)
  const set = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }))

  const { rows, total } = useMemo(() => filterRows(purchases, filters), [purchases, filters])

  // Opciones de mes derivadas de los datos (incluye el mes actual), más recientes primero.
  const monthOptions = useMemo(() => {
    const opts = monthsFromPurchases(purchases)
      .map((k) => ({ value: k, label: `${MES_LARGO[+k.slice(5) - 1]} ${k.slice(0, 4)}` }))
      .reverse()
    return [{ value: 'all', label: 'Todos los meses' }, ...opts]
  }, [purchases])

  const handleDelete = (row) => {
    const ok = window.confirm(
      `¿Eliminar esta compra?\n\n${row.descripcion}\n${fmtDate(row.fecha)} · ${fmtMoney(row.importe)}\n\nEsta acción no se puede deshacer.`,
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
            placeholder="Buscar descripción o proveedor"
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
          <option value="all">Todos los proyectos</option>
          {PROYECTOS_FORM.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select className="filter-select" value={filters.fCategoria} onChange={set('fCategoria')}>
          <option value="all">Todas las categorías</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Results summary */}
      <div className="results-bar">
        <span className="results-summary">
          {rows.length} compras · <span className="results-total">{fmtMoney(total)}</span>
        </span>
        <button type="button" className="btn btn--ghost" onClick={() => setFilters(ALL_FILTERS)}>
          <X size={14} aria-hidden />
          Limpiar filtros
        </button>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-head">
          <span>FECHA</span>
          <span>PROYECTO</span>
          <span>CATEGORÍA</span>
          <span>MÉTODO</span>
          <span>DESCRIPCIÓN</span>
          <span className="num">IMPORTE</span>
          <span>ESTADO</span>
          <span className="sr-only">ACCIONES</span>
        </div>

        {rows.length > 0 ? (
          rows.map((r) => (
            <div className="table-row" key={r.id}>
              <span className="cell-date">{fmtDate(r.fecha)}</span>
              <span className="cell-proj">
                <span className="cell-proj__dot" style={{ '--c': PROJ_COLORS[r.proyecto] }} />
                {projShort(r.proyecto)}
              </span>
              <span className="cell-cat" title={r.categoria}>{r.categoria}</span>
              <span className="cell-method" title={r.metodo}>{r.metodo}</span>
              <div className="cell-desc">
                <div className="cell-desc__main" title={r.descripcion}>{r.descripcion}</div>
                <div className="cell-desc__sub" title={subLabel(r)}>{subLabel(r)}</div>
              </div>
              <span className="cell-amount">{fmtMoney(r.importe)}</span>
              <StatusChip estado={r.estado} onToggle={() => toggleEstado(r)} />
              <div className="row-actions">
                {r.recibo && (
                  <button
                    type="button"
                    className="row-action"
                    onClick={() => setReceipt(r)}
                    aria-label={`Ver comprobante de: ${r.descripcion}`}
                    title="Ver comprobante"
                  >
                    <Receipt aria-hidden />
                  </button>
                )}
                <button
                  type="button"
                  className="row-action"
                  onClick={() => setEditing(r)}
                  aria-label={`Editar compra: ${r.descripcion}`}
                  title="Editar compra"
                >
                  <Pencil aria-hidden />
                </button>
                <button
                  type="button"
                  className="row-action row-action--danger"
                  onClick={() => handleDelete(r)}
                  aria-label={`Eliminar compra: ${r.descripcion}`}
                  title="Eliminar compra"
                >
                  <Trash2 aria-hidden />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty">
            <Inbox aria-hidden />
            <div className="empty__title">Sin resultados</div>
            <div className="empty__sub">Prueba a cambiar los filtros</div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head">
              <h2 className="modal__title">Editar compra</h2>
              <button
                type="button"
                className="modal__close"
                onClick={() => setEditing(null)}
                aria-label="Cerrar"
              >
                <X aria-hidden />
              </button>
            </div>
            <Registrar
              initial={editing}
              submitLabel="Guardar cambios"
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
              <h2 className="modal__title">Comprobante · {receipt.descripcion}</h2>
              <div className="modal__actions">
                <a
                  className="receipt-download"
                  href={receipt.recibo.url}
                  download={receipt.recibo.name}
                >
                  <Download aria-hidden />
                  Descargar
                </a>
                <button
                  type="button"
                  className="modal__close"
                  onClick={() => setReceipt(null)}
                  aria-label="Cerrar"
                >
                  <X aria-hidden />
                </button>
              </div>
            </div>
            <div className="receipt-view">
              {isImage(receipt.recibo.url) ? (
                <img src={receipt.recibo.url} alt={receipt.recibo.name} />
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
