/**
 * Imagens de produto no mesmo formato da grade de Produtos: proporção 4:3, object-cover.
 * variant "card" = largura total do container (grade de produtos).
 * variant "inline" = mesmo 4:3, largura máxima ~como uma coluna da grade (até 24rem).
 * variant "thumb" = miniatura 4:3 em listas (linhas de item).
 */
export default function ProductImage({
  src,
  alt = '',
  variant = 'card',
  className = '',
}) {
  const frame =
    'relative aspect-[4/3] overflow-hidden rounded-xl bg-stone-100 ring-1 ring-stone-200/80'
  const width =
    variant === 'card'
      ? 'w-full'
      : variant === 'thumb'
        ? 'w-[4.25rem] shrink-0 max-w-none'
        : 'w-full max-w-sm'

  if (!src) {
    return (
      <div
        className={`${frame} ${width} flex items-center justify-center text-xs font-medium text-ink-500 ${className}`}
      >
        Sem foto
      </div>
    )
  }

  return (
    <div className={`${frame} ${width} ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover object-center"
      />
    </div>
  )
}
