import { useEffect, useMemo, useState } from 'react'
import { useCaixa } from '../hooks/useCaixa'
import { useProdutos } from '../hooks/usePDV'
import {
  adicionarItem,
  adicionarItemAVenda,
  alterarQtd,
  cancelarVendaFinalizada,
  confirmarPagamento,
  enviarParaCaixa,
  removerItem,
} from '../services/storage'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { playSomVenda, playSomErro } from '../utils/sons'
import ModalPagamento from '../components/ModalPagamento'
import ItemRow from '../components/comandas/ItemRow'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { FieldLabel, FIELD_CONTROL } from '../components/ui/Input'

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

function isHoje(dataStr) {
  if (!dataStr) return false
  const data = new Date(dataStr)
  const hoje = new Date()
  return (
    data.getDate() === hoje.getDate() &&
    data.getMonth() === hoje.getMonth() &&
    data.getFullYear() === hoje.getFullYear()
  )
}

function formatarQuantidadeItem(item) {
  if (item?.unidadeMedida === 'gramas') {
    return `${Number(item.pesoGramas || 0)}g`
  }
  return `${Number(item?.quantidade || 0)}x`
}

function nomeEhFrios(nome) {
  return (
    String(nome || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim() === 'frios'
  )
}

function rotuloProdutoOption(p) {
  const preco = Number(p?.preco ?? 0)
  const precoTxt = nomeEhFrios(p?.nome) ? `${preco.toFixed(2)}/100 g` : preco.toFixed(2)
  const est = Number(p?.estoque ?? 0)
  const aviso = est < 1 ? ' (sem estoque)' : ''
  return `${p?.nome ?? ''} — R$ ${precoTxt}${aviso}`
}

export default function Caixa() {
  const [
    vendas,
    refresh,
    {
      comandasPendentes,
      sangrias,
      caixaAberto,
      caixaAtual,
      totais,
      totalSangrias,
      abrirCaixa,
      fecharCaixa,
      registrarSangria,
      limparDadosCaixa,
    },
  ] = useCaixa()
  const { usuario, isAdmin } = useAuth()
  const [produtos] = useProdutos()
  const [mostrarAbertura, setMostrarAbertura] = useState(false)
  const [valorInicial, setValorInicial] = useState('')
  const [mostrarFechamento, setMostrarFechamento] = useState(false)
  const [valorContado, setValorContado] = useState('')
  const [comandaPagamento, setComandaPagamento] = useState(null)
  const [comandaEdicaoId, setComandaEdicaoId] = useState(null)
  const [vendaAdicionarItem, setVendaAdicionarItem] = useState(null)
  const [produtoSelecionado, setProdutoSelecionado] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [tipoFrioVenda, setTipoFrioVenda] = useState('Presunto')
  const [pesoFrioVendaInput, setPesoFrioVendaInput] = useState('100')
  const [pesoFrioVendaUnidade, setPesoFrioVendaUnidade] = useState('g')
  const [produtoComandaSelecionado, setProdutoComandaSelecionado] = useState('')
  const [quantidadeComanda, setQuantidadeComanda] = useState('1')
  const [tipoFrioComanda, setTipoFrioComanda] = useState('Presunto')
  const [pesoFrioComandaInput, setPesoFrioComandaInput] = useState('100')
  const [pesoFrioComandaUnidade, setPesoFrioComandaUnidade] = useState('g')
  const [valorSangria, setValorSangria] = useState('')
  const [motivoSangria, setMotivoSangria] = useState('')
  const [registrandoSangria, setRegistrandoSangria] = useState(false)
  const toast = useToast()

  useEffect(() => {
    function handleAtalhoSecretoExcluirDadosCaixa(event) {
      // Atalho secreto: Ctrl + Shift + Alt + Delete
      if (event.ctrlKey && event.shiftKey && event.altKey && event.key === 'Delete') {
        event.preventDefault()
        handleLimparDadosCaixa()
      }
    }

    window.addEventListener('keydown', handleAtalhoSecretoExcluirDadosCaixa)
    return () => window.removeEventListener('keydown', handleAtalhoSecretoExcluirDadosCaixa)
  }, [])

  const { totalHoje, vendasHoje } = useMemo(() => {
    const doDia = vendas.filter((v) => isHoje(v.data))
    const total = doDia.reduce((acc, v) => acc + (v.total || 0), 0)
    return { totalHoje: total, vendasHoje: doDia }
  }, [vendas])

  const vendasOrdenadas = useMemo(
    () => [...vendasHoje].sort((a, b) => new Date(b.data) - new Date(a.data)),
    [vendasHoje]
  )

  const produtosOrdenados = useMemo(
    () =>
      produtos
        .sort((a, b) =>
          String(a?.nome || '').localeCompare(String(b?.nome || ''), 'pt-BR', {
            sensitivity: 'base',
          })
        ),
    [produtos]
  )
  const tiposFrios = ['Presunto', 'Queijo', 'Mortadela', 'Peito de Peru', 'Salame']
  const produtoComandaObj = produtos.find((p) => String(p.id) === String(produtoComandaSelecionado))
  const produtoVendaObj = produtos.find((p) => String(p.id) === String(produtoSelecionado))
  const comandaEhFrios =
    String(produtoComandaObj?.nome || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase() === 'frios'
  const vendaEhFrios =
    String(produtoVendaObj?.nome || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase() === 'frios'
  const comandaEmEdicao = useMemo(
    () => comandasPendentes.find((comanda) => comanda.id === comandaEdicaoId) || null,
    [comandasPendentes, comandaEdicaoId]
  )

  function normalizarQuantidadeInput(valor) {
    return String(valor || '').replace(/\D/g, '')
  }

  function normalizarDecimalInput(valor) {
    const limpo = String(valor || '').replace(/[^\d,.]/g, '')
    let resultado = ''
    let separadorUsado = false
    for (const ch of limpo) {
      if ((ch === ',' || ch === '.') && !separadorUsado) {
        resultado += ch
        separadorUsado = true
        continue
      }
      if (/\d/.test(ch)) resultado += ch
    }
    return resultado
  }

  function quantidadeParaNumero(valor) {
    return Math.max(1, parseInt(String(valor || ''), 10) || 1)
  }

  async function handleAbrirCaixa(e) {
    e?.preventDefault()
    const v = parseFloat(valorInicial.replace(',', '.')) || 0
    const r = await abrirCaixa(v)
    if (r.sucesso) {
      playSomVenda()
      setMostrarAbertura(false)
      setValorInicial('')
      await refresh()
      toast.show('Caixa aberto com sucesso!')
    } else {
      toast.show(r.erro || 'Erro ao abrir caixa', 'error')
      playSomErro()
    }
  }

  async function handleFecharCaixa(e) {
    e?.preventDefault()
    const v = parseFloat(valorContado.replace(',', '.')) || 0
    const r = await fecharCaixa(v)
    if (r.sucesso) {
      playSomVenda()
      setMostrarFechamento(false)
      setValorContado('')
      await refresh()
      toast.show(`Caixa fechado. Diferença: R$ ${r.fechamento.diferenca.toFixed(2)}`)
      if (r.avisoComandas) {
        toast.show(r.avisoComandas, 'warning')
      }
    } else {
      toast.show(r.erro || 'Erro ao fechar caixa', 'error')
      playSomErro()
    }
  }

  async function handleLimparDadosCaixa() {
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

  async function handleConfirmarPagamento(metodoPagamento, valorRecebido, troco) {
    if (!comandaPagamento) return
    if (comandaPagamento.status === 'aberta') {
      const enviada = await enviarParaCaixa(comandaPagamento.id)
      if (!enviada) {
        playSomErro()
        toast.show('Não foi possível enviar mesa para o caixa', 'error')
        return
      }
    }
    const venda = await confirmarPagamento(
      comandaPagamento.id,
      metodoPagamento,
      valorRecebido,
      troco
    )
    if (venda) {
      playSomVenda()
      toast.show('Pagamento confirmado!')
      setComandaPagamento(null)
      await refresh()
    } else {
      playSomErro()
      toast.show('Erro ao confirmar pagamento. Verifique o estoque.', 'error')
    }
  }

  async function handleRegistrarSangria(e) {
    e?.preventDefault()
    if (!isAdmin) {
      playSomErro()
      toast.show('Apenas admin pode registrar sangria', 'error')
      return
    }
    if (!caixaAberto || !caixaAtual?.caixaId) {
      playSomErro()
      toast.show('Abra o caixa para registrar sangria', 'error')
      return
    }

    const valorNum = parseFloat(String(valorSangria).replace(',', '.')) || 0
    if (valorNum <= 0) {
      playSomErro()
      toast.show('Informe um valor de sangria maior que zero', 'error')
      return
    }

    setRegistrandoSangria(true)
    try {
      const result = await registrarSangria(
        caixaAtual.caixaId,
        valorNum,
        motivoSangria.trim(),
        usuario?.id
      )
      if (result?.sucesso) {
        playSomVenda()
        setValorSangria('')
        setMotivoSangria('')
        await refresh()
        toast.show('Sangria registrada com sucesso!')
      } else {
        playSomErro()
        toast.show(result?.erro || 'Não foi possível registrar a sangria', 'error')
      }
    } finally {
      setRegistrandoSangria(false)
    }
  }

  async function handleAdicionarItemVenda() {
    if (!vendaAdicionarItem || !produtoSelecionado) return
    const quantidadeNum = quantidadeParaNumero(quantidade)
    const pesoBase = Math.max(1, parseFloat(String(pesoFrioVendaInput || '').replace(',', '.')) || 0)
    const pesoGramas = pesoFrioVendaUnidade === 'kg' ? Math.round(pesoBase * 1000) : Math.round(pesoBase)
    const estoqueNecessario = vendaEhFrios ? pesoGramas : quantidadeNum
    const produto = produtos.find((p) => String(p.id) === String(produtoSelecionado))
    if (Number(produto?.estoque ?? 0) < estoqueNecessario) {
      playSomErro()
      toast.show('Estoque insuficiente', 'error')
      return
    }
    const payload = vendaEhFrios
      ? { pesoGramas, tipoFrio: tipoFrioVenda }
      : { quantidade: quantidadeNum }
    const venda = await adicionarItemAVenda(vendaAdicionarItem.id, produtoSelecionado, payload)
    if (venda) {
      playSomVenda()
      await refresh()
      setVendaAdicionarItem(null)
      setProdutoSelecionado('')
      setQuantidade('1')
      setTipoFrioVenda('Presunto')
      setPesoFrioVendaInput('100')
      setPesoFrioVendaUnidade('g')
      toast.show('Item adicionado à venda!')
    } else {
      playSomErro()
      toast.show('Erro ao adicionar item', 'error')
    }
  }

  function limparEdicaoComanda() {
    setComandaEdicaoId(null)
    setProdutoComandaSelecionado('')
    setQuantidadeComanda('1')
    setTipoFrioComanda('Presunto')
    setPesoFrioComandaInput('100')
    setPesoFrioComandaUnidade('g')
  }

  async function handleAdicionarItemComanda() {
    if (!comandaEdicaoId || !produtoComandaSelecionado) return
    const quantidadeComandaNum = quantidadeParaNumero(quantidadeComanda)
    const pesoBase = Math.max(1, parseFloat(String(pesoFrioComandaInput || '').replace(',', '.')) || 0)
    const pesoGramas = pesoFrioComandaUnidade === 'kg' ? Math.round(pesoBase * 1000) : Math.round(pesoBase)
    const estoqueNecessario = comandaEhFrios ? pesoGramas : quantidadeComandaNum
    const produto = produtos.find((p) => String(p.id) === String(produtoComandaSelecionado))
    if (Number(produto?.estoque ?? 0) < estoqueNecessario) {
      playSomErro()
      toast.show('Estoque insuficiente', 'error')
      return
    }

    const payload = comandaEhFrios
      ? {
          pesoGramas,
          tipoFrio: tipoFrioComanda,
        }
      : { quantidade: quantidadeComandaNum }
    const comandaAtualizada = await adicionarItem(
      comandaEdicaoId,
      produtoComandaSelecionado,
      payload
    )
    if (comandaAtualizada) {
      playSomVenda()
      await refresh()
      setProdutoComandaSelecionado('')
      setQuantidadeComanda('1')
      setTipoFrioComanda('Presunto')
      setPesoFrioComandaInput('100')
      setPesoFrioComandaUnidade('g')
      toast.show('Item adicionado ao pedido!')
    } else {
      playSomErro()
      toast.show('Erro ao adicionar item no pedido', 'error')
    }
  }

  async function handleAlterarQuantidadeComanda(itemId, novaQuantidade) {
    if (!comandaEdicaoId) return
    const comandaAtualizada = await alterarQtd(comandaEdicaoId, itemId, novaQuantidade)
    if (comandaAtualizada) {
      await refresh()
    } else {
      playSomErro()
      toast.show('Erro ao atualizar quantidade do item', 'error')
    }
  }

  async function handleRemoverItemComanda(itemId) {
    if (!comandaEdicaoId) return
    const comandaAtualizada = await removerItem(comandaEdicaoId, itemId)
    if (comandaAtualizada) {
      playSomVenda()
      await refresh()
      toast.show('Item removido do pedido!')
    } else {
      playSomErro()
      toast.show('Erro ao remover item do pedido', 'error')
    }
  }

  async function handleCancelarVenda(vendaId) {
    const confirmou = window.confirm(
      'Cancelar esta compra finalizada? O estoque será devolvido e a venda sairá dos totais.'
    )
    if (!confirmou) return
    const confirmouNovamente = window.confirm(
      'Confirma CANCELAR esta compra agora? Essa ação não pode ser desfeita.'
    )
    if (!confirmouNovamente) return

    const result = await cancelarVendaFinalizada(vendaId)
    if (result?.sucesso) {
      playSomVenda()
      await refresh()
      toast.show('Compra cancelada com sucesso!')
    } else {
      playSomErro()
      toast.show(result?.erro || 'Não foi possível cancelar a compra', 'error')
    }
  }

  const caixa = caixaAtual || { aberto: false, valorInicial: 0 }
  const totalVendasDinheiro = Number(totais.totalDinheiro || 0)
  const totalSangriasCaixa = Number(totais.totalSangrias ?? totalSangrias ?? 0)
  const dinheiroLiquido = Number(totais.dinheiroLiquido ?? totalVendasDinheiro - totalSangriasCaixa)
  const totalEsperado = (caixa.valorInicial || 0) + dinheiroLiquido
  const diferenca =
    mostrarFechamento && valorContado
      ? (parseFloat(valorContado.replace(',', '.')) || 0) - totalEsperado
      : 0

  const totalComandaPendente =
    comandaPagamento &&
    (comandaPagamento.total ??
      (comandaPagamento.itens || []).reduce(
        (acc, item) => acc + (item.subtotal ?? item.preco * item.quantidade),
        0
      ))

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-accent-700">Operações</p>
        <h2 className="font-display text-3xl font-semibold text-ink-900 tracking-tight mt-1">Caixa</h2>
      </header>

      {/* Status e Abertura/Fechamento */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 sm:items-center">
        <span
          className={`px-4 py-2 rounded-2xl font-semibold border ${
            caixaAberto
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
              : 'bg-amber-50 text-amber-900 border-amber-200/80'
          }`}
        >
          {caixaAberto ? 'Caixa aberto' : 'Caixa fechado'}
        </span>
        {!caixaAberto && !mostrarAbertura && (
          <Button type="button" variant="success" onClick={() => setMostrarAbertura(true)} className="w-full sm:w-auto">
            Abrir caixa
          </Button>
        )}
        {caixaAberto && !mostrarFechamento && (
          <Button type="button" variant="primary" onClick={() => setMostrarFechamento(true)} className="w-full sm:w-auto">
            Fechar caixa
          </Button>
        )}
      </div>

      {mostrarAbertura && (
        <Card>
        <form onSubmit={handleAbrirCaixa}>
          <h3 className="text-lg font-semibold text-ink-900 mb-4 font-display">Abrir caixa</h3>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end flex-wrap">
            <div className="w-full sm:w-auto">
              <FieldLabel htmlFor="valor-inicial">Valor inicial (R$)</FieldLabel>
              <input
                id="valor-inicial"
                type="text"
                inputMode="decimal"
                value={valorInicial}
                onChange={(e) => setValorInicial(normalizarDecimalInput(e.target.value))}
                placeholder="0,00"
                className={`${FIELD_CONTROL} w-full sm:w-44`}
              />
            </div>
            <Button type="submit" variant="success" className="w-full sm:w-auto">
              Confirmar abertura
            </Button>
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setMostrarAbertura(false)}>
              Cancelar
            </Button>
          </div>
        </form>
        </Card>
      )}

      {mostrarFechamento && (
        <Card>
        <form onSubmit={handleFecharCaixa}>
          <h3 className="text-lg font-semibold text-ink-900 mb-4 font-display">Fechar caixa</h3>
          <div className="grid gap-3 mb-5 text-ink-800 text-sm sm:text-base">
            <p>Valor inicial: R$ {(caixa.valorInicial || 0).toFixed(2)}</p>
            <p>Total dinheiro hoje: R$ {totais.totalDinheiro.toFixed(2)}</p>
            <p>Total cartão hoje: R$ {totais.totalCartao.toFixed(2)}</p>
            <p>Total PIX hoje: R$ {totais.totalPix.toFixed(2)}</p>
            <p className="font-bold text-ink-900">
              Total esperado em caixa: R$ {totalEsperado.toFixed(2)}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end flex-wrap">
            <div className="w-full sm:w-auto">
              <FieldLabel htmlFor="valor-contado">Valor contado (R$)</FieldLabel>
              <input
                id="valor-contado"
                type="text"
                inputMode="decimal"
                value={valorContado}
                onChange={(e) => setValorContado(normalizarDecimalInput(e.target.value))}
                placeholder="0,00"
                className={`${FIELD_CONTROL} w-full sm:w-44`}
              />
            </div>
            {valorContado && (
              <p
                className={`font-bold ${
                  diferenca >= 0 ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                Diferença: R$ {diferenca.toFixed(2)}
              </p>
            )}
            <Button type="submit" variant="primary" className="w-full sm:w-auto">
              Confirmar fechamento
            </Button>
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setMostrarFechamento(false)}>
              Cancelar
            </Button>
          </div>
        </form>
        </Card>
      )}

      {/* Totais do dia */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm font-medium text-ink-600 mb-1">Total vendido hoje</p>
          <p className="text-2xl font-bold text-accent-800 tabular-nums font-display">
            R$ {totalHoje.toFixed(2)}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-ink-600 mb-1">Dinheiro</p>
          <p className="text-2xl font-bold text-accent-800 tabular-nums font-display">
            R$ {totais.totalDinheiro.toFixed(2)}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-ink-600 mb-1">Cartão</p>
          <p className="text-2xl font-bold text-accent-800 tabular-nums font-display">
            R$ {totais.totalCartao.toFixed(2)}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-ink-600 mb-1">PIX</p>
          <p className="text-2xl font-bold text-accent-800 tabular-nums font-display">
            R$ {totais.totalPix.toFixed(2)}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm font-medium text-ink-600 mb-1">Valor inicial do caixa</p>
          <p className="text-2xl font-bold text-accent-800 tabular-nums font-display">
            R$ {Number(caixa.valorInicial || 0).toFixed(2)}
          </p>
        </Card>
        <Card className="sm:col-span-2">
          <p className="text-sm font-medium text-ink-600 mb-1">Vendas em dinheiro (caixa atual)</p>
          <p className="text-2xl font-bold text-accent-800 tabular-nums font-display">
            R$ {totalVendasDinheiro.toFixed(2)}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-ink-600 mb-1">Total sangrias</p>
          <p className="text-2xl font-bold text-red-700 tabular-nums font-display">
            R$ {totalSangriasCaixa.toFixed(2)}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-ink-600 mb-1">Dinheiro líquido</p>
          <p className="text-2xl font-bold text-emerald-700 tabular-nums font-display">
            R$ {dinheiroLiquido.toFixed(2)}
          </p>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-ink-900 mb-4 font-display">Sangria de caixa</h3>
        <form onSubmit={handleRegistrarSangria} className="flex flex-col sm:flex-row flex-wrap gap-3 sm:items-end mb-4">
          <div className="w-full sm:w-auto">
            <FieldLabel htmlFor="valor-sangria">Valor (R$)</FieldLabel>
            <input
              id="valor-sangria"
              type="text"
              inputMode="decimal"
              value={valorSangria}
              onChange={(e) => setValorSangria(normalizarDecimalInput(e.target.value))}
              placeholder="0,00"
              className={`${FIELD_CONTROL} w-full sm:w-44`}
              disabled={!caixaAberto || !isAdmin || registrandoSangria}
            />
          </div>
          <div className="w-full sm:min-w-[260px] sm:flex-1">
            <FieldLabel htmlFor="motivo-sangria">Motivo (opcional)</FieldLabel>
            <input
              id="motivo-sangria"
              type="text"
              value={motivoSangria}
              onChange={(e) => setMotivoSangria(e.target.value)}
              placeholder="Ex: retirada para cofre"
              className={FIELD_CONTROL}
              disabled={!caixaAberto || !isAdmin || registrandoSangria}
            />
          </div>
          <Button
            type="submit"
            variant="danger"
            disabled={!caixaAberto || !isAdmin || registrandoSangria}
            className="w-full sm:w-auto"
          >
            {registrandoSangria ? 'Registrando...' : 'Registrar sangria'}
          </Button>
        </form>

        {!isAdmin && (
          <p className="text-sm text-red-700 mb-3">Somente administradores podem registrar sangria.</p>
        )}

        {sangrias.length === 0 ? (
          <p className="text-sm text-ink-600">Nenhuma sangria registrada para este caixa.</p>
        ) : (
          <ul className="space-y-2">
            {sangrias.map((sangria) => (
              <li
                key={sangria.id}
                className="p-3 rounded-2xl border border-stone-200/80 bg-accent-50/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <p className="font-semibold text-ink-900">
                    R$ {Number(sangria.valor || 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-ink-600">
                    {sangria.motivo || 'Sem motivo informado'}
                  </p>
                  <p className="text-xs text-ink-500">
                    Operador: {sangria.operadorNome || sangria.operadorId}
                  </p>
                </div>
                <p className="text-xs text-ink-500">
                  {formatarData(sangria.createdAt || sangria.createdAtIso)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Pendentes de Pagamento */}
      <h3 className="text-lg font-semibold text-ink-900 mb-4 font-display">
        Mesas no caixa
      </h3>
      <div className="space-y-4">
        {comandasPendentes.length === 0 ? (
          <Card className="border-dashed py-10 text-center">
            <p className="text-ink-600">Nenhuma mesa disponível no caixa.</p>
          </Card>
        ) : (
          comandasPendentes.map((comanda) => {
            const total =
              comanda.total ??
              (comanda.itens || []).reduce(
                (acc, item) =>
                  acc + (item.subtotal ?? item.preco * item.quantidade),
                0
              )
            return (
              <Card
                key={comanda.id}
                className="border-accent-200/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 !p-6"
              >
                <div>
                  <h4 className="text-lg font-bold text-ink-900 font-display">
                    {comanda.identificacao}
                  </h4>
                  <p className="text-xs text-ink-600 mt-1">
                    Status: {comanda.status === 'aguardando_pagamento' ? 'Aguardando pagamento' : 'Aberta'}
                  </p>
                  {comanda.itens && comanda.itens.length > 0 && (
                    <ul className="mt-2 text-sm text-ink-600 space-y-0.5">
                      {comanda.itens.slice(0, 3).map((item) => (
                        <li key={item.id}>
                          {formatarQuantidadeItem(item)} {item.nome}
                        </li>
                      ))}
                      {comanda.itens.length > 3 && (
                        <li className="text-ink-400">
                          +{comanda.itens.length - 3} itens
                        </li>
                      )}
                    </ul>
                  )}
                </div>
                <div className="flex w-full sm:w-auto flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <p className="text-xl font-bold text-accent-800 tabular-nums font-display">
                    R$ {total.toFixed(2)}
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                      if (comandaEdicaoId === comanda.id) {
                        limparEdicaoComanda()
                        return
                      }
                      setComandaEdicaoId(comanda.id)
                      setProdutoComandaSelecionado('')
                      setQuantidadeComanda('1')
                      setTipoFrioComanda('Presunto')
                      setPesoFrioComandaInput('100')
                      setPesoFrioComandaUnidade('g')
                    }}
                    className="w-full sm:w-auto"
                  >
                    {comandaEdicaoId === comanda.id ? 'Fechar edição' : 'Editar pedido'}
                  </Button>
                  <Button
                    type="button"
                    variant="success"
                    onClick={() => setComandaPagamento(comanda)}
                    className="w-full sm:w-auto"
                  >
                    {comanda.status === 'aberta' ? 'Enviar e cobrar' : 'Cobrar'}
                  </Button>
                </div>

                {comandaEdicaoId === comanda.id && (
                  <div className="w-full sm:basis-full mt-2 p-5 rounded-2xl border border-stone-200/80 bg-accent-50/50">
                    <p className="text-sm font-semibold text-ink-900 mb-3">
                      Editar pedido antes da cobrança
                    </p>

                    {comandaEmEdicao?.itens?.length ? (
                      <div className="space-y-2 mb-4">
                        <p className="text-xs text-ink-600">Use o botão X para cancelar item da mesa.</p>
                        {comandaEmEdicao.itens.map((item) => (
                          <ItemRow
                            key={item.id}
                            item={item}
                            onQuantidadeChange={handleAlterarQuantidadeComanda}
                            onRemover={handleRemoverItemComanda}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-ink-600 mb-4">
                        Pedido sem itens no momento.
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 items-stretch sm:items-end">
                      <select
                        value={produtoComandaSelecionado}
                        onChange={(e) => setProdutoComandaSelecionado(e.target.value)}
                        className={`${FIELD_CONTROL} w-full sm:w-auto sm:min-w-[180px] !py-2.5 text-sm`}
                      >
                        <option value="">Produto...</option>
                        {produtosOrdenados.map((p) => (
                          <option key={p.id} value={p.id} disabled={Number(p.estoque ?? 0) < 1}>
                            {rotuloProdutoOption(p)}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={quantidadeComanda}
                        onChange={(e) => setQuantidadeComanda(normalizarQuantidadeInput(e.target.value))}
                        onBlur={() => setQuantidadeComanda(String(quantidadeParaNumero(quantidadeComanda)))}
                        className={`${FIELD_CONTROL} w-full sm:w-24 !py-2.5 text-sm font-mono`}
                      />
                      {comandaEhFrios && (
                        <>
                          <select
                            value={tipoFrioComanda}
                            onChange={(e) => setTipoFrioComanda(e.target.value)}
                            className={`${FIELD_CONTROL} w-full sm:w-auto !py-2.5 text-sm`}
                          >
                            {tiposFrios.map((tipo) => (
                              <option key={tipo} value={tipo}>
                                {tipo}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={pesoFrioComandaInput}
                            onChange={(e) =>
                              setPesoFrioComandaInput(e.target.value.replace(/[^\d,.]/g, ''))
                            }
                            className={`${FIELD_CONTROL} w-full sm:w-28 !py-2.5 text-sm font-mono`}
                          />
                          <select
                            value={pesoFrioComandaUnidade}
                            onChange={(e) => setPesoFrioComandaUnidade(e.target.value)}
                            className={`${FIELD_CONTROL} w-full sm:w-auto !py-2.5 text-sm`}
                          >
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                          </select>
                        </>
                      )}
                      <Button
                        type="button"
                        variant="success"
                        size="sm"
                        onClick={handleAdicionarItemComanda}
                        disabled={!produtoComandaSelecionado}
                        className="w-full sm:w-auto"
                      >
                        + Adicionar item
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>

      {/* Vendas Finalizadas */}
      <h3 className="text-lg font-semibold text-ink-900 mb-4 font-display">
        Vendas finalizadas
      </h3>
      <div className="space-y-4">
        {vendasOrdenadas.length === 0 ? (
          <Card className="border-dashed py-14 text-center">
            <p className="text-ink-600">Nenhuma venda registrada hoje.</p>
          </Card>
        ) : (
          vendasOrdenadas.map((venda) => (
            <Card key={venda.id}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-ink-900 font-display">
                    {venda.identificacao}
                  </h3>
                  <p className="text-sm text-ink-600">{formatarData(venda.data)}</p>
                  {venda.metodoPagamento && (
                    <p className="text-sm text-accent-800 mt-1">{venda.metodoPagamento}</p>
                  )}
                  {venda.metodoPagamento?.toLowerCase().includes('dinheiro') &&
                    (venda.valorRecebido != null || venda.troco != null) && (
                      <p className="text-sm text-ink-600 mt-1">
                        Recebido: R$ {(venda.valorRecebido || 0).toFixed(2)} | Troco: R${' '}
                        {(venda.troco || 0).toFixed(2)}
                      </p>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xl font-bold text-accent-800 tabular-nums font-display">
                    R$ {(venda.total || 0).toFixed(2)}
                  </p>
                  <Button type="button" variant="danger" size="sm" onClick={() => handleCancelarVenda(venda.id)}>
                    Cancelar compra
                  </Button>
                  <Button type="button" variant="primary" size="sm" onClick={() => setVendaAdicionarItem(venda)}>
                    + Adicionar item
                  </Button>
                </div>
              </div>
              {venda.itens && venda.itens.length > 0 && (
                <ul className="space-y-1 text-sm text-ink-600 border-t border-stone-200/80 pt-4">
                  {venda.itens.map((item) => (
                    <li key={item.id} className="flex justify-between gap-2">
                      <span>
                        {formatarQuantidadeItem(item)} {item.nome}
                      </span>
                      <span className="tabular-nums">
                        R${' '}
                        {(item.subtotal ?? item.preco * item.quantidade).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {vendaAdicionarItem?.id === venda.id && (
                <div className="mt-4 p-5 bg-accent-50/50 rounded-2xl border border-stone-200/80">
                  <p className="text-sm font-semibold mb-2 text-ink-900">Adicionar item à venda</p>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 items-stretch sm:items-end">
                    <select
                      value={produtoSelecionado}
                      onChange={(e) => setProdutoSelecionado(e.target.value)}
                      className={`${FIELD_CONTROL} w-full sm:w-auto sm:min-w-[180px] !py-2.5 text-sm`}
                    >
                      <option value="">Produto...</option>
                      {produtosOrdenados.map((p) => (
                        <option key={p.id} value={p.id} disabled={Number(p.estoque ?? 0) < 1}>
                          {rotuloProdutoOption(p)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={quantidade}
                      onChange={(e) => setQuantidade(normalizarQuantidadeInput(e.target.value))}
                      onBlur={() => setQuantidade(String(quantidadeParaNumero(quantidade)))}
                      className={`${FIELD_CONTROL} w-full sm:w-24 !py-2.5 text-sm font-mono`}
                    />
                    {vendaEhFrios && (
                      <>
                        <select
                          value={tipoFrioVenda}
                          onChange={(e) => setTipoFrioVenda(e.target.value)}
                          className={`${FIELD_CONTROL} w-full sm:w-auto !py-2.5 text-sm`}
                        >
                          {tiposFrios.map((tipo) => (
                            <option key={tipo} value={tipo}>
                              {tipo}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={pesoFrioVendaInput}
                          onChange={(e) => setPesoFrioVendaInput(e.target.value.replace(/[^\d,.]/g, ''))}
                          className={`${FIELD_CONTROL} w-full sm:w-28 !py-2.5 text-sm font-mono`}
                        />
                        <select
                          value={pesoFrioVendaUnidade}
                          onChange={(e) => setPesoFrioVendaUnidade(e.target.value)}
                          className={`${FIELD_CONTROL} w-full sm:w-auto !py-2.5 text-sm`}
                        >
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                        </select>
                      </>
                    )}
                    <Button
                      type="button"
                      variant="success"
                      size="sm"
                      onClick={handleAdicionarItemVenda}
                      disabled={!produtoSelecionado}
                      className="w-full sm:w-auto"
                    >
                      Adicionar
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        setVendaAdicionarItem(null)
                        setProdutoSelecionado('')
                        setQuantidade('1')
                        setTipoFrioVenda('Presunto')
                        setPesoFrioVendaInput('100')
                        setPesoFrioVendaUnidade('g')
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {comandaPagamento && totalComandaPendente != null && (
        <ModalPagamento
          total={totalComandaPendente}
          onConfirmar={handleConfirmarPagamento}
          onCancelar={() => setComandaPagamento(null)}
        />
      )}
    </div>
  )
}
