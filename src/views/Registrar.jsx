import { useState } from 'react'
import { Check, Truck, Upload, FileText } from 'lucide-react'
import { PROYECTOS_FORM, CATEGORIAS, METODOS } from '../lib/constants.js'
import { useSettings } from '../lib/settings.jsx'

function todayISO() {
  const now = new Date()
  const tz = now.getTimezoneOffset() * 60000
  return new Date(now - tz).toISOString().slice(0, 10)
}

// Construye el estado del formulario: vacío para alta, o precargado para edición.
function buildForm(initial) {
  if (!initial) {
    return {
      importe: '',
      fecha: todayISO(),
      proyecto: '',
      categoria: '',
      proveedor: '',
      descripcion: '',
      metodo: 'Tarjeta corporativa',
      pagadoPor: '',
      estado: 'Recibido',
      recibo: null,
      errors: {},
    }
  }
  return {
    importe: String(initial.importe),
    fecha: initial.fecha,
    proyecto: initial.proyecto,
    categoria: initial.categoria,
    proveedor: initial.proveedor,
    descripcion: initial.descripcion,
    metodo: initial.metodo,
    pagadoPor: initial.pagadoPor ?? '',
    estado: initial.estado,
    recibo: initial.recibo,
    errors: {},
  }
}

const MAX_RECIBO_BYTES = 2 * 1024 * 1024 // 2 MB

