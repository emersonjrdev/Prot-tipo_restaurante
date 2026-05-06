import ProductImage from '../ProductImage'
import { Button } from '../ui/Button'

export default function ItemRow({ item, onQuantidadeChange, onRemover }) {
  const preco = Number(item?.preco ?? 0)
  const subtotal = Number(item?.subtotal ?? preco * (item?.quantidade ?? 1))
  const itemPorPeso = item?.unidadeMedida === 'gramas'
  const itemLegacyValorTotal = item?.unidadeMedida === 'valor_total'

  const iconSq = '!min-h-0 !w-10 !h-10 !px-0 !rounded-xl shrink-0'

  return (
    <div className="flex items-center gap-3 sm:gap-4 py-3 px-3 sm:px-4 bg-[#fffdfb] rounded-2xl border border-stone-200/80 hover:border-accent-400/35 transition-colors shadow-soft">
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <ProductImage src={item?.imagem} alt="" variant="thumb" />
        <div className="min-w-0">
          <p className="font-semibold text-ink-900 truncate">{item?.nome ?? 'Item'}</p>
          <p className="text-sm text-ink-600">
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
          <span className="px-3 py-1 rounded-xl bg-accent-50 text-accent-900 font-mono font-bold tabular-nums border border-accent-100">
            {Number(item.pesoGramas || 0)}g
          </span>
        ) : itemLegacyValorTotal ? (
          <span className="px-3 py-1 rounded-xl bg-stone-100 text-ink-800 font-semibold text-sm border border-stone-200/80">
            Total fixo
          </span>
        ) : (
          <>
            <Button
              type="button"
              variant="subtle"
              className={iconSq}
              onClick={() => onQuantidadeChange(item.id, Math.max(0, (item?.quantidade ?? 1) - 1))}
              disabled={(item?.quantidade ?? 1) <= 1}
              aria-label="Diminuir quantidade"
            >
              −
            </Button>
            <span className="w-12 text-center font-mono font-bold text-ink-900 tabular-nums">
              {item?.quantidade ?? 1}
            </span>
            <Button
              type="button"
              variant="subtle"
              className={iconSq}
              onClick={() => onQuantidadeChange(item.id, (item?.quantidade ?? 1) + 1)}
              aria-label="Aumentar quantidade"
            >
              +
            </Button>
          </>
        )}
      </div>
      <p className="w-24 text-right font-bold text-ink-900 tabular-nums">R$ {subtotal.toFixed(2)}</p>
      <Button
        type="button"
        variant="ghost"
        className={`${iconSq} !text-red-600 hover:!bg-red-50`}
        onClick={() => onRemover(item.id)}
        aria-label="Remover item"
      >
        ×
      </Button>
    </div>
  )
}
