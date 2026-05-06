import { useMemo, useState } from 'react'
import { useEstoque } from '../hooks/useEstoque'
import { useProdutos } from '../hooks/usePDV'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { FieldLabel, FIELD_CONTROL } from '../components/ui/Input'
import { playSomAcao, playSomErro } from '../utils/sons'

export default function Estoque() {
  const [produtos, estoqueBaixo, refresh, { setEstoque, incrementarEstoque, limparEstoqueNaoFixos }] =
    useEstoque()
  const [produtosAll] = useProdutos()
  const { usuario, isAdmin } = useAuth()
  const toast = useToast()
  const [buscaProduto, setBuscaProduto] = useState('')
  const [editando, setEditando] = useState(null)
  const [valorEntrada, setValorEntrada] = useState('')
  const [limpandoEstoque, setLimpandoEstoque] = useState(false)

  function sanitizarInteiro(valor) {
    return String(valor || '').replace(/\D/g, '')
  }

  function ordenarPorNome(a, b) {
    return String(a?.nome || '').localeCompare(String(b?.nome || ''), 'pt-BR', {
      sensitivity: 'base',
    })
  }

  async function handleSalvarEstoque(produtoId) {
    const v = parseInt(valorEntrada, 10)
    if (isNaN(v) || v < 0) return
    const r = await setEstoque(produtoId, v)
    if (r.sucesso) {
      await refresh()
      setEditando(null)
      setValorEntrada('')
    }
  }

  async function handleEntrada(produtoId) {
    const v = parseInt(valorEntrada, 10)
    if (isNaN(v) || v <= 0) return
    const r = await incrementarEstoque(produtoId, v)
    if (r.sucesso) {
      await refresh()
      setEditando(null)
      setValorEntrada('')
    }
  }

  async function handleLimparEstoqueNaoFixos() {
    if (!isAdmin || !usuario?.id || limpandoEstoque) return

    const confirmou = window.confirm(
      'Isso vai zerar o estoque de todos os produtos do cardápio. Deseja continuar?'
    )
    if (!confirmou) return

    const confirmouNovamente = window.confirm(
      'Confirma LIMPAR TODO O ESTOQUE? Essa ação não pode ser desfeita.'
    )
    if (!confirmouNovamente) return

    setLimpandoEstoque(true)
    try {
      const result = await limparEstoqueNaoFixos(usuario.id)
      if (result?.sucesso) {
        playSomAcao()
        await refresh()
        toast.show(`Estoque limpo! Produtos atualizados: ${Number(result.atualizados || 0)}`)
      } else {
        playSomErro()
        toast.show(result?.erro || 'Não foi possível limpar o estoque', 'error')
      }
    } finally {
      setLimpandoEstoque(false)
    }
  }

  const produtosParaExibir = useMemo(() => {
    const base =
      produtos.length > 0 ? [...produtos] : produtosAll.map((p) => ({ ...p, estoque: p.estoque ?? 0 }))
    return base.sort(ordenarPorNome)
  }, [produtos, produtosAll])

  const estoqueBaixoOrdenado = useMemo(
    () => [...estoqueBaixo].sort(ordenarPorNome),
    [estoqueBaixo]
  )

  const termoBusca = String(buscaProduto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  const produtosFiltrados = useMemo(
    () =>
      termoBusca
        ? produtosParaExibir.filter((p) =>
            String(p?.nome || '')
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .includes(termoBusca)
          )
        : produtosParaExibir,
    [produtosParaExibir, termoBusca]
  )

  return (
    <div className="animate-fade-in space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-accent-700">Operação</p>
          <h2 className="font-display text-3xl font-semibold text-ink-900 tracking-tight mt-1">Estoque</h2>
        </div>
        {isAdmin && (
          <Button
            type="button"
            variant="danger"
            disabled={limpandoEstoque}
            onClick={handleLimparEstoqueNaoFixos}
            className="w-full sm:w-auto"
          >
            {limpandoEstoque ? 'Limpando estoque...' : 'Zerar todo o estoque'}
          </Button>
        )}
      </header>

      {estoqueBaixoOrdenado.length > 0 && (
        <Card className="border-amber-200/80 bg-amber-50/50">
          <p className="font-semibold text-ink-900">
            ⚠️ {estoqueBaixoOrdenado.length} produto(s) com estoque baixo (menos de 5 unidades)
          </p>
          <p className="text-sm text-ink-700 mt-2 leading-relaxed">
            {estoqueBaixoOrdenado.map((p) => `${p.nome} (${p.estoque ?? 0})`).join(', ')}
          </p>
        </Card>
      )}

      {produtosParaExibir.length === 0 ? (
        <Card className="border-dashed py-16 text-center">
          <p className="text-ink-600">Nenhum produto cadastrado.</p>
          <p className="text-ink-500 text-sm mt-2">Cadastre produtos na secção Produtos.</p>
        </Card>
      ) : (
        <>
          <div>
            <FieldLabel htmlFor="busca-estoque">Buscar produto</FieldLabel>
            <input
              id="busca-estoque"
              type="search"
              value={buscaProduto}
              onChange={(e) => setBuscaProduto(e.target.value)}
              placeholder="Digite o nome do produto..."
              className={FIELD_CONTROL}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {produtosFiltrados.map((produto) => {
              const baixo = (produto.estoque ?? 0) < 5
              const isEditando = editando?.id === produto.id

              return (
                <Card
                  key={produto.id}
                  className={baixo ? 'border-amber-300/90 bg-amber-50/30' : ''}
                >
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-ink-900">{produto.nome}</h3>
                      <p className="text-2xl font-bold text-accent-800 tabular-nums mt-1">
                        Estoque: {produto.estoque ?? 0}
                      </p>
                    </div>
                  </div>

                  {isEditando ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={valorEntrada}
                        onChange={(e) => setValorEntrada(sanitizarInteiro(e.target.value))}
                        placeholder="Quantidade"
                        className={FIELD_CONTROL}
                      />
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button type="button" variant="primary" className="flex-1" onClick={() => handleSalvarEstoque(produto.id)}>
                          Definir
                        </Button>
                        <Button type="button" variant="success" className="flex-1" onClick={() => handleEntrada(produto.id)}>
                          + Entrada
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setEditando(null)
                            setValorEntrada('')
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button type="button" variant="primary" className="w-full" onClick={() => setEditando(produto)}>
                      Atualizar estoque
                    </Button>
                  )}
                </Card>
              )
            })}
          </div>
          {produtosFiltrados.length === 0 && termoBusca && (
            <p className="text-center text-ink-600">Nenhum produto encontrado para &quot;{buscaProduto}&quot;</p>
          )}
        </>
      )}
    </div>
  )
}
