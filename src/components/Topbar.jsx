import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/Button'
import { BRAND_NAME } from '../config/brand'

function formatTime(date) {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function Topbar() {
  const [time, setTime] = useState(() => formatTime(new Date()))
  const { usuario, logout } = useAuth()

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(formatTime(new Date()))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="min-h-16 bg-[#fdfaf5]/95 backdrop-blur-md border-b border-stone-200/75 px-4 md:px-7 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-soft">
      <div className="flex items-center gap-3 min-w-0">
        <div className="rounded-2xl bg-accent-50 p-2 ring-1 ring-accent-600/12 md:hidden">
          <img
            src="/logo-restaurante.svg"
            alt={BRAND_NAME}
            className="h-9 w-9 object-contain"
          />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.12em] font-semibold text-accent-700">Ambiente atual</p>
          <h1
            className="text-lg md:text-xl font-semibold font-display text-ink-900 tracking-tight truncate"
            title={BRAND_NAME}
          >
            {BRAND_NAME}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-end">
        <span className="text-xs md:text-sm text-ink-600 font-medium max-w-[10rem] sm:max-w-none truncate md:truncate-none md:max-w-[12rem]">
          {usuario?.nome}
        </span>
        <div className="text-sm md:text-base font-semibold tabular-nums bg-stone-100/90 text-ink-800 px-3 md:px-4 py-2 rounded-2xl border border-stone-200/80">
          {time}
        </div>
        <Button type="button" variant="outline" size="sm" className="!rounded-xl" onClick={logout}>
          Sair
        </Button>
      </div>
    </header>
  )
}
