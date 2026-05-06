import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useRelatorios } from '../hooks/useRelatorios'
import { Card } from '../components/ui/Card'
import { useToast } from '../contexts/ToastContext'
import { limparDadosCaixa } from '../services/caixaService'
import { playSomErro, playSomVenda } from '../utils/sons'

function formatarData(dataStr) {
  if (!dataStr) return '-'
  const d = new Date(dataStr)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function RelatorioCaixa() {
  const { isAdmin } = useAuth()
  const [relatorios, , refresh] = useRelatorios()
  const toast = useToast()

  if (!isAdmin) return <Navigate to="/" replace />

  async function handleLimparDadosEscondido() {
    const confirmou = window.confirm(
      'Isso vai excluir o histórico de vendas e relatórios de fechamento do caixa. Deseja continuar?'
    )
    if (!confirmou) return

    const confirmouNovamente = window.confirm(
      'Confirma EXCLUIR os dados do caixa agora? Essa ação não pode ser desfeita.'
    )
    if (!confirmouNovamente) return

    const resultado = await limparDadosCaixa()
    if (resultado?.sucesso) {
      playSomVenda()
      await refresh()
      toast.show('Dados do caixa excluídos com sucesso!')
    } else {
      playSomErro()
      toast.show(resultado?.erro || 'Erro ao excluir dados do caixa', 'error')
    }
  }

  useEffect(() => {
    function handleAtalhoSecretoRelatorio(event) {
      // Atalho secreto no Relatorio: Ctrl + Shift + Alt + Backspace
      if (event.ctrlKey && event.shiftKey && event.altKey && event.key === 'Backspace') {
        event.preventDefault()
        handleLimparDadosEscondido()
      }
    }

    window.addEventListener('keydown', handleAtalhoSecretoRelatorio)
    return () => window.removeEventListener('keydown', handleAtalhoSecretoRelatorio)
  }, [])

  const ordenados = [...relatorios].sort((a, b) => new Date(b.data) - new Date(a.data))

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-accent-700">Auditoria</p>
        <h2 className="font-display text-3xl font-semibold text-ink-900 tracking-tight mt-1">
          Relatório de caixa
        </h2>
        <p className="text-ink-600 mt-2 max-w-2xl">
          Histórico de fechamentos com totais por método de pagamento.
        </p>
      </header>

      {ordenados.length === 0 ? (
        <Card className="border-dashed py-16 text-center">
          <p className="text-ink-600">Nenhum fechamento de caixa registrado.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {ordenados.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
                <h3 className="text-lg font-bold text-ink-900 font-display">
                  {formatarData(r.data)}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    r.diferenca === 0
                      ? 'bg-green-100 text-green-800'
                      : r.diferenca > 0
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  Diferença: R$ {r.diferenca.toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-ink-600">Valor inicial</p>
                  <p className="font-bold tabular-nums text-ink-900">R$ {(r.valorInicial || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-ink-600">Total dinheiro</p>
                  <p className="font-bold tabular-nums text-ink-900">R$ {(r.totalDinheiro || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-ink-600">Total cartão</p>
                  <p className="font-bold tabular-nums text-ink-900">R$ {(r.totalCartao || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-ink-600">Total PIX</p>
                  <p className="font-bold tabular-nums text-ink-900">R$ {(r.totalPix || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-ink-600">Total sangrias</p>
                  <p className="font-bold tabular-nums text-ink-900">R$ {(r.totalSangrias || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-ink-600">Dinheiro líquido</p>
                  <p className="font-bold tabular-nums text-ink-900">R$ {(r.dinheiroLiquido || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-ink-600">Valor contado</p>
                  <p className="font-bold tabular-nums text-ink-900">R$ {(r.valorContado || 0).toFixed(2)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
