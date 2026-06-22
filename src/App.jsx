import { useCallback, useEffect, useRef, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import Toast from './components/Toast.jsx'
import Resumen from './views/Resumen.jsx'
import Registrar from './views/Registrar.jsx'
import Historial from './views/Historial.jsx'
import Solicitudes from './views/Solicitudes.jsx'
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
  fetchRequests,
  createRequest as apiCreateRequest,
  rejectRequest as apiRejectRequest,
  buyRequest as apiBuyRequest,
  deleteRequest as apiDeleteRequest,
} from './lib/api.js'

const defaultView = (role) => (role === 'manager' ? 'resumen' : 'solicitudes')

export default function App() {
  const { t } = useSettings()
  const [role, setRole] = useState(undefined) // undefined = comprobando, null = sin sesión
  const [view, setView] = useState('resumen')
  const [purchases, setPurchases] = useState([])
  const [requests, setRequests] = useState([])
  const [status, setStatus] = useState('loading')
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const showToast = useCallback((message) => {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2800)
  }, [])

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  // Carga inicial: compras (solo responsable) + solicitudes (todos).
  const load = useCallback((r) => {
    setStatus('loading')
    const purchasesP = r === 'manager' ? fetchPurchases() : Promise.resolve([])
    Promise.all([purchasesP, fetchRequests()])
      .then(([p, reqs]) => {
        setPurchases(p)
        setRequests(reqs)
        setStatus('ready')
      })
      .catch((e) => {
        if (e instanceof AuthError) setRole(null)
        else setStatus('error')
      })
  }, [])

  useEffect(() => {
    checkSession().then((r) => {
      setRole(r)
      if (r) {
        setView(defaultView(r))
        load(r)
      }
    })
  }, [load])

  const handleLoginSuccess = useCallback(
    (r) => {
      setRole(r)
      setView(defaultView(r))
      load(r)
    },
    [load],
  )

  const handleLogout = useCallback(async () => {
    await apiLogout()
    setRole(null)
    setPurchases([])
    setRequests([])
  }, [])

  const onAuthError = useCallback((e) => {
    if (e instanceof AuthError) {
      setRole(null)
      return true
    }
    return false
  }, [])

  // ── Compras (responsable) ──
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

  // ── Solicitudes ──
  const addRequest = useCallback(
    async (request) => {
      try {
        const saved = await apiCreateRequest(request)
        setRequests((prev) => [saved, ...prev])
        showToast(t('toast.reqCreated'))
        return true
      } catch (e) {
        if (!onAuthError(e)) showToast(t('toast.reqError'))
        return false
      }
    },
    [showToast, onAuthError, t],
  )

  const rejectRequest = useCallback(
    async (id, nota) => {
      try {
        const updated = await apiRejectRequest(id, nota)
        setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)))
        showToast(t('toast.reqRejected'))
      } catch (e) {
        if (!onAuthError(e)) showToast(t('toast.reqError'))
      }
    },
    [showToast, onAuthError, t],
  )

  const buyRequest = useCallback(
    async (id, purchaseFields) => {
      try {
        const { request, purchase } = await apiBuyRequest(id, purchaseFields)
        setPurchases((prev) => [purchase, ...prev])
        setRequests((prev) => prev.map((r) => (r.id === id ? request : r)))
        showToast(t('toast.bought'))
        return true
      } catch (e) {
        if (!onAuthError(e)) showToast(t('toast.reqError'))
        return false
      }
    },
    [showToast, onAuthError, t],
  )

  const deleteRequest = useCallback(
    async (id) => {
      try {
        await apiDeleteRequest(id)
        setRequests((prev) => prev.filter((r) => r.id !== id))
        showToast(t('toast.reqDeleted'))
      } catch (e) {
        if (!onAuthError(e)) showToast(t('toast.reqError'))
      }
    },
    [showToast, onAuthError, t],
  )

  if (role === undefined) {
    return <div className="boot">{t('app.booting')}</div>
  }
  if (!role) {
    return <Login onSuccess={handleLoginSuccess} />
  }

  return (
    <div className="app">
      <Sidebar role={role} view={view} onNavigate={setView} onLogout={handleLogout} />
      <main className="main">
        <Header view={view} onRegister={() => setView('registrar')} />
        <div className="scroll-area">
          <div className="content">
            {status === 'loading' && <div className="state-msg">{t('app.loading')}</div>}
            {status === 'error' && (
              <div className="state-msg state-msg--error">
                {t('app.connError')}
                <button type="button" className="btn btn--secondary" onClick={() => load(role)}>
                  {t('app.retry')}
                </button>
              </div>
            )}
            {status === 'ready' && (
              <>
                {view === 'resumen' && role === 'manager' && <Resumen purchases={purchases} />}
                {view === 'registrar' && role === 'manager' && (
                  <Registrar onSubmit={addPurchase} onCancel={() => setView('resumen')} />
                )}
                {view === 'historial' && role === 'manager' && (
                  <Historial purchases={purchases} onDelete={deletePurchase} onEdit={editPurchase} />
                )}
                {view === 'solicitudes' && (
                  <Solicitudes
                    requests={requests}
                    role={role}
                    onCreate={addRequest}
                    onReject={rejectRequest}
                    onBuy={buyRequest}
                    onDelete={deleteRequest}
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
