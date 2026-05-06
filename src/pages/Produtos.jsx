import { useState } from 'react'
import { useProdutos } from '../hooks/usePDV'
import {
  addProduto,
  editarProduto,
  excluirProduto,
} from '../services/storage'
import ProductImage from '../components/ProductImage'
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
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-amber-900">Produtos</h2>
        <button
          type="button"
          onClick={() => {
            limparForm()
            setMostrarForm(true)
          }}
          className="w-full sm:w-auto px-6 py-4 rounded-xl bg-amber-600 text-white font-bold text-lg hover:bg-amber-700 transition-colors touch-manipulation min-h-[56px] shadow-lg"
        >
          + Cadastrar Produto
        </button>
      </div>

      {produtos.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-amber-900 mb-1">
            Buscar produto para editar
          </label>
          <input
            type="search"
            value={buscaProduto}
            onChange={(e) => setBuscaProduto(e.target.value)}
            placeholder="Digite o nome do produto..."
            className="w-full px-4 py-3 rounded-lg border-2 border-amber-200 focus:border-amber-500 outline-none text-amber-900"
          />
        </div>
      )}

      {mostrarForm && (
        <form
          onSubmit={handleSalvar}
          className="mb-6 p-6 bg-white rounded-xl border-2 border-amber-200 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-amber-900 mb-4">
            {editando ? 'Editar produto' : 'Novo produto'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">
                Nome
              </label>
              <input
                type="text"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Ex: X-Burger"
                className="w-full px-4 py-3 rounded-lg border-2 border-amber-200 focus:border-amber-500 outline-none text-amber-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">
                Preço (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={formPreco}
                onChange={(e) => setFormPreco(formatarCentavosInput(e.target.value))}
                placeholder="0,00"
                className="w-full px-4 py-3 rounded-lg border-2 border-amber-200 focus:border-amber-500 outline-none text-amber-900 font-mono tabular-nums"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">
                Estoque
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formEstoque}
                onChange={(e) => setFormEstoque(sanitizarInteiro(e.target.value))}
                placeholder="0"
                className="w-full px-4 py-3 rounded-lg border-2 border-amber-200 focus:border-amber-500 outline-none text-amber-900 font-mono tabular-nums"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-amber-900 mb-1">
                URL da imagem
              </label>
              <input
                type="url"
                value={formImagem}
                onChange={(e) => setFormImagem(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-lg border-2 border-amber-200 focus:border-amber-500 outline-none text-amber-900"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="submit"
              className="px-4 py-3 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 touch-manipulation"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={limparForm}
              className="px-4 py-3 rounded-lg bg-stone-200 text-stone-700 font-semibold hover:bg-stone-300 touch-manipulation"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {produtos.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border-2 border-dashed border-amber-200">
          <p className="text-stone-500 text-lg mb-4">
            Nenhum produto cadastrado.
          </p>
          <p className="text-stone-500 text-sm mb-4">
            Cadastre produtos para poder adicioná-los às mesas.
          </p>
          <button
            type="button"
            onClick={() => setMostrarForm(true)}
            className="px-6 py-3 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors touch-manipulation"
          >
            Cadastrar primeiro produto
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {produtosFiltrados.map((produto) => (
            <div
              key={produto.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-amber-200/90 bg-white shadow-sm transition-shadow duration-200 hover:border-amber-300 hover:shadow-md"
            >
              <div className="transition-transform duration-300 group-hover:scale-[1.02]">
                <ProductImage src={produto.imagem} alt={produto.nome} variant="card" />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-amber-900 leading-snug">
                      {produto.nome}
                    </h3>
                    <p className="text-xl font-bold text-amber-700 tabular-nums mt-1.5">
                      {nomeEhFrios(produto.nome)
                        ? `R$ ${Number(produto.preco).toFixed(2)} / 100 g`
                        : `R$ ${Number(produto.preco).toFixed(2)}`}
                    </p>
                    <p className="text-sm text-stone-500 mt-1">
                      Estoque: {produto.estoque ?? 0}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditar(produto)}
                      className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors touch-manipulation"
                      aria-label="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExcluir(produto)}
                      className="w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors touch-manipulation disabled:opacity-50"
                      aria-label="Excluir"
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {produtos.length > 0 && produtosFiltrados.length === 0 && termoBusca && (
        <p className="mt-4 text-center text-stone-500">
          Nenhum produto encontrado para &quot;{buscaProduto}&quot;.
        </p>
      )}
    </div>
  )
}
