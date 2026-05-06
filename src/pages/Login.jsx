import { useState, useRef, useEffect } from 'react'
import { playSomVenda, playSomErro } from '../utils/sons'
import { isDemoApiMode } from '../services/api'
import { Button } from '../components/ui/Button'
import { FieldLabel, TextInput } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { BRAND_NAME } from '../config/brand'

export default function Login({ onLogin }) {
  const [nome, setNome] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const nomeRef = useRef(null)

  useEffect(() => {
    nomeRef.current?.focus()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    let resultado = null
    try {
      resultado = await onLogin(nome.trim(), senha)
    } catch (error) {
      playSomErro()
      setErro(error?.message || 'Erro ao conectar com o servidor')
      return
    }
    if (resultado.sucesso) {
      playSomVenda()
      return
    }
    playSomErro()
    setErro(resultado.erro || 'Erro ao fazer login')
    setSenha('')
  }

  return (
    <div className="relative min-h-screen bg-app-login flex flex-col lg:flex-row overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='56' height='56' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M28 2L54 28L28 54L2 28Z' fill='none' stroke='%23fcd9c9' stroke-width='0.35' opacity='0.22'/%3E%3C/svg%3E")`,
          backgroundSize: '44px 44px',
        }}
      />

      <section className="relative hidden lg:flex lg:w-[46%] flex-col justify-end p-12 xl:p-16 text-white z-[1]">
        <div className="max-w-md">
          <p className="text-sm uppercase tracking-[0.2em] text-accent-200/95 mb-4 font-medium">
            Cozinha de raiz · atendimento no salão
          </p>
          <h2 className="font-display text-4xl xl:text-[2.75rem] font-semibold leading-[1.1] mb-6 text-[#fcf7ef]">
            Ambiente caseiro com organização firme —{' '}
            <span className="text-accent-200">o cardápio e o caixa sempre à mão</span>.
          </h2>
          <p className="text-base text-white/70 leading-relaxed">
            Um painel sóbrio inspirado em mesa de madeira e papel craft: rápido de usar mesmo no pico do serviço.
          </p>
        </div>
      </section>

      <section className="relative flex flex-1 items-center justify-center p-5 sm:p-8 z-[1]">
        <div className="w-full max-w-[420px] animate-slide-up">
          <Card className="shadow-soft-xl ring-1 ring-white/10">
            <div className="text-center mb-8">
              <div className="inline-flex rounded-2xl bg-accent-50/90 p-2 ring-1 ring-accent-600/15 mb-5">
                <img
                  src="/logo-restaurante.svg"
                  alt={BRAND_NAME}
                  className="h-16 w-16 sm:h-[4.75rem] sm:w-[4.75rem] object-contain"
                />
              </div>
              <h1 className="font-display text-3xl sm:text-[1.95rem] font-semibold text-ink-900 tracking-tight mb-2 leading-snug">
                {BRAND_NAME}
              </h1>
              <p className="text-sm text-ink-600">Entre com seu usuário para abrir o painel.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isDemoApiMode() && (
                <p className="text-sm text-ink-700 bg-accent-50/90 border border-accent-600/15 rounded-2xl px-4 py-3 leading-snug">
                  Modo demo:{' '}
                  <strong className="text-accent-800">teste</strong> /{' '}
                  <strong className="text-accent-800">teste123</strong> ou{' '}
                  <strong className="text-accent-800">gestor</strong> /{' '}
                  <strong className="text-accent-800">teste123</strong>.
                </p>
              )}
              {erro && (
                <div
                  role="alert"
                  className="p-4 rounded-2xl bg-red-50 text-red-800 border border-red-200/80 text-sm animate-fade-in"
                >
                  {erro}
                </div>
              )}
              <div>
                <FieldLabel htmlFor="nome">Usuário</FieldLabel>
                <TextInput
                  ref={nomeRef}
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome do usuário"
                  required
                  autoComplete="username"
                />
              </div>
              <div>
                <FieldLabel htmlFor="senha">Senha</FieldLabel>
                <TextInput
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" variant="primary" size="lg" className="w-full rounded-[1rem] mt-2">
                Entrar
              </Button>
            </form>
          </Card>
        </div>
      </section>
    </div>
  )
}
