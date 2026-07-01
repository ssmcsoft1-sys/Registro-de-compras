import { useState } from 'react'
import { X, Trash2, ShoppingCart, Send, ExternalLink } from 'lucide-react'
import { PROYECTOS_FORM, CATEGORIAS } from '../lib/constants.js'
import { useSettings } from '../lib/settings.jsx'
import Registrar from './Registrar.jsx'

function todayISO() {
  const now = new Date()
  const tz = now.getTimezoneOffset() * 60000
  return new Date(now - tz).toISOString().slice(0, 10)
}

const emptyForm = () => ({ proyecto: '', categoria: '', descripcion: '', cantidad: '', importeEstimado: '', nota: '', link: '' })

// Asegura que el enlace tenga protocolo para que abra correctamente.
const hrefOf = (link) => (/^https?:\/\//i.test(link) ? link : `https://${link}`)

function StatusBadge({ r }) {
  const { tReqStatus, tStatus } = useSettings()
  const cls =
    r.estado === 'Comprada' ? 'sol-badge--bought' : r.estado === 'Rechazada' ? 'sol-badge--rejected' : 'sol-badge--pending'
  let text = tReqStatus(r.estado)
  if (r.estado === 'Comprada' && r.compraEstado) text += ` · ${tStatus(r.compraEstado)}`
  return <span className={`sol-badge ${cls}`}>{text}</span>
}

export default function Solicitudes({ requests, role, onCreate, onReject, onBuy, onDelete }) {
  const { t, money, formatDate, tProject, tCategory } = useSettings()
  const isManager = role === 'manager'
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [buying, setBuying] = useState(null) // solicitud que se está comprando

  const upd = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: false }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const errs = {
      proyecto: !form.proyecto,
      categoria: !form.categoria,
      descripcion: !form.descripcion.trim(),
    }
    if (Object.values(errs).some(Boolean)) return setErrors(errs)
    const ok = await onCreate({
      proyecto: form.proyecto,
      categoria: form.categoria,
      descripcion: form.descripcion.trim(),
      cantidad: form.cantidad,
      importeEstimado: form.importeEstimado,
      nota: form.nota.trim(),
      link: form.link.trim(),
    })
    if (ok) setForm(emptyForm())
  }

  const reject = (r) => {
    const nota = window.prompt(t('sol.rejectPrompt'), '')
    if (nota === null) return // canceló
    onReject(r.id, nota)
  }

  const remove = (r) => {
    if (window.confirm(t('sol.deleteConfirm'))) onDelete(r.id)
  }

  // Datos para precargar el formulario de compra desde una solicitud.
  const buyInitial = (r) => ({
    importe: r.importeEstimado ?? '',
    fecha: todayISO(),
    proyecto: r.proyecto,
    categoria: r.categoria,
    descripcion: r.descripcion,
    proveedor: '',
    metodo: 'Tarjeta corporativa',
    pagadoPor: '',
    estado: 'Recibido',
    recibo: null,
  })

  return (
    <div className="solicitudes">
      {/* Formulario de nueva solicitud (solo equipo) */}
      {!isManager && (
        <form className="form-card sol-form" onSubmit={submit}>
          <h3 className="card__title sol-form__title">{t('sol.new')}</h3>
          <div className="form-grid">
            <div>
              <label className="field__label">{t('sol.cantidad')}</label>
              <input
                className="input"
                type="number"
                min="1"
                step="1"
                placeholder="1"
                value={form.cantidad}
                onChange={(e) => upd('cantidad', e.target.value)}
              />
            </div>
            <div>
              <label className="field__label">{t('sol.importeEstimado')}</label>
              <div className="amount-wrap">
                <span className="amount-prefix">$</span>
                <input
                  className="input input--amount"
                  inputMode="decimal"
                  placeholder="0"
                  value={form.importeEstimado}
                  onChange={(e) => upd('importeEstimado', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="field__label">{t('form.proyecto')} <span className="field__required">*</span></label>
              <select className="select" value={form.proyecto} onChange={(e) => upd('proyecto', e.target.value)}>
                <option value="">{t('form.selecciona')}</option>
                {PROYECTOS_FORM.map((p) => (
                  <option key={p} value={p}>{tProject(p)}</option>
                ))}
              </select>
              {errors.proyecto && <div className="field__error">{t('err.proyecto')}</div>}
            </div>
            <div>
              <label className="field__label">{t('form.categoria')} <span className="field__required">*</span></label>
              <select className="select" value={form.categoria} onChange={(e) => upd('categoria', e.target.value)}>
                <option value="">{t('form.selecciona')}</option>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>{tCategory(c)}</option>
                ))}
              </select>
              {errors.categoria && <div className="field__error">{t('err.categoria')}</div>}
            </div>
          </div>

          <div className="field--full">
            <label className="field__label">{t('form.descripcion')} <span className="field__required">*</span></label>
            <textarea
              className="textarea"
              rows={2}
              placeholder={t('form.ph.descripcion')}
              value={form.descripcion}
              onChange={(e) => upd('descripcion', e.target.value)}
            />
            {errors.descripcion && <div className="field__error">{t('err.descripcion')}</div>}
          </div>

          <div className="field--full">
            <label className="field__label">{t('sol.nota')}</label>
            <textarea
              className="textarea"
              rows={2}
              placeholder={t('sol.ph.nota')}
              value={form.nota}
              onChange={(e) => upd('nota', e.target.value)}
            />
          </div>

          <div className="field--full">
            <label className="field__label">{t('sol.link')}</label>
            <input
              className="input"
              type="url"
              placeholder={t('sol.ph.link')}
              value={form.link}
              onChange={(e) => upd('link', e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn--save">
              <Send size={16} aria-hidden /> {t('sol.create')}
            </button>
          </div>
        </form>
      )}

      {/* Lista de solicitudes */}
      <div className="sol-list">
        {requests.length === 0 ? (
          <div className="empty">
            <Send aria-hidden />
            <div className="empty__title">{t('sol.empty.title')}</div>
            <div className="empty__sub">{t('sol.empty.sub')}</div>
          </div>
        ) : (
          requests.map((r) => (
            <div className="sol-card" key={r.id}>
              <div className="sol-card__main">
                <div className="sol-card__title">{r.descripcion}</div>
                <div className="sol-meta">
                  {t('sol.by', { name: r.solicitante })} · {formatDate(r.created_at.slice(0, 10))} ·{' '}
                  {tProject(r.proyecto)} · {tCategory(r.categoria)}
                  {r.cantidad ? ` · ${t('sol.cantidad')}: ${r.cantidad}` : ''}
                  {r.importeEstimado ? ` · ${t('sol.estimated', { amount: money(r.importeEstimado) })}` : ''}
                </div>
                {r.link && (
                  <a className="sol-link" href={hrefOf(r.link)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={13} aria-hidden /> {t('sol.viewLink')}
                  </a>
                )}
                {r.nota && <div className="sol-note">“{r.nota}”</div>}
                {r.estado === 'Rechazada' && r.notaResponsable && (
                  <div className="sol-note sol-note--manager">
                    {t('sol.managerNote', { nota: r.notaResponsable })}
                  </div>
                )}
              </div>

              <div className="sol-card__side">
                <StatusBadge r={r} />
                {isManager && r.estado === 'Pendiente' && (
                  <div className="sol-actions">
                    <button type="button" className="btn btn--save btn--sm" onClick={() => setBuying(r)}>
                      <ShoppingCart size={15} aria-hidden /> {t('sol.buy')}
                    </button>
                    <button type="button" className="btn btn--secondary btn--sm" onClick={() => reject(r)}>
                      {t('sol.reject')}
                    </button>
                  </div>
                )}
                {isManager && (
                  <button
                    type="button"
                    className="row-action row-action--danger"
                    onClick={() => remove(r)}
                    title={t('sol.delete')}
                    aria-label={t('sol.delete')}
                  >
                    <Trash2 aria-hidden />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de compra (responsable) */}
      {buying && (
        <div className="modal-overlay" onClick={() => setBuying(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head">
              <h2 className="modal__title">{t('sol.buyTitle')}</h2>
              <button type="button" className="modal__close" onClick={() => setBuying(null)} aria-label={t('hist.close')}>
                <X aria-hidden />
              </button>
            </div>
            <Registrar
              initial={buyInitial(buying)}
              submitLabel={t('sol.buy')}
              onCancel={() => setBuying(null)}
              onSubmit={async (fields) => {
                const ok = await onBuy(buying.id, fields)
                if (ok) setBuying(null)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
