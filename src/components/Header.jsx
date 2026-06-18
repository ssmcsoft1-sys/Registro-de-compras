import { Plus } from 'lucide-react'

const TITLES = {
  resumen: ['Resumen de compras robótica', 'Gastos por proyecto, categoría y mes'],
  registrar: ['Registrar compra', 'Añade una nueva compra al registro'],
  historial: ['Historial de compras', 'Todas las compras registradas'],
}

export default function Header({ view, onRegister }) {
  const [title, subtitle] = TITLES[view]
  return (
    <header className="header">
      <div>
        <h1 className="header__title">{title}</h1>
        <div className="header__subtitle">{subtitle}</div>
      </div>
      {view !== 'registrar' && (
        <button type="button" className="btn btn--primary" onClick={onRegister}>
          <Plus size={18} aria-hidden />
          Registrar compra
        </button>
      )}
    </header>
  )
}
