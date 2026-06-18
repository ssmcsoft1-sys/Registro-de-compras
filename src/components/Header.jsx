import { Plus } from 'lucide-react'
import { useSettings } from '../lib/settings.jsx'

export default function Header({ view, onRegister }) {
  const { t } = useSettings()
  return (
    <header className="header">
      <div>
        <h1 className="header__title">{t(`header.title.${view}`)}</h1>
        <div className="header__subtitle">{t(`header.subtitle.${view}`)}</div>
      </div>
      {view !== 'registrar' && (
        <button type="button" className="btn btn--primary" onClick={onRegister}>
          <Plus size={18} aria-hidden />
          {t('header.registerBtn')}
        </button>
      )}
    </header>
  )
}
