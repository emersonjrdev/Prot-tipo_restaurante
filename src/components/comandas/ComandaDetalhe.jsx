import { useEffect, useMemo, useState } from 'react'
import ItemRow from './ItemRow'
import {
  adicionarItem,
  removerItem,
  alterarQtd,
  enviarParaCaixa,
} from '../../services/storage'
import { useToast } from '../../contexts/ToastContext'
import { playSomAcao, playSomErro } from '../../utils/sons'
import ProductImage from '../ProductImage'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { FieldLabel, FIELD_CONTROL } from '../ui/Input'

export default function ComandaDetalhe({
  comanda,
  produtos,
  onComandaAtualizada,
  onEnviada,
  onVoltar,
  isMobile = false,
  isTablet = false,
}) {
  const [mostrarAdicionar, setMostrarAdicionar] = useState(isMobile || isTablet)
  const [buscaProduto, setBuscaProduto] = useState('')
  const [produtoSelecionado, setProdutoSelecionado] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [tipoFrio, setTipoFrio] = useState('Presunto')
  const [pesoFrioInput, setPesoFrioInput] = useState('100')
  const [pesoFrioUnidade, setPesoFrioUnidade] = useState('g')
  const toast = useToast()
  const tiposFrios = ['Presunto', 'Queijo', 'Mortadela', 'Peito de Peru', 'Salame']

  const total =
    comanda.total ??
    (comanda.itens || []).reduce(
      (acc, item) => acc + (item.subtotal ?? item.preco * item.quantidade),
      0
    )

  function estoqueDisponivel(produtoId) {
    const produto = produtos.find((p) => String(p.id) === String(produtoId))
    return Number(produto?.estoque ?? 0)
  }

  const produtosOrdenados = useMemo(
    () =>
      [...produtos].sort((a, b) =>
        String(a?.nome || '').localeCompare(String(b?.nome || ''), 'pt-BR', {
          sensitivity: 'base',
        })
      ),
    [produtos]
  )

  const termoBusca = String(buscaProduto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  const produtosFiltrados = useMemo(
    () =>
      termoBusca
        ? produtosOrdenados.filter((p) =>
            String(p?.nome || '')
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .includes(termoBusca)
          )
        : produtosOrdenados,
    [produtosOrdenados, termoBusca]
  )
  const produtoSelecionadoObj = produtos.find((p) => String(p.id) === String(produtoSelecionado))
  const selecionadoEhFrios =
    String(produtoSelecionadoObj?.nome || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase() === 'frios'

  useEffect(() => {
    if (isMobile || isTablet) {
      setMostrarAdicionar(true)
    }
  }, [isMobile, isTablet])

  async function handleAdicionarProduto() {
    if (!produtoSelecionado) return
    const quantidadeNum = Math.max(1, parseInt(quantidade, 10) || 1)
    const pesoBase = Math.max(1, parseFloat(String(pesoFrioInput || '').replace(',', '.')) || 0)
    const pesoGramas = pesoFrioUnidade === 'kg' ? Math.round(pesoBase * 1000) : Math.round(pesoBase)
    const estoqueNecessario = selecionadoEhFrios ? pesoGramas : quantidadeNum

    if (estoqueDisponivel(produtoSelecionado) < estoqueNecessario) {
      playSomErro()
      toast.show('Estoque insuficiente para este produto', 'error')
      return
    }

    const payload = selecionadoEhFrios
      ? { pesoGramas, tipoFrio }
      : { quantidade: quantidadeNum }
    try {
      const atualizada = await adicionarItem(comanda.id, produtoSelecionado, payload)
      if (atualizada) {
        playSomAcao()
        onComandaAtualizada(atualizada)
        setBuscaProduto('')
        setProdutoSelecionado('')
        setQuantidade('1')
        setTipoFrio('Presunto')
        setPesoFrioInput('100')
        setPesoFrioUnidade('g')
        setMostrarAdicionar(!isMobile) // no mobile continua aberto
      } else {
        playSomErro()
        toast.show('Não foi possível adicionar o item', 'error')
      }
    } catch (err) {
      playSomErro()
      toast.show(err?.message || 'Erro ao adicionar item. Verifique a conexão.', 'error')
    }
  }

  async function handleQuantidadeChange(itemId, novaQuantidade) {
    try {
      const atualizada = await alterarQtd(comanda.id, itemId, novaQuantidade)
      if (atualizada) onComandaAtualizada(atualizada)
    } catch (err) {
      playSomErro()
      toast.show(err?.message || 'Erro ao alterar quantidade', 'error')
    }
  }

  async function handleRemover(itemId) {
    try {
      const atualizada = await removerItem(comanda.id, itemId)
      if (atualizada) onComandaAtualizada(atualizada)
    } catch (err) {
      playSomErro()
      toast.show(err?.message || 'Erro ao remover item', 'error')
    }
  }

  async function handleEnviarParaCaixa() {
    if (total <= 0) {
      toast.show('Adicione itens à mesa antes de enviar', 'warning')
      return
    }
    try {
      const enviada = await enviarParaCaixa(comanda.id)
      if (enviada) {
        playSomAcao()
        toast.show('Mesa enviada para o caixa!')
        onEnviada()
      } else {
        playSomErro()
        toast.show('Erro ao enviar mesa', 'error')
      }
    } catch (err) {
      playSomErro()
      toast.show(err?.message || 'Erro ao enviar mesa. Verifique a conexão.', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Button
          type="button"
          variant="subtle"
          onClick={onVoltar}
          className={isMobile || isTablet ? '!px-6 !py-4 text-lg min-h-[52px]' : ''}
        >
          ← Voltar
        </Button>
        <h2 className={`font-display font-semibold text-ink-900 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
          {comanda.identificacao}
        </h2>
      </div>

      <Card>
        <div className={`mb-5 ${isMobile ? 'space-y-3' : 'flex items-center justify-between'}`}>
          <h3 className="text-lg font-semibold text-ink-900">Itens</h3>
          {produtos.length > 0 && (
            <Button
              type="button"
              variant="primary"
              onClick={() => setMostrarAdicionar(!mostrarAdicionar)}
              className={isMobile || isTablet ? 'w-full min-h-[44px]' : ''}
            >
              {mostrarAdicionar ? 'Fechar adição de produto' : '+ Adicionar produto'}
            </Button>
          )}
        </div>

        {mostrarAdicionar && produtos.length > 0 && (
          <div className="mb-6 p-5 bg-accent-50/60 rounded-2xl border border-accent-200/70 space-y-4">
            <div>
              <FieldLabel htmlFor="busca-item-mesa">Buscar e selecionar item do cardápio</FieldLabel>
              <input
                id="busca-item-mesa"
                type="search"
                value={produtoSelecionado ? (produtos.find((p) => String(p.id) === String(produtoSelecionado))?.nome ?? '') : buscaProduto}
                onChange={(e) => {
                  const v = e.target.value
                  setProdutoSelecionado('')
                  setBuscaProduto(v)
                }}
                onFocus={() => produtoSelecionado && setProdutoSelecionado('')}
                placeholder="Digite o nome do produto..."
                className={FIELD_CONTROL}
              />
              {produtosFiltrados.length > 0 && !produtoSelecionado && (buscaProduto.length > 0 || produtosFiltrados.length <= 10) && (
                <div className="mt-2 max-h-52 overflow-y-auto rounded-2xl border border-stone-200/90 bg-[#fffdfb] shadow-soft">
                  {produtosFiltrados.map((p) => {
                    const disponivel = estoqueDisponivel(p.id) >= 1
                    const ehFriosItem =
                      String(p?.nome || '')
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .toLowerCase() === 'frios'
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          if (disponivel) {
                            setProdutoSelecionado(p.id)
                            setBuscaProduto('')
                          }
                        }}
                        disabled={!disponivel}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-accent-50/60 disabled:opacity-50 disabled:cursor-not-allowed first:pt-3 last:pb-3 ${disponivel ? 'cursor-pointer' : ''}`}
                      >
                        <ProductImage src={p.imagem} alt="" variant="thumb" />
                        <span className="min-w-0 flex-1 leading-snug text-ink-900">
                          <span className="font-medium">{p.nome}</span>{' '}
                          <span className="text-ink-600 font-normal">
                            {ehFriosItem
                              ? `· R$ ${Number(p.preco).toFixed(2)} / 100 g`
                              : `· R$ ${Number(p.preco).toFixed(2)}`}{' '}
                            {estoqueDisponivel(p.id) < 1 ? '(sem estoque)' : ''}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
              {termoBusca && produtosFiltrados.length === 0 && (
                <p className="mt-1 text-sm text-ink-600">Nenhum produto encontrado</p>
              )}
            </div>
            {produtoSelecionado && (
            <>
            <ProductImage
              src={produtoSelecionadoObj?.imagem}
              alt={produtoSelecionadoObj?.nome || ''}
              variant="card"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selecionadoEhFrios ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-ink-800 mb-1">Tipo de frio</label>
                  <select
                    value={tipoFrio}
                    onChange={(e) => setTipoFrio(e.target.value)}
                    className={FIELD_CONTROL}
                  >
                    {tiposFrios.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={pesoFrioInput}
                      onChange={(e) => setPesoFrioInput(e.target.value.replace(/[^\d,.]/g, ''))}
                      className={`${FIELD_CONTROL} font-mono tabular-nums`}
                    />
                    <select
                      value={pesoFrioUnidade}
                      onChange={(e) => setPesoFrioUnidade(e.target.value)}
                      className={`${FIELD_CONTROL} !w-auto shrink-0`}
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-ink-800 mb-1">
                    Quantidade
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value.replace(/\D/g, ''))}
                    onBlur={() => {
                      const quantidadeNum = Math.max(1, parseInt(quantidade, 10) || 1)
                      setQuantidade(String(quantidadeNum))
                    }}
                    className={`${FIELD_CONTROL} font-mono tabular-nums`}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <Button type="button" variant="primary" onClick={handleAdicionarProduto}>
                Adicionar
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setProdutoSelecionado('')
                  setBuscaProduto('')
                  setQuantidade('1')
                  setTipoFrio('Presunto')
                  setPesoFrioInput('100')
                  setPesoFrioUnidade('g')
                }}
              >
                Trocar produto
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setMostrarAdicionar(false)
                  setBuscaProduto('')
                  setProdutoSelecionado('')
                  setQuantidade('1')
                  setTipoFrio('Presunto')
                  setPesoFrioInput('100')
                  setPesoFrioUnidade('g')
                }}
              >
                Cancelar
              </Button>
            </div>
            </>
            )}
          </div>
        )}

        <div className="space-y-2">
          {(!comanda.itens || comanda.itens.length === 0) ? (
            <p className="py-8 text-center text-ink-600">
              {produtos.length === 0
                ? 'Cadastre produtos primeiro para adicionar à mesa.'
                : 'Nenhum item na mesa. Clique em "Adicionar produto" para começar.'}
            </p>
          ) : (
            comanda.itens.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onQuantidadeChange={handleQuantidadeChange}
                onRemover={handleRemover}
              />
            ))
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-stone-200/90 flex justify-end">
          <p className="text-xl font-bold text-ink-900 tabular-nums font-display">
            Total: R$ {total.toFixed(2)}
          </p>
        </div>
      </Card>

      <Button
        type="button"
        variant="primary"
        size="lg"
        onClick={handleEnviarParaCaixa}
        className={
          isMobile || isTablet ? 'w-full !text-xl min-h-[64px]' : 'sm:w-auto w-full'
        }
      >
        Enviar para Caixa
      </Button>
    </div>
  )
}