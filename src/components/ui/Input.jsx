import { forwardRef } from 'react'

/** Classe base para inputs e selects em páginas internas (sem blur). */
export const FIELD_CONTROL =
  'w-full px-4 py-3 rounded-2xl border border-stone-200/90 bg-[#fffdfb] text-ink-900 placeholder:text-stone-400 ' +
  'transition-all duration-200 hover:border-stone-300 focus:border-accent-500 focus:ring-4 focus:ring-accent-500/12 focus:outline-none'

const inputClasses =
  'w-full px-4 py-3.5 rounded-2xl border border-stone-200/90 bg-[#fffdfb]/90 backdrop-blur-sm ' +
  'text-ink-900 placeholder:text-stone-400 transition-all duration-200 ' +
  'hover:border-stone-300 focus:border-accent-500 focus:ring-4 focus:ring-accent-500/12 focus:outline-none'

export function FieldLabel({ children, htmlFor, className = '' }) {
  return (
    <label htmlFor={htmlFor} className={`block text-sm font-medium text-ink-700 mb-2 ${className}`}>
      {children}
    </label>
  )
}

export const TextInput = forwardRef(function TextInput({ id, className = '', ...rest }, ref) {
  return <input ref={ref} id={id} className={`${inputClasses} ${className}`} {...rest} />
})
