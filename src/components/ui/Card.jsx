export function Card({ children, className = '', padded = true }) {
  return (
    <div
      className={`rounded-[1.375rem] border border-stone-200/65 bg-[#fdfaf5]/95 backdrop-blur-md shadow-soft transition-shadow duration-300 hover:shadow-soft-lg ${
        padded ? 'p-6 md:p-7' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
