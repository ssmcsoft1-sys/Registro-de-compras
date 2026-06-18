import { useCallback, useEffect, useRef, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import Toast from './components/Toast.jsx'
import Resumen from './views/Resumen.jsx'
import Registrar from './views/Registrar.jsx'
import Historial from './views/Historial.jsx'
import Login from './views/Login.jsx'
import { useSettings } from './lib/settings.jsx'
import {
  AuthError,
  checkSession,
  logout as apiLogout,
  fetchPurchases,
  createPurchase,
  updatePurchase as apiUpdatePurchase,
  deletePurchase as apiDeletePurchase,
} from './lib/api.js'

export default function App() {
  const { t } = useSettings()
  const [authed, setAuthed] = useState(null) // null = comprobando, true/false = resultado
  const [view, setView] = useState('resumen')
  const [purchases, setPurchases] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const showToast = useCallback((message) => {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2800)
  }, [])

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  // Carga de compras desde el servidor. Si la sesión caducó, vuelve al login.
  const load = useCallback(() => {
    setStatus('loading')
    fetchPurchases()
      .then((data) => {
        setPurchases(data)
        setStatus('ready')
      })
      .catch((e) => {
        if (e instanceof AuthError) setAuthed(false)
        else setStatus('error')
      })
  }, [])

  // Al arrancar: comprobar si hay sesión iniciada.
  useEffect(() => {
    checkSession().then((ok) => {
      setAuthed(ok)
      if (ok) load()
    })
  }, [load])

  const handleLoginSuccess = useCallback(() => {
    setAuthed(true)
    load()
  }, [load])

  const handleLogout = useCallback(async () => {
    await apiLogout()
    setAuthed(false)
    setPurchases([])
    setView('resumen')
  }, [])

  // Si una acción devuelve AuthError, la sesión caducó: volver al login.
  const onAuthError = useCallback((e) => {
    if (e instanceof AuthError) {
      setAuthed(false)
      return true
    }
    return false
  }, [])

  const addPurchase = useCallback(
    async (purchase) => {
      try {
        const saved = await createPurchase(purchase)
        setPurchases((prev) => [saved, ...prev])
        setView('historial')
        showToast(t('toast.created'))
      } catch (e) {
        if (!onAuthError(e)) showToast(t('toast.saveError'))
      }
    },
    [showToast, onAuthError, t],
  )

  const editPurchase = useCallback(
    async (id, fields) => {
      try {
        const updated = await apiUpdatePurchase(id, fields)
        setPurchases((prev) => prev.map((p) => (p.id === id ? updated : p)))
        showToast(t('toast.updated'))
        return true
      } catch (e) {
        if (!onAuthError(e)) showToast(t('toast.updateError'))
        return false
      }
    },
    [showToast, onAuthError, t],
  )

  const deletePurchase = useCallback(
    async (id) => {
      try {
        await apiDeletePurchase(id)
        setPurchases((prev) => prev.filter((p) => p.id !== id))
        showToast(t('toast.deleted'))
      } catch (e) {
        if (!onAuthError(e)) showToast(t('toast.deleteError'))
      }
    },
    [showToast, onAuthError, t],
  )

  if (authed === null) {
    return <div className="boot">{t('app.booting')}</div>
  }
  if (!authed) {
    return <Login onSuccess={handleLoginSuccess} />
  }

  return (
    <div className="app">
      <Sidebar view={view} onNavigate={setView} onLogout={handleLogout} />
      <main className="main">
        <Header view={view} onRegister={() => setView('registrar')} />
        <div className="scroll-area">
          <div className="content">
            {status === 'loading' && <div className="state-msg">{t('app.loading')}</div>}
            {status === 'error' && (
              <div className="state-msg state-msg--error">
                {t('app.connError')}
                <button type="button" className="btn btn--secondary" onClick={load}>
                  {t('app.retry')}
                </button>
              </div>
            )}
            {status === 'ready' && (
              <>
                {view === 'resumen' && <Resumen purchases={purchases} />}
                {view === 'registrar' && (
                  <Registrar onSubmit={addPurchase} onCancel={() => setView('resumen')} />
                )}
                {view === 'historial' && (
                  <Historial
                    purchases={purchases}
                    onDelete={deletePurchase}
                    onEdit={editPurchase}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Toast message={toast} />
    </div>
  )
}
