import { useState, useEffect, useRef } from 'react'
import { formatarCentavosInput, moedaInputParaNumero } from '../utils/moeda'
import { Button } from './ui/Button'

const METODOS = {
  D: { label: 'Dinheiro', key: 'D' },
  C: { label: 'Cartão', key: 'C' },
  P: { label: 'PIX', key: 'P' },
}

export default function ModalPagamento({ total, onConfirmar, onCancelar }) {
  const [metodo, setMetodo] = useState(null)
  const [valorRecebido, setValorRecebido] = useState('')
  const [erro, setErro] = useState('')
  const inputRef = useRef(null)

  const troco =
    metodo === 'D' && valorRecebido
      ? Math.max(0, moedaInputParaNumero(valorRecebido) - total)
      : 0

  useEffect(() => {
    if (metodo === 'D') {
      inputRef.current?.focus()
    }
  }, [metodo])

  function handleConfirmar() {
    setErro('')
    if (!metodo) {
      setErro('Selecione o método de pagamento')
      return
    }

    const metodoLabel = METODOS[metodo]?.label || metodo

    if (metodo === 'D') {
      const v = moedaInputParaNumero(valorRecebido)
      if (v < total) {
        setErro('Valor recebido menor que o total')
        return
      }
      onConfirmar(metodoLabel, v, troco)
    } else {
      onConfirmar(metodoLabel, 0, 0)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancelar()
    }
    if (e.key === 'Enter' && metodo) {
      if (metodo === 'D' && !valorRecebido) return
      e.preventDefault()
      handleConfirmar()
    }
    if (['d', 'D', 'c', 'C', 'p', 'P'].includes(e.key)) {
      e.preventDefault()
      if (!metodo) setMetodo(e.key.toUpperCase())
    }
  }

  const overlayRef = useRef(null)
  useEffect(() => {
    overlayRef.current?.focus()
  }, [])

  return (
    <div
      ref={overlayRef}
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-ink-900/45 backdrop-blur-[2px] outline-none animate-fade-in"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-pagamento-titulo"
    >
      <div className="relative w-full max-w-md rounded-[1.5rem] border border-stone-200/80 bg-[#fdfaf5] p-6 sm:p-8 shadow-soft-xl animate-slide-up">
        <h2
          id="modal-pagamento-titulo"
          className="font-display text-xl sm:text-2xl font-semibold text-ink-900 mb-1"
        >
          Pagamento
        </h2>

        <p className="text-xs uppercase tracking-[0.12em] text-accent-700 font-semibold mb-4">Concluir cobrança</p>

        <p className="text-2xl font-bold text-ink-900 mb-6 tabular-nums">
          Total: R$ {total.toFixed(2)}
        </p>

        <p className="text-sm text-ink-600 mb-4">
          Atalhos: <kbd className="px-2 py-1 bg-stone-100 rounded-lg text-ink-800 text-xs border border-stone-200/90">D</kbd>{' '}
          Dinheiro{' '}
          <kbd className="px-2 py-1 bg-stone-100 rounded-lg text-ink-800 text-xs border border-stone-200/90">C</kbd>{' '}
          Cartão{' '}
          <kbd className="px-2 py-1 bg-stone-100 rounded-lg text-ink-800 text-xs border border-stone-200/90">P</kbd>{' '}
          PIX
        </p>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          {Object.entries(METODOS).map(([key, m]) => (
            <Button
              key={key}
              type="button"
              variant={metodo === key ? 'primary' : 'secondary'}
              className="flex-1 sm:flex-1"
              onClick={() => setMetodo(key)}
            >
              {m.label}
            </Button>
          ))}
        </div>

        {metodo === 'D' && (
          <div className="space-y-2 mb-5">
            <label className="block text-sm font-medium text-ink-800">Valor recebido (R$)</label>
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={valorRecebido}
              onChange={(e) => setValorRecebido(formatarCentavosInput(e.target.value))}
              placeholder="0,00"
              className="w-full px-4 py-3.5 rounded-2xl border border-stone-200/90 focus:border-accent-500 focus:ring-4 focus:ring-accent-500/12 outline-none text-ink-900 font-mono text-xl transition-all"
            />
            {valorRecebido ? (
              <p className="text-lg font-bold text-emerald-700 tabular-nums">Troco: R$ {troco.toFixed(2)}</p>
            ) : null}
          </div>
        )}

        {erro ? (
          <p role="alert" className="mb-4 p-3.5 rounded-2xl bg-red-50 text-red-800 border border-red-200/80 text-sm">
            {erro}
          </p>
        ) : null}

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onCancelar}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            className="flex-1 !bg-emerald-600 hover:!bg-emerald-700 border-emerald-700/20"
            disabled={metodo === 'D' && !valorRecebido}
            onClick={handleConfirmar}
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  )
}
