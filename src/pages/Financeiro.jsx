import { useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCaixa } from '../hooks/usePDV'
import { Card } from '../components/ui/Card'

function formatarData(dataStr) {
  if (!dataStr) return '-'
  const d = new Date(dataStr)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function agruparPorDia(vendas) {
  const grupos = {}
  vendas.forEach((v) => {
    const data = formatarData(v.data)
    if (!grupos[data]) grupos[data] = { data, vendas: [], total: 0 }
    grupos[data].vendas.push(v)
    grupos[data].total += v.total || 0
  })
  return Object.values(grupos).sort(
    (a, b) => new Date(b.vendas[0]?.data) - new Date(a.vendas[0]?.data)
  )
}

export default function Financeiro() {
  const { isAdmin } = useAuth()
  const [vendas] = useCaixa()

  if (!isAdmin) return <Navigate to="/" replace />

  const { faturamentoTotal, grupos } = useMemo(() => {
    const total = vendas.reduce((acc, v) => acc + (v.total || 0), 0)
    const porDia = agruparPorDia(vendas)
    return { faturamentoTotal: total, grupos: porDia }
  }, [vendas])

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-accent-700">Resumo</p>
        <h2 className="font-display text-3xl font-semibold text-ink-900 tracking-tight mt-1">Financeiro</h2>
      </header>

      <Card>
        <p className="text-sm font-medium text-ink-600 mb-1">Faturamento total (histórico)</p>
        <p className="text-3xl font-bold text-accent-800 tabular-nums font-display">
          R$ {faturamentoTotal.toFixed(2)}
        </p>
      </Card>

      <h3 className="text-lg font-semibold text-ink-900 font-display">Histórico de vendas por dia</h3>
      {grupos.length === 0 ? (
        <Card className="border-dashed py-12 text-center">
          <p className="text-ink-600">Nenhuma venda registrada.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {grupos.map((grupo) => (
            <Card key={grupo.data}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
                <h4 className="text-lg font-bold text-ink-900 font-display">
                  {grupo.data}
                </h4>
                <p className="text-xl font-bold text-accent-800 tabular-nums font-display">
                  R$ {grupo.total.toFixed(2)}
                </p>
              </div>
              <ul className="space-y-2">
                {grupo.vendas.map((venda) => (
                  <li key={venda.id} className="py-2 border-b border-stone-100 last:border-0">
                    <span className="text-ink-800">
                      {venda.identificacao}
                      {venda.metodoPagamento && (
                        <span className="text-ink-600 text-sm ml-2">
                          ({venda.metodoPagamento})
                        </span>
                      )}
                    </span>
                    <span className="block sm:inline font-semibold text-accent-800 tabular-nums sm:float-right">
                      R$ {(venda.total || 0).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
