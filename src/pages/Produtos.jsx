import { useState } from 'react'
import { useProdutos } from '../hooks/usePDV'
import {
  addProduto,
  editarProduto,
  excluirProduto,
} from '../services/storage'
import ProductImage from '../components/ProductImage'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { FieldLabel, TextInput, FIELD_CONTROL } from '../components/ui/Input'
import { playSomAcao, playSomErro } from '../utils/sons'
import { formatarCentavosInput, moedaInputParaNumero, numeroParaMoedaInput } from '../utils/moeda'

export default function Produtos() {
  const [produtos, refreshProdutos] = useProdutos()
  const [editando, setEditando] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [buscaProduto, setBuscaProduto] = useState('')
  const [formNome, setFormNome] = useState('')
  const [formPreco, setFormPreco] = useState('')
  const [formEstoque, setFormEstoque] = useState('0')
  const [formImagem, setFormImagem] = useState('')

  function sanitizarInteiro(valor) {
    return String(valor || '').replace(/\D/g, '')
  }

  function limparForm() {
    setFormNome('')
    setFormPreco('')
    setFormEstoque('0')
    setFormImagem('')
    setEditando(null)
    setMostrarForm(false)
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

  async function handleSalvar(e) {
    e.preventDefault()
    const nome = formNome.trim()
    const preco = moedaInputParaNumero(formPreco)
    if (!nome || isNaN(preco) || preco <= 0) {
      playSomErro()
      return
    }

    const estoque = Math.max(0, parseInt(formEstoque, 10) || 0)
    try {
      if (editando) {
        await editarProduto(editando.id, nome, preco, estoque, formImagem.trim())
      } else {
        await addProduto({ nome, preco, estoque, imagem: formImagem.trim() })
      }
    } catch (error) {
      playSomErro()
      window.alert(error?.message || 'Não foi possível salvar o produto.')
      return
    }
    playSomAcao()
    await refreshProdutos()
    limparForm()
  }

  function handleEditar(produto) {
    setEditando(produto)
    setFormNome(produto.nome)
    setFormPreco(numeroParaMoedaInput(produto.preco))
    setFormEstoque(String(produto.estoque ?? 0))
    setFormImagem(String(produto.imagem || ''))
    setMostrarForm(true)
  }

  async function handleExcluir(produto) {
    if (window.confirm(`Excluir "${produto.nome}"?`)) {
      try {
        await excluirProduto(produto.id)
      } catch (error) {
        playSomErro()
        window.alert(error?.message || 'Não foi possível excluir o produto.')
        return
      }
      playSomAcao()
      await refreshProdutos()
      if (editando?.id === produto.id) limparForm()
    }
  }

  const termoBusca = String(buscaProduto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

  const produtosFiltrados = termoBusca
    ? produtos.filter((produto) =>
        String(produto?.nome || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .includes(termoBusca)
      )
    : produtos

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-accent-700">Cardápio</p>
          <h2 className="font-display text-3xl font-semibold text-ink-900 tracking-tight mt-1">
            Produtos
          </h2>
        </header>
        <Button
          type="button"
          size="lg"
          onClick={() => {
            limparForm()
            setMostrarForm(true)
          }}
          className="w-full sm:w-auto"
        >
          + Cadastrar produto
        </Button>
      </div>

      {produtos.length > 0 && (
        <div>
          <FieldLabel htmlFor="busca-prod">Buscar produto para editar</FieldLabel>
          <input
            id="busca-prod"
            type="search"
            value={buscaProduto}
            onChange={(e) => setBuscaProduto(e.target.value)}
            placeholder="Digite o nome do produto..."
            className={FIELD_CONTROL}
          />
        </div>
      )}

      {mostrarForm && (
        <Card className="animate-slide-up">
          <h3 className="text-lg font-semibold text-ink-900 mb-6 font-display">
            {editando ? 'Editar produto' : 'Novo produto'}
          </h3>
          <form onSubmit={handleSalvar} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <FieldLabel htmlFor="form-nome">Nome</FieldLabel>
                <TextInput
                  id="form-nome"
                  type="text"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Filé grelhado"
                  required
                />
              </div>
              <div>
                <FieldLabel htmlFor="form-preco">Preço (R$)</FieldLabel>
                <TextInput
                  id="form-preco"
                  type="text"
                  inputMode="decimal"
                  value={formPreco}
                  onChange={(e) => setFormPreco(formatarCentavosInput(e.target.value))}
                  placeholder="0,00"
                  className="font-mono tabular-nums"
                  required
                />
              </div>
              <div>
                <FieldLabel htmlFor="form-estoque">Estoque</FieldLabel>
                <TextInput
                  id="form-estoque"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formEstoque}
                  onChange={(e) => setFormEstoque(sanitizarInteiro(e.target.value))}
                  placeholder="0"
                  className="font-mono tabular-nums"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <FieldLabel htmlFor="form-img">URL da imagem</FieldLabel>
                <TextInput
                  id="form-img"
                  type="url"
                  value={formImagem}
                  onChange={(e) => setFormImagem(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="submit" variant="primary">
                Salvar
              </Button>
              <Button type="button" variant="secondary" onClick={limparForm}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {produtos.length === 0 ? (
        <Card className="border-dashed py-16 text-center">
          <p className="text-ink-600 text-lg mb-2">Nenhum produto cadastrado.</p>
          <p className="text-ink-500 text-sm mb-6">Cadastre itens para usar nas mesas.</p>
          <Button type="button" onClick={() => setMostrarForm(true)}>
            Cadastrar primeiro produto
          </Button>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {produtosFiltrados.map((produto) => (
            <Card
              key={produto.id}
              padded={false}
              className="group overflow-hidden hover:shadow-soft-lg transition-shadow duration-300"
            >
              <div className="transition-transform duration-300 group-hover:scale-[1.02]">
                <ProductImage src={produto.imagem} alt={produto.nome} variant="card" />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-ink-900 leading-snug">{produto.nome}</h3>
                    <p className="text-xl font-bold text-accent-800 tabular-nums mt-2">
                      {nomeEhFrios(produto.nome)
                        ? `R$ ${Number(produto.preco).toFixed(2)} / 100 g`
                        : `R$ ${Number(produto.preco).toFixed(2)}`}
                    </p>
                    <p className="text-sm text-ink-600 mt-1">
                      Estoque: {produto.estoque ?? 0}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="subtle"
                      size="sm"
                      className="!p-2 !min-h-0 !w-10 rounded-xl"
                      onClick={() => handleEditar(produto)}
                      aria-label="Editar"
                    >
                      ✏️
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      className="!p-2 !min-h-0 !w-10 rounded-xl !bg-red-50 !text-red-600 !border-red-200 hover:!bg-red-100"
                      onClick={() => handleExcluir(produto)}
                      aria-label="Excluir"
                      title="Excluir"
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {produtos.length > 0 && produtosFiltrados.length === 0 && termoBusca && (
        <p className="text-center text-ink-600">Nenhum produto encontrado para &quot;{buscaProduto}&quot;.</p>
      )}
    </div>
  )
}
