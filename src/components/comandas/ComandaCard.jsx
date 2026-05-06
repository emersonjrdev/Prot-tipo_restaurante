export default function ComandaCard({ comanda, onClick, isMobile }) {
  const total = comanda.total ?? (comanda.itens || []).reduce(
    (acc, item) => acc + (item.subtotal ?? item.preco * item.quantidade),
    0
  )
  const qtdItens = (comanda.itens || []).reduce((acc, item) => acc + (item.quantidade || 0), 0)

  const pad = isMobile ? 'p-6' : 'p-5'

  return (
    <button
      type="button"
      onClick={() => onClick(comanda)}
      className={`w-full text-left rounded-[1.375rem] border border-stone-200/80 bg-[#fffdfb]/96 backdrop-blur-sm shadow-soft ${pad} transition-all duration-200 hover:border-accent-400/40 hover:shadow-soft-lg touch-manipulation active:scale-[0.99]`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={isMobile ? 'text-4xl' : 'text-3xl'} aria-hidden>
              🪑
            </span>
            <h3 className={`font-bold text-ink-900 ${isMobile ? 'text-2xl font-display' : 'text-xl'}`}>
              {comanda.identificacao}
            </h3>
          </div>
          <p className="text-sm text-ink-600">
            {qtdItens} {qtdItens === 1 ? 'item' : 'itens'}
          </p>
        </div>
        <div className="text-right">
          <p className={`font-bold text-accent-800 tabular-nums ${isMobile ? 'text-xl' : 'text-lg'}`}>
            R$ {total.toFixed(2)}
          </p>
        </div>
      </div>
    </button>
  )
}
