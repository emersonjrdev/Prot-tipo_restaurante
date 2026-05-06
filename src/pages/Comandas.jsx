import { useState, useRef, useEffect } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { FIELD_CONTROL } from '../components/ui/Input'
import ComandaCard from '../components/comandas/ComandaCard'
import ComandaDetalhe from '../components/comandas/ComandaDetalhe'
import { criarComanda, excluirComandasAbertas } from '../services/storage'
import { useComandas, useProdutos } from '../hooks/usePDV'
import { useResponsive } from '../hooks/useResponsive'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { playSomAcao, playSomErro } from '../utils/sons'

export default function ComandasPage() {
  const [comandas, refreshComandas] = useComandas()
  const [produtos] = useProdutos()
  const { usuario, isAdmin } = useAuth()
  const toast = useToast()
  const [comandaSelecionada, setComandaSelecionada] = useState(null)
  const [mostrarModalNovaComanda, setMostrarModalNovaComanda] = useState(false)
  const [numeroNovaMesa, setNumeroNovaMesa] = useState('')
  const [criandoComanda, setCriandoComanda] = useState(false)
  const [busca, setBusca] = useState('')
  const bipadorRef = useRef(null)
  const { isMobile, isTablet } = useResponsive()

  function normalizarTexto(valor) {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  }

  const termoBusca = normalizarTexto(busca)
  const comandasFiltradas = termoBusca
    ? comandas.filter((c) => {
        const camposBusca = [
          c.identificacao,
          c.cliente,
          c.numero_comanda,
          c.numeroComanda,
          c.id,
        ]

        return camposBusca.some((campo) => normalizarTexto(campo).includes(termoBusca))
      })
    : comandas

  useEffect(() => {
    if (isMobile) bipadorRef.current?.focus()
  }, [isMobile])

  async function handleCriarNovaComanda() {
    const numeroMesa = String(numeroNovaMesa || '').trim()
    if (!numeroMesa) {
      playSomErro()
      return
    }
    if (!/^\d+$/.test(numeroMesa)) {
      playSomErro()
      return
    }
    const numeroInt = Number.parseInt(numeroMesa, 10)
    if (!Number.isFinite(numeroInt) || numeroInt < 1 || numeroInt > 100) {
      playSomErro()
      toast.show('Número da mesa deve estar entre 1 e 100', 'error')
      return
    }

    const numeroFormatado = String(numeroInt).padStart(3, '0')
    setCriandoComanda(true)
    let nova = null
    const timeoutMs = 25000
    const criarComPromise = criarComanda(numeroFormatado)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('A requisição demorou muito. Tente novamente.')), timeoutMs)
    )
    try {
      nova = await Promise.race([criarComPromise, timeoutPromise])
    } catch (error) {
      playSomErro()
      toast.show(error?.message || 'Não foi possível criar a mesa. Verifique a conexão.', 'error')
      return
    } finally {
      setCriandoComanda(false)
    }
    if (!nova) {
      playSomErro()
      toast.show('Não foi possível criar a mesa. Tente novamente.', 'error')
      return
    }
    playSomAcao()
    setMostrarModalNovaComanda(false)
    setNumeroNovaMesa('')
    setComandaSelecionada(nova)
    refreshComandas().catch(() => {})
  }

  function abrirModalNovaComanda() {
    setNumeroNovaMesa('')
    setMostrarModalNovaComanda(true)
  }

  function fecharModalNovaComanda() {
    setMostrarModalNovaComanda(false)
    setNumeroNovaMesa('')
  }

  function handleAbrirComanda(comanda) {
    setComandaSelecionada(comanda)
  }

  function handleAtualizarComanda(comandaAtualizada) {
    if (comandaAtualizada) setComandaSelecionada(comandaAtualizada)
    refreshComandas()
  }

  function handleEnviada() {
    refreshComandas()
    setComandaSelecionada(null)
  }

  function handleVoltar() {
    setComandaSelecionada(null)
  }

  async function handleExcluirComandasAbertas() {
    if (!isAdmin) return

    const confirmou = window.confirm('Excluir TODAS as mesas abertas agora?')
    if (!confirmou) return
    const confirmouNovamente = window.confirm('Confirma esta exclusão? Esta ação não pode ser desfeita.')
    if (!confirmouNovamente) return

    try {
      const result = await excluirComandasAbertas(usuario?.id)
      if (result?.sucesso) {
        playSomAcao()
        setComandaSelecionada(null)
        await refreshComandas()
        toast.show(`Mesas abertas removidas: ${Number(result.removidas || 0)}`)
      } else {
        playSomErro()
        toast.show('Não foi possível excluir as mesas abertas', 'error')
      }
    } catch (error) {
      playSomErro()
      toast.show(error?.message || 'Erro ao excluir mesas abertas', 'error')
    }
  }


  const paddingClass = isMobile ? 'pb-24' : ''

  if (comandaSelecionada) {
    const comandaAtual = comandas.find((c) => c.id === comandaSelecionada.id) || comandaSelecionada
    return (
      <div className={paddingClass}>
        {!isMobile && (
          <header className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-accent-700">Salão</p>
            <h2 className="font-display text-3xl font-semibold text-ink-900 tracking-tight mt-1">Mesas</h2>
          </header>
        )}
        <ComandaDetalhe
          comanda={comandaAtual}
          produtos={produtos}
          onComandaAtualizada={handleAtualizarComanda}
          onEnviada={handleEnviada}
          onVoltar={handleVoltar}
          isMobile={isMobile}
          isTablet={isTablet}
        />
      </div>
    )
  }

  return (
    <div className={paddingClass}>
      <div
        className={`flex flex-col gap-4 mb-6 ${isMobile ? 'gap-6' : ''}`}
      >
        {!isMobile && (
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <header>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-accent-700">Salão</p>
              <h2 className="font-display text-3xl font-semibold text-ink-900 tracking-tight mt-1">Mesas</h2>
            </header>
          </div>
        )}

        <input
          type="search"
          placeholder="Buscar mesa..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className={`${FIELD_CONTROL} text-lg py-4`}
        />

        <Button
          type="button"
          size={isMobile || isTablet ? 'lg' : 'lg'}
          onClick={abrirModalNovaComanda}
          className={`w-full ${isMobile || isTablet ? '!text-xl min-h-[72px]' : ''}`}
        >
          + Nova mesa
        </Button>

        {isAdmin && (
          <Button
            type="button"
            variant="danger"
            onClick={handleExcluirComandasAbertas}
            className={`w-full ${isMobile || isTablet ? '!text-xl min-h-[64px]' : ''}`}
          >
            Excluir mesas abertas (admin)
          </Button>
        )}
      </div>

      {comandasFiltradas.length === 0 ? (
        <Card className="border-dashed py-16 text-center">
          <p className="text-ink-600 text-lg mb-4">
            {busca.trim() ? 'Nenhuma mesa encontrada.' : 'Nenhuma mesa aberta.'}
          </p>
          {!busca.trim() && (
            <Button
              type="button"
              onClick={abrirModalNovaComanda}
              size={isMobile ? 'lg' : 'md'}
            >
              Abrir primeira mesa
            </Button>
          )}
        </Card>
      ) : (
        <div
          className={`grid gap-4 ${
            isMobile
              ? 'grid-cols-1 gap-5'
              : isTablet
                ? 'sm:grid-cols-2'
                : 'sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {comandasFiltradas.map((comanda) => (
            <ComandaCard
              key={comanda.id}
              comanda={comanda}
              onClick={handleAbrirComanda}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}

      {mostrarModalNovaComanda && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-[2px] animate-fade-in">
          <Card className="w-full max-w-md animate-slide-up shadow-soft-xl">
            <h3 className="font-display text-xl font-semibold text-ink-900 mb-1">Nova mesa</h3>
            <p className="text-xs uppercase tracking-[0.12em] text-accent-700 font-semibold mb-4">Registo</p>
            <label className="block text-sm font-medium text-ink-800 mb-2" htmlFor="numero-mesa-modal">
              Número da mesa
            </label>
            <input
              id="numero-mesa-modal"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoFocus
              value={numeroNovaMesa}
              onChange={(e) => setNumeroNovaMesa(e.target.value.replace(/\D/g, ''))}
              placeholder="001 a 100"
              className={FIELD_CONTROL}
            />
            <p className="text-xs text-ink-600 mt-2">Aceita apenas números de 1 até 100.</p>
            <div className="mt-6 flex gap-3 justify-end flex-wrap">
              <Button type="button" variant="secondary" onClick={fecharModalNovaComanda}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={!numeroNovaMesa.trim() || criandoComanda}
                onClick={handleCriarNovaComanda}
              >
                {criandoComanda ? 'Criando...' : 'Criar'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#fdfaf5]/96 backdrop-blur-md border-t border-stone-200/85 safe-area-pb shadow-soft-lg">
          <input
            ref={bipadorRef}
            type="text"
            inputMode="search"
            placeholder="Bipador / Busca rápida..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={`${FIELD_CONTROL} text-lg py-4`}
          />
        </div>
      )}
    </div>
  )
}