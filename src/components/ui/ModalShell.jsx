/**
 * Overlay + painel modal reutilizável (conteúdo via children).
 */
export function ModalShell({
  labelledBy,
  describedBy,
  children,
  onBackdropClick,
  className = '',
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
    >
      <button
        type="button"
        tabIndex={-1}
        className="absolute inset-0 bg-ink-900/45 backdrop-blur-[2px]"
        aria-label="Fechar"
        onClick={onBackdropClick}
      />
      <div
        className={`relative w-full max-w-md rounded-[1.5rem] border border-stone-200/80 bg-[#fdfaf5] p-6 sm:p-8 shadow-soft-xl animate-slide-up ${className}`}
      >
        {children}
      </div>
    </div>
  )
}
