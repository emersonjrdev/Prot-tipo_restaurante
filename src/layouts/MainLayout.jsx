import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import Sidebar, { navItems } from '../components/Sidebar'
import Topbar from '../components/Topbar'
import { useResponsive } from '../hooks/useResponsive'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { BRAND_NAME } from '../config/brand'

export default function MainLayout() {
  const { isMobile } = useResponsive()
  const { isAdmin, logout } = useAuth()
  const location = useLocation()
  const [menuAberto, setMenuAberto] = useState(false)

  const itensVisiveis = useMemo(
    () => navItems.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin]
  )

  const tituloAtual = useMemo(() => {
    const atual = itensVisiveis.find((item) => item.to === location.pathname)
    return atual?.label || 'Sistema'
  }, [itensVisiveis, location.pathname])

  useEffect(() => {
    setMenuAberto(false)
  }, [location.pathname])

  if (isMobile) {
    return (
      <div className="h-screen bg-app flex flex-col overflow-hidden">
        <header className="h-[3.625rem] bg-[#fdfaf5]/95 backdrop-blur-md border-b border-stone-200/75 px-3 flex items-center justify-between gap-3 shrink-0 shadow-soft">
          <Button type="button" variant="ink" size="sm" onClick={() => setMenuAberto(true)}>
            Menu
          </Button>
          <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
            <img
              src="/logo-restaurante.svg"
              alt={BRAND_NAME}
              className="h-9 w-9 object-contain rounded-2xl ring-1 ring-stone-200/80 shrink-0"
            />
            <h1 className="text-[0.9375rem] font-semibold font-display text-ink-900 truncate">
              {tituloAtual}
            </h1>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={logout} className="shrink-0">
            Sair
          </Button>
        </header>
        {menuAberto && (
          <div className="fixed inset-0 z-50 animate-fade-in">
            <button
              type="button"
              aria-label="Fechar menu"
              className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px]"
              onClick={() => setMenuAberto(false)}
            />
            <aside className="relative h-full w-[min(20rem,calc(100vw-3rem))] bg-[#fdfaf5] shadow-soft-xl border-r border-stone-200/75 p-5 animate-slide-up">
              <p className="text-xs uppercase tracking-[0.14em] text-accent-700 font-semibold mb-5">Navegação</p>
              <nav className="space-y-1">
                {itensVisiveis.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold transition-all duration-200 border ` +
                      (isActive
                        ? 'bg-accent-600 text-white shadow-soft-lg border-accent-700/20'
                        : 'text-ink-800 border-transparent hover:bg-stone-100 hover:text-ink-900')
                    }
                  >
                    <span aria-hidden className="text-xl">
                      {item.icon}
                    </span>
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </aside>
          </div>
        )}
        <main className="flex-1 overflow-auto min-h-0">
          <div className="p-4 pb-24 max-w-[100vw]">
            <Outlet />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-app overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 bg-app">
        <Topbar />
        <main className="flex-1 overflow-auto px-4 py-6 md:px-8 md:py-9">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
