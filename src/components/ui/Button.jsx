/**
 * Botões no padrão visual do sistema (primário / secundário / outline).
 */
export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  disabled,
  children,
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 ease-out ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white ' +
    'disabled:opacity-45 disabled:pointer-events-none active:scale-[0.98] touch-manipulation'

  const variants = {
    primary:
      'bg-accent-600 text-white shadow-soft hover:bg-accent-700 hover:shadow-soft-lg border border-transparent',
    secondary:
      'bg-[#fffdfb] text-ink-900 border border-stone-200/90 shadow-soft hover:bg-stone-50 hover:border-stone-300/90',
    outline:
      'bg-transparent text-accent-800 border-2 border-accent-500/35 hover:bg-accent-50/80 hover:border-accent-500/55',
    ghost: 'bg-transparent text-ink-700 hover:bg-stone-100/90 border border-transparent',
    danger:
      'bg-red-600 text-white shadow-soft hover:bg-red-700 border border-red-700/20 focus-visible:ring-red-400/35',
    success:
      'bg-emerald-600 text-white shadow-soft hover:bg-emerald-700 border border-emerald-700/25 focus-visible:ring-emerald-400/35',
    ink:
      'bg-ink-900 text-white shadow-soft hover:bg-ink-800 border border-transparent focus-visible:ring-ink-500/40',
    subtle:
      'bg-accent-50/90 text-accent-900 border border-accent-200/80 hover:bg-accent-100 shadow-soft',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm gap-2 min-h-[40px]',
    md: 'px-5 py-3 text-base gap-2 min-h-[48px]',
    lg: 'px-8 py-4 text-lg gap-2 min-h-[56px]',
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
