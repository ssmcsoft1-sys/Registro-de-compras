import { LayoutDashboard, PlusCircle, List, LogOut } from 'lucide-react'
import logo from '../assets/yago-logo-horizontal.png'

const NAV = [
  { id: 'resumen', label: 'Resumen', Icon: LayoutDashboard },
  { id: 'registrar', label: 'Registrar compra', Icon: PlusCircle },
  { id: 'historial', label: 'Historial', Icon: List },
]

export default function Sidebar({ view, onNavigate, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo-wrap">
        <img className="sidebar__logo" src={logo} alt="Yago" />
      </div>
      <div className="sidebar__overline">COMPRAS</div>
      <nav className="nav">
        {NAV.map(({ id, label, Icon }) => {
          const active = view === id
          return (
            <button
              key={id}
              type="button"
              className={`nav__item${active ? ' nav__item--active' : ''}`}
              onClick={() => onNavigate(id)}
            >
              <Icon size={20} strokeWidth={2} aria-hidden />
              <span>{label}</span>
            </button>
          )
        })}
      </nav>
      <div style={{ flex: 1 }} />
      <button type="button" className="nav__item nav__item--logout" onClick={onLogout}>
        <LogOut size={20} strokeWidth={2} aria-hidden />
        <span>Cerrar sesión</span>
      </button>
    </aside>
  )
}
