import { useState } from 'react'
import { Lock } from 'lucide-react'
import { login } from '../lib/api.js'
import logo from '../assets/yago-logo-horizontal.png'
import { useSettings } from '../lib/settings.jsx'
import { LanguageSwitch } from '../components/Switchers.jsx'

export default function Login({ onSuccess }) {
  const { t } = useSettings()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(false)
    const role = await login(password)
    setLoading(false)
    if (role) onSuccess(role)
    else setError(true)
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <img className="login__logo" src={logo} alt="Yago" />
        <h1 className="login__title">{t('login.title')}</h1>
        <p className="login__subtitle">{t('login.subtitle')}</p>

        <div className="login__field">
          <Lock className="login__icon" aria-hidden />
          <input
            className="login__input"
            type="password"
            placeholder={t('login.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>
        {error && <div className="login__error">{t('login.error')}</div>}

        <button type="submit" className="btn btn--save login__btn" disabled={loading || !password}>
          {loading ? t('login.entering') : t('login.enter')}
        </button>

        <div className="login__lang">
          <LanguageSwitch />
        </div>
      </form>
    </div>
  )
}
