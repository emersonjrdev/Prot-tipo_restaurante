import ProductImage from '../ProductImage'

export default function ItemRow({ item, onQuantidadeChange, onRemover }) {
  const preco = Number(item?.preco ?? 0)
  const subtotal = Number(item?.subtotal ?? preco * (item?.quantidade ?? 1))
  const itemPorPeso = item?.unidadeMedida === 'gramas'
  const itemLegacyValorTotal = item?.unidadeMedida === 'valor_total'

  return (
    <div className="flex items-center gap-3 sm:gap-4 py-3 px-3 sm:px-4 bg-white rounded-xl border border-amber-200/70 hover:border-amber-300/80 transition-colors shadow-sm">
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <ProductImage src={item?.imagem} alt="" variant="thumb" />
        <div className="min-w-0">
          <p className="font-semibold text-amber-900 truncate">{item?.nome ?? 'Item'}</p>
        <p className="text-sm text-stone-500">
          {itemLegacyValorTotal
            ? `Total: R$ ${preco.toFixed(2)}`
            : itemPorPeso
              ? `R$ ${preco.toFixed(2)} / 100 g`
              : `R$ ${preco.toFixed(2)} un.`}
        </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {itemPorPeso ? (
          <span className="px-3 py-1 rounded-lg bg-amber-100 text-amber-900 font-mono font-bold tabular-nums">
            {Number(item.pesoGramas || 0)}g
          </span>
        ) : itemLegacyValorTotal ? (
          <span className="px-3 py-1 rounded-lg bg-amber-100 text-amber-900 font-semibold">
            Total fixo
          </span>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onQuantidadeChange(item.id, Math.max(0, (item?.quantidade ?? 1) - 1))}
              disabled={(item?.quantidade ?? 1) <= 1}
              className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation hover:bg-amber-200 transition-colors"
              aria-label="Diminuir quantidade"
            >
              −
            </button>
            <span className="w-12 text-center font-mono font-bold text-amber-900 tabular-nums">
              {item?.quantidade ?? 1}
            </span>
            <button
              type="button"
              onClick={() => onQuantidadeChange(item.id, (item?.quantidade ?? 1) + 1)}
              className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 font-bold text-lg touch-manipulation hover:bg-amber-200 transition-colors"
              aria-label="Aumentar quantidade"
            >
              +
            </button>
          </>
        )}
      </div>
      <p className="w-24 text-right font-bold text-amber-900 tabular-nums">
        R$ {subtotal.toFixed(2)}
      </p>
      <button
        type="button"
        onClick={() => onRemover(item.id)}
        className="w-10 h-10 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors touch-manipulation shrink-0"
        aria-label="Remover item"
      >
        ×
      </button>
    </div>
  )
}
