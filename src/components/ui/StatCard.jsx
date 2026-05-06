import { Card } from './Card'

/**
 * Cartão de métrica para dashboards (rótulo / valor / texto auxiliar).
 */
export function StatCard({ label, value, hint, className = '', variant = 'default' }) {
  const variants = {
    default: 'border-stone-200/70',
    success: 'border-l-[3px] border-l-emerald-500',
    warning: 'border-l-[3px] border-l-amber-500',
    danger: 'border-l-[3px] border-l-red-500',
  }

  return (
    <Card className={`${variants[variant] || variants.default} ${className}`}>
      <p className="text-sm font-medium text-ink-600 mb-1.5">{label}</p>
      <p className="text-2xl sm:text-[1.65rem] font-bold text-ink-900 tabular-nums tracking-tight">
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-ink-600 leading-relaxed">{hint}</p> : null}
    </Card>
  )
}
