import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { BRAND_NAME } from '../config/brand'

export const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊', adminOnly: true },
  { to: '/comandas', label: 'Mesas', icon: '🪑', adminOnly: false },
  { to: '/caixa', label: 'Caixa', icon: '💰', adminOnly: true },
  { to: '/produtos', label: 'Produtos', icon: '🍔', adminOnly: true },
  { to: '/estoque', label: 'Estoque', icon: '📦', adminOnly: true },
  { to: '/financeiro', label: 'Financeiro', icon: '📈', adminOnly: true },
  { to: '/relatorio-caixa', label: 'Relatório Caixa', icon: '📑', adminOnly: true },
]

export default function Sidebar() {
  const { isAdmin } = useAuth()

  const itensVisiveis = navItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <aside className="w-64 xl:w-[17rem] bg-[#fdfaf5]/96 border-r border-stone-200/80 flex flex-col shrink-0 shadow-soft backdrop-blur-sm">
      <div className="px-5 pt-7 pb-5 border-b border-stone-100/90">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-accent-50 p-2 ring-1 ring-accent-600/15">
            <img
              src="/logo-restaurante.svg"
              alt={BRAND_NAME}
              className="h-10 w-10 object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="font-display text-base font-semibold text-ink-900 leading-snug truncate" title={BRAND_NAME}>
              {BRAND_NAME}
            </p>
            <p className="text-xs text-ink-600 font-medium mt-0.5">Painel interno</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-auto">
        {itensVisiveis.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-2xl text-[0.9375rem] font-semibold transition-all duration-200 min-h-[50px] touch-manipulation border ` +
              (isActive
                ? 'bg-accent-600 text-white shadow-soft-lg border-accent-700/25'
                : 'text-ink-700 border-transparent hover:bg-stone-100/90 hover:text-ink-900 active:scale-[0.99]')
            }
          >
            <span className="text-xl leading-none shrink-0" aria-hidden>
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
