import { useEffect, useState } from 'react'
import { UserPlus, Trash2, KeyRound } from 'lucide-react'
import { useSettings } from '../lib/settings.jsx'
import { fetchUsers, createUser, updateUser, deleteUser, AuthError } from '../lib/api.js'

const emptyForm = () => ({ email: '', nombre: '', role: 'team', password: '' })

export default function Usuarios({ currentEmail, onAuthError }) {
  const { t } = useSettings()
  const [users, setUsers] = useState([])
  const [status, setStatus] = useState('loading')
  const [form, setForm] = useState(emptyForm)
  const [msg, setMsg] = useState('')

  const handle = (e) => {
    if (e instanceof AuthError) onAuthError(e)
    setMsg(e.message || t('users.error'))
  }

  useEffect(() => {
    fetchUsers()
      .then((u) => {
        setUsers(u)
        setStatus('ready')
      })
      .catch((e) => {
        if (e instanceof AuthError) onAuthError(e)
        else setStatus('error')
      })
  }, [onAuthError])

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setMsg('')
    try {
      const created = await createUser({
        email: form.email.trim(),
        nombre: form.nombre.trim(),
        role: form.role,
        password: form.password,
      })
      setUsers((prev) => [...prev, created])
      setForm(emptyForm())
    } catch (err) {
      handle(err)
    }
  }

  const changeRole = async (u, role) => {
    setMsg('')
    try {
      const updated = await updateUser(u.id, { role })
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)))
    } catch (err) {
      handle(err)
    }
  }

  const resetPassword = async (u) => {
    const pwd = window.prompt(t('users.resetPrompt', { email: u.email }), '')
    if (!pwd) return
    setMsg('')
    try {
      await updateUser(u.id, { password: pwd })
      setMsg(t('users.passwordReset', { email: u.email }))
    } catch (err) {
      handle(err)
    }
  }

  const remove = async (u) => {
    if (!window.confirm(t('users.deleteConfirm', { email: u.email }))) return
    setMsg('')
    try {
      await deleteUser(u.id)
      setUsers((prev) => prev.filter((x) => x.id !== u.id))
    } catch (err) {
      handle(err)
    }
  }

  return (
    <div className="usuarios">
      {/* Alta de usuario */}
      <form className="form-card" onSubmit={submit}>
        <h3 className="card__title sol-form__title">{t('users.new')}</h3>
        <div className="form-grid">
          <div>
            <label className="field__label">{t('users.email')} <span className="field__required">*</span></label>
            <input
              className="input"
              type="email"
              placeholder={`nombre@${t('users.domain')}`}
              value={form.email}
              onChange={(e) => upd('email', e.target.value)}
            />
          </div>
          <div>
            <label className="field__label">{t('users.nombre')}</label>
            <input
              className="input"
              placeholder={t('users.ph.nombre')}
              value={form.nombre}
              onChange={(e) => upd('nombre', e.target.value)}
            />
          </div>
          <div>
            <label className="field__label">{t('users.role')}</label>
            <select className="select" value={form.role} onChange={(e) => upd('role', e.target.value)}>
              <option value="team">{t('users.roleMember')}</option>
              <option value="manager">{t('users.roleAdmin')}</option>
            </select>
          </div>
          <div>
            <label className="field__label">{t('users.password')} <span className="field__required">*</span></label>
            <input
              className="input"
              type="text"
              placeholder={t('users.ph.password')}
              value={form.password}
              onChange={(e) => upd('password', e.target.value)}
            />
          </div>
        </div>
        {msg && <div className="field__error">{msg}</div>}
        <div className="form-actions">
          <button type="submit" className="btn btn--save">
            <UserPlus size={16} aria-hidden /> {t('users.create')}
          </button>
        </div>
      </form>

      {/* Lista de usuarios */}
      <div className="sol-list">
        {status === 'loading' && <div className="state-msg">{t('app.loading')}</div>}
        {status === 'error' && <div className="state-msg state-msg--error">{t('app.connError')}</div>}
        {status === 'ready' &&
          users.map((u) => (
            <div className="sol-card" key={u.id}>
              <div className="sol-card__main">
                <div className="sol-card__title">
                  {u.nombre}
                  {u.email === currentEmail && <span className="user-you"> · {t('users.you')}</span>}
                </div>
                <div className="sol-meta">{u.email}</div>
              </div>
              <div className="sol-card__side">
                <select
                  className="filter-select"
                  value={u.role}
                  onChange={(e) => changeRole(u, e.target.value)}
                  disabled={u.email === currentEmail}
                  title={t('users.role')}
                >
                  <option value="team">{t('users.roleMember')}</option>
                  <option value="manager">{t('users.roleAdmin')}</option>
                </select>
                <div className="sol-actions">
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => resetPassword(u)}>
                    <KeyRound size={15} aria-hidden /> {t('users.resetPassword')}
                  </button>
                  {u.email !== currentEmail && (
                    <button
                      type="button"
                      className="row-action row-action--danger"
                      onClick={() => remove(u)}
                      title={t('users.delete')}
                      aria-label={t('users.delete')}
                    >
                      <Trash2 aria-hidden />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
