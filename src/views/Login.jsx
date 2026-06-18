import { useState } from 'react'
import { Lock } from 'lucide-react'
import { login } from '../lib/api.js'
import logo from '../assets/yago-logo-horizontal.png'

export default function Login({ onSuccess }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(false)
    const ok = await login(password)
    setLoading(false)
    if (ok) onSuccess()
    else setError(true)
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <img className="login__logo" src={logo} alt="Yago" />
        <h1 className="login__title">Registro de compras</h1>
        <p className="login__subtitle">Introduce la contraseña del equipo para entrar.</p>

        <div className="login__field">
          <Lock className="login__icon" aria-hidden />
          <input
            className="login__input"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>
        {error && <div className="login__error">Contraseña incorrecta</div>}

        <button type="submit" className="btn btn--save login__btn" disabled={loading || !password}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