export default function Registrar({ onSubmit, onCancel, initial = null, submitLabel = null }) {
  const { t, tProject, tCategory, tMethod, tStatus } = useSettings()
  const [form, setForm] = useState(() => buildForm(initial))
  const [reciboError, setReciboError] = useState('')

  // Update a field and clear its error.
  const update = (key, value) =>
    setForm((f) => ({ ...f, [key]: value, errors: { ...f.errors, [key]: false } }))

  const onRecibo = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    if (file.size > MAX_RECIBO_BYTES) {
      setReciboError(t('form.reciboError'))
      e.target.value = ''
      return
    }
    setReciboError('')
    const reader = new FileReader()
    reader.onload = () => update('recibo', { name: file.name, url: reader.result })
    reader.readAsDataURL(file)
  }

  const submit = () => {
    const imp = parseFloat(String(form.importe).replace(/[^0-9.]/g, ''))
    const errors = {
      importe: !(imp > 0),
      proyecto: !form.proyecto,
      categoria: !form.categoria,
      proveedor: !form.proveedor.trim(),
      descripcion: !form.descripcion.trim(),
    }
    if (Object.values(errors).some(Boolean)) {
      setForm((f) => ({ ...f, errors }))
      return
    }
    onSubmit({
      fecha: form.fecha,
      proyecto: form.proyecto,
      categoria: form.categoria,
      proveedor: form.proveedor.trim(),
      descripcion: form.descripcion.trim(),
      metodo: form.metodo,
      pagadoPor: form.pagadoPor.trim(),
      estado: form.estado,
      importe: imp,
      recibo: form.recibo,
    })
  }

  const req = <span className="field__required">*</span>

  return (
    <div className="form-screen">
      <div className="form-card">
        <div className="form-grid">
          {/* Importe */}
          <div>
            <label className="field__label">{t('form.importe')} {req}</label>
            <div className="amount-wrap">
              <span className="amount-prefix">$</span>
              <input
                className="input input--amount"
                inputMode="decimal"
                placeholder="0.00"
                value={form.importe}
                onChange={(e) => update('importe', e.target.value)}
              />
            </div>
            {form.errors.importe && <div className="field__error">{t('err.importe')}</div>}
          </div>

          {/* Fecha */}
          <div>
            <label className="field__label">{t('form.fecha')}</label>
            <input
              type="date"
              className="input"
              value={form.fecha}
              onChange={(e) => update('fecha', e.target.value)}
            />
          </div>

          {/* Proyecto */}
          <div>
            <label className="field__label">{t('form.proyecto')} {req}</label>
            <select
              className="select"
              value={form.proyecto}
              onChange={(e) => update('proyecto', e.target.value)}
            >
              <option value="">{t('form.selecciona')}</option>
              {PROYECTOS_FORM.map((p) => (
                <option key={p} value={p}>
                  {tProject(p)}
                </option>
              ))}
            </select>
            {form.errors.proyecto && <div className="field__error">{t('err.proyecto')}</div>}
          </div>

          {/* Categoría */}
          <div>
            <label className="field__label">{t('form.categoria')} {req}</label>
            <select
              className="select"
              value={form.categoria}
              onChange={(e) => update('categoria', e.target.value)}
            >
              <option value="">{t('form.selecciona')}</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {tCategory(c)}
                </option>
              ))}
            </select>
            {form.errors.categoria && <div className="field__error">{t('err.categoria')}</div>}
          </div>

          {/* Proveedor */}
          <div>
            <label className="field__label">{t('form.proveedor')} {req}</label>
            <input
              className="input"
              placeholder={t('form.ph.proveedor')}
              value={form.proveedor}
              onChange={(e) => update('proveedor', e.target.value)}
            />
            {form.errors.proveedor && <div className="field__error">{t('err.proveedor')}</div>}
          </div>

          {/* Método de pago */}
          <div>
            <label className="field__label">{t('form.metodo')}</label>
            <select
              className="select"
              value={form.metodo}
              onChange={(e) => update('metodo', e.target.value)}
            >
              {METODOS.map((m) => (
                <option key={m} value={m}>
                  {tMethod(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Pagado por */}
          <div>
            <label className="field__label">{t('form.pagadoPor')}</label>
            <input
              className="input"
              placeholder={t('form.ph.pagadoPor')}
              value={form.pagadoPor}
              onChange={(e) => update('pagadoPor', e.target.value)}
            />
          </div>
        </div>

        {/* Descripción */}
        <div className="field--full">
          <label className="field__label">{t('form.descripcion')} {req}</label>
          <textarea
            className="textarea"
            rows={2}
            placeholder={t('form.ph.descripcion')}
            value={form.descripcion}
            onChange={(e) => update('descripcion', e.target.value)}
          />
          {form.errors.descripcion && <div className="field__error">{t('err.descripcion')}</div>}
        </div>

        <div className="form-grid field--full">
          {/* Estado */}
          <div>
            <label className="field__label">{t('form.estado')}</label>
            <div className="segmented">
              <button
                type="button"
                className={`seg-btn${form.estado === 'Recibido' ? ' seg-btn--active' : ''}`}
                onClick={() => update('estado', 'Recibido')}
              >
                <Check aria-hidden />
                {tStatus('Recibido')}
              </button>
              <button
                type="button"
                className={`seg-btn${form.estado === 'En envío' ? ' seg-btn--active' : ''}`}
                onClick={() => update('estado', 'En envío')}
              >
                <Truck aria-hidden />
                {tStatus('En envío')}
              </button>
            </div>
          </div>

          {/* Comprobante / factura */}
          <div>
            <label className="field__label">{t('form.recibo')}</label>
            <label className="dropzone">
              <input type="file" accept="image/*,application/pdf" onChange={onRecibo} />
              {form.recibo ? (
                <div className="dropzone__preview">
                  {form.recibo.url.startsWith('data:image/') ? (
                    <img className="dropzone__thumb" src={form.recibo.url} alt="" />
                  ) : (
                    <FileText className="dropzone__fileicon" aria-hidden />
                  )}
                  <span className="dropzone__name">{form.recibo.name}</span>
                </div>
              ) : (
                <div className="dropzone__hint">
                  <Upload aria-hidden />
                  <span>{t('form.upload')}</span>
                </div>
              )}
            </label>
            {reciboError && <div className="field__error">{reciboError}</div>}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn--secondary" onClick={onCancel}>
            {t('form.cancel')}
          </button>
          <button type="button" className="btn btn--save" onClick={submit}>
            {submitLabel ?? (initial ? t('form.saveChanges') : t('form.save'))}
          </button>
        </div>
      </div>
    </div>
  )
}
