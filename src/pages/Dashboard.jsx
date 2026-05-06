import { useDashboard } from '../hooks/usePDV'
import { StatCard } from '../components/ui/StatCard'

export default function Dashboard() {
  const [resumo] = useDashboard()
  const produtosBaixo = resumo.produtosEstoqueBaixo || []

  const estoqueHint =
    produtosBaixo.length > 0
      ? produtosBaixo.map((p) => `${p.nome} (${p.estoque})`).join(', ')
      : null

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent-700">Visão geral</p>
        <h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink-900 tracking-tight">
          Dashboard
        </h2>
        <p className="text-ink-600 max-w-2xl leading-relaxed">
          Resumo financeiro e operacional do dia — panorama rápido para o salão encaixar com a cozinha.
        </p>
      </header>

      <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
        <StatCard label="Total vendido hoje" value={`R$ ${resumo.totalHoje.toFixed(2)}`} />
        <StatCard label="Dinheiro hoje" value={`R$ ${(resumo.totalDinheiro ?? 0).toFixed(2)}`} />
        <StatCard label="Cartão hoje" value={`R$ ${(resumo.totalCartao ?? 0).toFixed(2)}`} />
        <StatCard label="PIX hoje" value={`R$ ${(resumo.totalPix ?? 0).toFixed(2)}`} />
        <StatCard
          label="Sangrias"
          variant="danger"
          value={`R$ ${(resumo.totalSangrias ?? 0).toFixed(2)}`}
        />
        <StatCard
          label="Dinheiro líquido"
          variant="success"
          value={`R$ ${(resumo.dinheiroLiquido ?? 0).toFixed(2)}`}
        />
        <StatCard label="Mesas abertas" value={String(resumo.comandasAbertas)} />
        <StatCard
          label="Aguardando pagamento"
          value={String(resumo.comandasAguardandoPagamento ?? 0)}
          variant="warning"
        />
        <StatCard label="Vendas pagas hoje" value={String(resumo.vendasFinalizadasHoje)} />
        <StatCard
          label="Caixa"
          value={resumo.caixaAberto ? 'Aberto' : 'Fechado'}
          variant={resumo.caixaAberto ? 'success' : 'default'}
        />
        <StatCard
          label="Estoque baixo (<5)"
          value={String(resumo.estoqueBaixo ?? 0)}
          variant={(resumo.estoqueBaixo ?? 0) > 0 ? 'warning' : 'default'}
          hint={estoqueHint}
        />
        <StatCard label="Total histórico" value={`R$ ${resumo.totalHistorico.toFixed(2)}`} className="sm:col-span-2" />
      </div>
    </div>
  )
}
