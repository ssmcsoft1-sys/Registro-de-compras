import { LayoutDashboard, PlusCircle, List, LogOut } from 'lucide-react'
import logo from '../assets/yago-logo-horizontal.png'
import { useSettings } from '../lib/settings.jsx'
import { LanguageSwitch, CurrencySwitch } from './Switchers.jsx'

const NAV = [
  { id: 'resumen', key: 'nav.resumen', Icon: LayoutDashboard },
  { id: 'registrar', key: 'nav.registrar', Icon: PlusCircle },
  { id: 'historial', key: 'nav.historial', Icon: List },
]

export default function Sidebar({ view, onNavigate, onLogout }) {
  const { t } = useSettings()
  return (
    <aside className="sidebar">
      <div className="sidebar__logo-wrap">
        <img className="sidebar__logo" src={logo} alt="Yago" />
      </div>
      <div className="sidebar__overline">{t('nav.compras')}</div>
      <nav className="nav">
        {NAV.map(({ id, key, Icon }) => {
          const active = view === id
          return (
            <button
              key={id}
              type="button"
              className={`nav__item${active ? ' nav__item--active' : ''}`}
              onClick={() => onNavigate(id)}
            >
              <Icon size={20} strokeWidth={2} aria-hidden />
              <span>{t(key)}</span>
            </button>
          )
        })}
      </nav>
      <div style={{ flex: 1 }} />
      <div className="sidebar__settings">
        <LanguageSwitch />
        <CurrencySwitch />
      </div>
      <button type="button" className="nav__item nav__item--logout" onClick={onLogout}>
        <LogOut size={20} strokeWidth={2} aria-hidden />
        <span>{t('nav.logout')}</span>
      </button>
    </aside>
  )
}
