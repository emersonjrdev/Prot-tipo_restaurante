/** Simulação local da API (Firestore + Express) para demo sem backend — persiste em localStorage. */

const STORAGE_KEY = 'sistema-comandas:demo-backend-v1'

// Cardápio com preços fixos no cadastro (sem “valor no caixa”).

class HttpErr extends Error {
  constructor(status, message, extra = {}) {
    super(message)
    this.status = status
    this.extra = extra
  }
}

function gerarId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function normalizarNomeProduto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function produtoEhFrios(produto) {
  return normalizarNomeProduto(produto?.nome) === normalizarNomeProduto('Frios')
}

function estoqueDisponivelParaVenda(produto) {
  return Number(produto?.estoque ?? 0)
}

function normalizarNumeroComanda(valor) {
  const raw = String(valor || '').trim()
  if (!/^\d+$/.test(raw)) return null
  const numeroInt = Number.parseInt(raw, 10)
  if (!Number.isFinite(numeroInt) || numeroInt < 1 || numeroInt > 100) return null
  return String(numeroInt).padStart(3, '0')
}

function calcularTotal(itens = []) {
  return (itens || []).reduce(
    (acc, item) =>
      acc + Number(item.subtotal ?? Number(item.preco || 0) * Number(item.quantidade || 0)),
    0
  )
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

function formatarDataSp(value = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value)
}

function obterHoraSp(value = new Date()) {
  return (
    Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        hour12: false,
      }).format(value)
    ) || 0
  )
}

function somarTotais(vendas = []) {
  const vendasAtivas = (vendas || []).filter((v) => v?.cancelada !== true)
  const totalDinheiro = vendasAtivas
    .filter((v) => String(v.metodoPagamento || '').toLowerCase().includes('dinheiro'))
    .reduce((acc, v) => acc + Number(v.total || 0), 0)
  const totalCartao = vendasAtivas
    .filter((v) => String(v.metodoPagamento || '').toLowerCase().includes('cart'))
    .reduce((acc, v) => acc + Number(v.total || 0), 0)
  const totalPix = vendasAtivas
    .filter((v) => String(v.metodoPagamento || '').toLowerCase().includes('pix'))
    .reduce((acc, v) => acc + Number(v.total || 0), 0)
  return {
    totalDinheiro,
    totalCartao,
    totalPix,
    totalHoje: totalDinheiro + totalCartao + totalPix,
  }
}

function getDefaultState() {
  const now = new Date().toISOString()
  const usuarios = {}
  const a1 = gerarId()
  const a2 = gerarId()
  usuarios[a1] = { id: a1, nome: 'gestor', senha: 'teste123', perfil: 'admin', created_at: now }
  usuarios[a2] = {
    id: a2,
    nome: 'teste',
    senha: 'teste123',
    perfil: 'funcionario',
    created_at: now,
  }

  const produtos = {}
  const produtosIniciais = [
    { nome: 'Couvert', preco: 18.0, estoque: 500, imagem: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=640&q=80' },
    { nome: 'Frios', preco: 1.29, estoque: 30000, imagem: 'https://images.unsplash.com/photo-1514517220031-1daaf00f48c0?auto=format&fit=crop&w=640&q=80' },
    { nome: 'Sobremesa da Casa', preco: 16.0, estoque: 40, imagem: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=640&q=80' },
    { nome: 'Filé Mignon Grelhado', preco: 62.9, estoque: 35, imagem: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=640&q=80' },
    { nome: 'Risoto de Camarão', preco: 58.5, estoque: 28, imagem: 'https://images.unsplash.com/photo-1563379091339-03246963d29b?auto=format&fit=crop&w=640&q=80' },
    { nome: 'Lasanha Bolonhesa', preco: 44.9, estoque: 30, imagem: 'https://images.unsplash.com/photo-1619895092538-128341789043?auto=format&fit=crop&w=640&q=80' },
    { nome: 'Salmão ao Molho de Maracujá', preco: 69.9, estoque: 24, imagem: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=640&q=80' },
    { nome: 'Parmegiana de Frango', preco: 46.5, estoque: 32, imagem: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=640&q=80' },
    { nome: 'Suco Natural', preco: 12.0, estoque: 60, imagem: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=640&q=80' },
    { nome: 'Refrigerante Lata', preco: 8.5, estoque: 80, imagem: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&w=640&q=80' },
  ]

  for (const produto of produtosIniciais) {
    const id = gerarId()
    produtos[id] = {
      id,
      nome: produto.nome,
      preco: Number(produto.preco) || 0,
      estoque: Math.max(0, Number(produto.estoque) || 0),
      fixo: false,
      imagem: String(produto.imagem || '').trim(),
      created_at: now,
      updated_at: now,
    }
  }

  return {
    usuarios,
    produtos,
    comandas: {},
    comandasAtivas: {},
    vendas: {},
    fechamentos: {},
    caixas: {},
    caixaConfig: {
      aberto: false,
      valorInicial: 0,
      aberturaEm: null,
      caixaId: null,
      ultimaViradaCaixaEm: null,
      ultimaViradaCaixaData: null,
      updated_at: now,
    },
  }
}

function migrarUsuariosLegado(s) {
  if (!s?.usuarios) return
  for (const u of Object.values(s.usuarios)) {
    const nome = String(u.nome || '').toLowerCase()
    if (nome === 'admin' && String(u.senha) === 'admin123') {
      u.nome = 'gestor'
      u.senha = 'teste123'
    } else if (nome === 'funcionario' && String(u.senha) === 'func123') {
      u.nome = 'teste'
      u.senha = 'teste123'
    }
  }
}

function migrateDemoState(s) {
  migrarUsuariosLegado(s)
  if (!s?.produtos) return
  const precos = {
    [normalizarNomeProduto('Couvert')]: 18,
    [normalizarNomeProduto('Frios')]: 1.29,
    [normalizarNomeProduto('Sobremesa da Casa')]: 16,
  }
  Object.values(s.produtos).forEach((p) => {
    p.fixo = false
    const ch = normalizarNomeProduto(p.nome)
    if ((!Number(p.preco) || Number(p.preco) <= 0) && precos[ch] != null) {
      p.preco = precos[ch]
    }
  })
  const normalizarItensLegado = (itens) => {
    for (const it of itens || []) {
      if (it.unidadeMedida === 'gramas') continue
      if (it.valorManualTotal === true || it.unidadeMedida === 'valor_total') {
        it.valorManualTotal = false
        if (it.unidadeMedida === 'valor_total') it.unidadeMedida = 'unidade'
        const q = Math.max(1, Number(it.quantidade) || 1)
        it.quantidade = q
        it.subtotal = Number(it.preco || 0) * q
      }
    }
  }
  Object.values(s.comandas || {}).forEach((c) => normalizarItensLegado(c.itens))
  Object.values(s.vendas || {}).forEach((v) => normalizarItensLegado(v.itens))
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultState()
    const parsed = JSON.parse(raw)
    if (!parsed?.usuarios || !parsed?.produtos) return getDefaultState()
    migrateDemoState(parsed)
    return parsed
  } catch {
    return getDefaultState()
  }
}

function saveState(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

function produtosListaOrdenada(produtosMap) {
  const rows = Object.values(produtosMap || {})
  return rows.sort((a, b) =>
    String(a?.nome || '').localeCompare(String(b?.nome || ''), 'pt-BR', { sensitivity: 'base' })
  )
}

function usuariosLista(usuariosMap) {
  return Object.values(usuariosMap || {})
    .map((u) => ({
      id: u.id,
      nome: u.nome,
      perfil: u.perfil,
      created_at: u.created_at || null,
    }))
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
}

function listarNumerosEmUso(s) {
  const usadas = new Set()
  Object.values(s.comandas).forEach((c) => {
    if (['aberta', 'aguardando_pagamento'].includes(c.status)) {
      const n = normalizarNumeroComanda(c.numero_comanda)
      if (n) usadas.add(n)
    }
  })
  return usadas
}

function getProximaComandaDisponivel(numerosEmUso) {
  for (let i = 1; i <= 100; i += 1) {
    const numero = String(i).padStart(3, '0')
    if (!numerosEmUso.has(numero)) return numero
  }
  return null
}

function liberarLock(s, numeroComanda) {
  const numero = normalizarNumeroComanda(numeroComanda)
  if (numero) delete s.comandasAtivas[numero]
}

function getCaixaStatus(s) {
  const data = s.caixaConfig || {}
  return {
    aberto: data.aberto === true,
    valorInicial: Number(data.valorInicial || 0),
    aberturaEm: data.aberturaEm || null,
    caixaId: data.caixaId || null,
    ultimaViradaCaixaEm: data.ultimaViradaCaixaEm || null,
    ultimaViradaCaixaData: data.ultimaViradaCaixaData || null,
  }
}

function precisaVirarCaixaAgora(status, agora = new Date()) {
  const horaAtual = obterHoraSp(agora)
  const hoje = formatarDataSp(agora)
  const ontem = formatarDataSp(new Date(agora.getTime() - 24 * 60 * 60 * 1000))
  const alvoVirada = horaAtual >= 23 ? hoje : ontem
  const ultimaData = String(status?.ultimaViradaCaixaData || '')
  return ultimaData !== alvoVirada
}

function obterDataAlvoVirada(agora = new Date()) {
  const horaAtual = obterHoraSp(agora)
  if (horaAtual >= 23) return formatarDataSp(agora)
  return formatarDataSp(new Date(agora.getTime() - 24 * 60 * 60 * 1000))
}

function virarCaixaAutomaticamenteSeNecessario(s) {
  let status = getCaixaStatus(s)
  if (status.aberto) return status
  if (!precisaVirarCaixaAgora(status)) return status
  const agoraIso = new Date().toISOString()
  const agora = new Date()
  s.caixaConfig = {
    ...(s.caixaConfig || {}),
    aberto: false,
    valorInicial: 0,
    aberturaEm: null,
    caixaId: null,
    ultimaViradaCaixaEm: agoraIso,
    ultimaViradaCaixaData: obterDataAlvoVirada(agora),
    updated_at: agoraIso,
  }
  Object.values(s.comandas).forEach((c) => {
    if (c.status === 'aguardando_pagamento') {
      c.status = 'aberta'
      c.enviadaEm = null
      c.updated_at = agoraIso
    }
  })
  status = getCaixaStatus(s)
  return status
}

function splitPath(fullPath = '') {
  const q = fullPath.indexOf('?')
  const pathname = q >= 0 ? fullPath.slice(0, q) : fullPath
  const search = q >= 0 ? fullPath.slice(q + 1) : ''
  return { pathname, sp: new URLSearchParams(search) }
}

function listarVendasHistorico(s) {
  return Object.values(s.vendas || {})
    .filter((v) => v?.cancelada !== true)
    .sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0))
}

function listarVendasDoCaixa(s, caixaId) {
  if (!caixaId) return []
  return Object.values(s.vendas || {})
    .filter((v) => String(v.caixaId) === String(caixaId) && v?.cancelada !== true)
    .sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0))
}

function listarSangriasCaixa(s, caixaId) {
  const caixa = s.caixas[caixaId]
  if (!caixa?.sangrias) return []
  return [...caixa.sangrias].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  )
}

function getTotalSangriasDoCaixa(s, caixaId) {
  return listarSangriasCaixa(s, caixaId).reduce((acc, r) => acc + Number(r.valor || 0), 0)
}

function throwHttp(status, message, extra = {}) {
  throw new HttpErr(status, message, extra)
}

function dispatch(s, method, fullPath, body, headers) {
  const { pathname: path, sp: query } = splitPath(fullPath)
  const virarAntesDasRotasCaixa =
    /^\/(?:caixa|dashboard|comandas\/aguardando|comandas\/abertas|vendas)/.test(path) ||
    (path === '/comandas' && method === 'GET')
  if (virarAntesDasRotasCaixa) virarCaixaAutomaticamenteSeNecessario(s)

  // ---------- Auth / usuários
  if (method === 'POST' && path === '/auth/login') {
    const { nome, senha } = body || {}
    if (!nome || !senha) throwHttp(400, 'nome e senha são obrigatórios')
    const nomeN = String(nome).trim().toLowerCase()
    const user = Object.values(s.usuarios).find(
      (u) => String(u.nome || '').toLowerCase() === nomeN && String(u.senha) === String(senha)
    )
    if (!user) throwHttp(401, 'Usuário ou senha inválidos')
    return { id: user.id, nome: user.nome, perfil: user.perfil }
  }

  if (method === 'GET' && path === '/usuarios') {
    return usuariosLista(s.usuarios)
  }

  if (method === 'POST' && path === '/usuarios') {
    const { nome, senha, perfil } = body || {}
    if (!nome || !senha) throwHttp(400, 'nome e senha são obrigatórios')
    const nomeNorm = String(nome).trim()
    const existe = Object.values(s.usuarios).some((u) => String(u.nome) === nomeNorm)
    if (existe) throwHttp(409, 'Usuário já existe')
    const perfilN = perfil === 'admin' ? 'admin' : 'funcionario'
    const id = gerarId()
    const created_at = new Date().toISOString()
    s.usuarios[id] = {
      id,
      nome: nomeNorm,
      senha: String(senha),
      perfil: perfilN,
      created_at,
    }
    return { id, nome: nomeNorm, perfil: perfilN }
  }

  // ---------- Produtos
  if (method === 'GET' && path === '/produtos') {
    return produtosListaOrdenada(s.produtos)
  }

  if (method === 'POST' && path === '/produtos') {
    const { nome, preco = 0, estoque = 0, imagem = '' } = body || {}
    if (!nome) throwHttp(400, 'nome é obrigatório')
    const nomeFinal = String(nome).trim()
    const precoNum = Number(preco) || 0
    if (precoNum <= 0) throwHttp(400, 'preço é obrigatório e deve ser maior que zero')
    const id = gerarId()
    const created_at = new Date().toISOString()
    s.produtos[id] = {
      id,
      nome: nomeFinal,
      preco: precoNum,
      estoque: Math.max(0, Number(estoque) || 0),
      fixo: false,
      imagem: String(imagem || '').trim(),
      created_at,
    }
    return s.produtos[id]
  }

  let m = path.match(/^\/produtos\/([^/]+)$/)
  if (m && method === 'PUT') {
    const id = m[1]
    const { nome, preco, estoque, imagem } = body || {}
    const atual = s.produtos[id]
    if (!atual) throwHttp(404, 'Produto não encontrado')
    const nomeAtual = String(atual.nome || '').trim()
    const nomeNovo = nome !== undefined ? String(nome).trim() : nomeAtual
    const precoAtualizado =
      preco !== undefined ? Number(preco) || 0 : Number(atual.preco || 0)
    if (precoAtualizado <= 0) throwHttp(400, 'preço deve ser maior que zero')
    const updated = {
      ...atual,
      nome: nomeNovo,
      preco: precoAtualizado,
      estoque:
        estoque !== undefined
          ? Math.max(0, Number(estoque) || 0)
          : Math.max(0, Number(atual.estoque || 0)),
      imagem: imagem !== undefined ? String(imagem || '').trim() : String(atual.imagem || '').trim(),
      fixo: false,
      updated_at: new Date().toISOString(),
    }
    s.produtos[id] = updated
    return updated
  }

  m = path.match(/^\/produtos\/([^/]+)\/estoque$/)
  if (m && method === 'PATCH') {
    const id = m[1]
    const { operacao = 'set', quantidade = 0 } = body || {}
    const atual = s.produtos[id]
    if (!atual) throwHttp(404, 'Produto não encontrado')
    const estoqueAtual = Number(atual.estoque || 0)
    const qtd = Number(quantidade) || 0
    let novo = estoqueAtual
    if (operacao === 'incrementar') novo = estoqueAtual + Math.max(0, qtd)
    else if (operacao === 'decrementar') novo = estoqueAtual - Math.max(0, qtd)
    else novo = Math.max(0, qtd)
    if (novo < 0) throwHttp(400, 'Estoque insuficiente')
    atual.estoque = novo
    atual.updated_at = new Date().toISOString()
    return atual
  }

  m = path.match(/^\/produtos\/([^/]+)$/)
  if (m && method === 'DELETE') {
    const id = m[1]
    const atual = s.produtos[id]
    if (!atual) throwHttp(404, 'Produto não encontrado')
    delete s.produtos[id]
    return null
  }

  if (method === 'PATCH' && path === '/estoque/limpar-nao-fixos') {
    const operadorIdRaw = body?.operadorId || query.get('operadorId') || headers?.['x-operador-id']
    const operadorIdNorm = String(operadorIdRaw || '').trim()
    if (!operadorIdNorm) throwHttp(400, 'operadorId é obrigatório')
    const op = s.usuarios[operadorIdNorm]
    if (!op) throwHttp(403, 'Operador inválido')
    if (String(op.perfil || '') !== 'admin') throwHttp(403, 'Apenas admin pode limpar o estoque')
    let n = 0
    const agora = new Date().toISOString()
    Object.values(s.produtos).forEach((p) => {
      p.estoque = 0
      p.updated_at = agora
      n += 1
    })
    return { sucesso: true, atualizados: n }
  }

  // ---------- Comandas
  if (method === 'GET' && path === '/comandas') {
    return Object.values(s.comandas)
      .filter((c) => c.status === 'aberta')
      .map((comanda) => ({
        ...comanda,
        itens: comanda.itens || [],
        total: Number(comanda.total || 0),
      }))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
  }

  if (method === 'GET' && path === '/comandas/aguardando-pagamento') {
    return Object.values(s.comandas)
      .filter((c) => c.status === 'aguardando_pagamento')
      .map((comanda) => ({
        ...comanda,
        itens: comanda.itens || [],
        total: Number(comanda.total || 0),
      }))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
  }

  if (method === 'DELETE' && path.startsWith('/comandas/abertas')) {
    const operadorIdNorm = String(
      body?.operadorId || query.get('operadorId') || headers?.['x-operador-id'] || ''
    ).trim()
    if (!operadorIdNorm) throwHttp(400, 'operadorId é obrigatório')
    const op = s.usuarios[operadorIdNorm]
    if (!op) throwHttp(403, 'Operador inválido')
    if (String(op.perfil || '') !== 'admin') throwHttp(403, 'Apenas admin pode excluir mesas abertas')
    let rem = 0
    Object.entries(s.comandas).forEach(([id, c]) => {
      if (c.status === 'aberta') {
        liberarLock(s, c.numero_comanda)
        delete s.comandas[id]
        rem += 1
      }
    })
    return { sucesso: true, removidas: rem }
  }

  if (method === 'POST' && path === '/comandas') {
    const payload = body || {}
    const numeroBruto =
      payload.numeroMesa ?? payload.numeroComanda ?? payload.numero ?? payload.comanda ?? payload.mesa ?? payload.nome ?? payload.cliente
    const numero = numeroBruto != null ? String(numeroBruto).trim() : ''
    if (!numero) throwHttp(400, 'numeroMesa é obrigatório')
    const numeroFmt = normalizarNumeroComanda(numero)
    if (!numeroFmt) throwHttp(400, 'numeroMesa deve estar entre 1 e 100')
    const usados = listarNumerosEmUso(s)
    if (usados.has(numeroFmt)) {
      const prox = getProximaComandaDisponivel(usados)
      const mensagemBase = `Mesa ${numeroFmt} já está em uso`
      throwHttp(
        409,
        prox ? `${mensagemBase}. Use a próxima disponível: ${prox}.` : `${mensagemBase}. Não há mesas disponíveis no momento.`,
        { proximaDisponivel: prox }
      )
    }
    if (s.comandasAtivas[numeroFmt]) {
      const prox = getProximaComandaDisponivel(usados)
      throwHttp(
        409,
        prox
          ? `Mesa ${numeroFmt} já está em uso. Use a próxima disponível: ${prox}.`
          : `Mesa ${numeroFmt} já está em uso. Não há mesas disponíveis no momento.`,
        { proximaDisponivel: prox }
      )
    }
    const id = gerarId()
    const now = new Date().toISOString()
    const identificacao = `Mesa ${numeroFmt}`
    const nova = {
      id,
      numero_comanda: numeroFmt,
      cliente: null,
      identificacao,
      status: 'aberta',
      total: 0,
      itens: [],
      created_at: now,
      updated_at: now,
    }
    s.comandas[id] = nova
    s.comandasAtivas[numeroFmt] = id
    return nova
  }

  m = path.match(/^\/comandas\/([^/]+)\/itens$/)
  if (m && method === 'POST') {
    const comandaId = m[1]
    const comanda = s.comandas[comandaId]
    if (!comanda || !['aberta', 'aguardando_pagamento'].includes(comanda.status)) {
      throwHttp(404, 'Mesa não encontrada ou fechada')
    }
    const { produtoId, quantidade = 1, pesoGramas, tipoFrio } = body || {}
    const produto = s.produtos[String(produtoId)]
    if (!produto) throwHttp(404, 'Produto não encontrado')
    const isFrios = produtoEhFrios(produto)
    const qtd = Math.max(1, Number(quantidade) || 1)
    const pesoNum = Math.max(1, Number(pesoGramas) || 0)
    const tipoFrioFinal = String(tipoFrio || '').trim()
    const precoBase = Number(produto.preco || 0)
    if (!Number.isFinite(precoBase) || precoBase <= 0) {
      throwHttp(400, 'Produto sem preço válido no cardápio')
    }
    const estoqueNecessario = isFrios ? pesoNum : qtd
    if (isFrios && !tipoFrioFinal) throwHttp(400, 'tipoFrio é obrigatório para produto Frios')
    if (estoqueDisponivelParaVenda(produto) < estoqueNecessario) throwHttp(400, 'Estoque insuficiente')
    const subtotal = isFrios ? precoBase * (pesoNum / 100) : precoBase * qtd
    const item = {
      id: gerarId(),
      produto_id: produto.id,
      produtoId: produto.id,
      nome: isFrios ? `${produto.nome} - ${tipoFrioFinal}` : produto.nome,
      imagem: String(produto.imagem || ''),
      preco: precoBase,
      quantidade: isFrios ? 1 : qtd,
      unidadeMedida: isFrios ? 'gramas' : 'unidade',
      pesoGramas: isFrios ? pesoNum : null,
      tipoFrio: isFrios ? tipoFrioFinal : null,
      valorManualTotal: false,
      subtotal,
      created_at: new Date().toISOString(),
    }
    const itens = [...(comanda.itens || []), item]
    Object.assign(comanda, {
      itens,
      total: calcularTotal(itens),
      updated_at: new Date().toISOString(),
    })
    return comanda
  }

  m = path.match(/^\/comandas\/([^/]+)\/itens\/([^/]+)$/)
  if (m && method === 'PATCH') {
    const [, comandaId, itemId] = m
    const comanda = s.comandas[comandaId]
    if (!comanda) throwHttp(404, 'Mesa não encontrada')
    const { quantidade } = body || {}
    const qtd = Math.max(0, Number(quantidade) || 0)
    const itens = [...(comanda.itens || [])]
    const idx = itens.findIndex((i) => String(i.id) === String(itemId))
    if (idx < 0) throwHttp(404, 'Item não encontrado')
    if (qtd < 1) itens.splice(idx, 1)
    else {
      const item = itens[idx]
      if (item.unidadeMedida === 'gramas') {
        throwHttp(400, 'Itens por peso: remova e adicione novamente para alterar o peso')
      }
      if (item.unidadeMedida === 'valor_total') {
        throwHttp(400, 'Este item não permite alterar quantidade')
      }
      itens[idx] = {
        ...item,
        quantidade: qtd,
        subtotal: Number(item.preco || 0) * qtd,
      }
    }
    comanda.itens = itens
    comanda.total = calcularTotal(itens)
    comanda.updated_at = new Date().toISOString()
    return comanda
  }

  if (m && method === 'DELETE') {
    const [, comandaId, itemId] = m
    const comanda = s.comandas[comandaId]
    if (!comanda) throwHttp(404, 'Mesa não encontrada')
    comanda.itens = (comanda.itens || []).filter((i) => String(i.id) !== String(itemId))
    comanda.total = calcularTotal(comanda.itens)
    comanda.updated_at = new Date().toISOString()
    return comanda
  }

  m = path.match(/^\/comandas\/([^/]+)\/enviar-caixa$/)
  if (m && method === 'POST') {
    const comanda = s.comandas[m[1]]
    if (!comanda) throwHttp(404, 'Mesa não encontrada')
    if (comanda.status !== 'aberta') throwHttp(400, 'Mesa não está aberta')
    comanda.status = 'aguardando_pagamento'
    comanda.enviadaEm = new Date().toISOString()
    comanda.updated_at = new Date().toISOString()
    return comanda
  }

  m = path.match(/^\/comandas\/([^/]+)\/confirmar-pagamento$/)
  if (m && method === 'POST') {
    const { metodoPagamento, valorRecebido, troco } = body || {}
    const comanda = s.comandas[m[1]]
    if (!comanda) throwHttp(404, 'Mesa não encontrada')
    if (comanda.status !== 'aguardando_pagamento') {
      throwHttp(400, 'Mesa não está aguardando pagamento')
    }
    for (const item of comanda.itens || []) {
      const pid = item.produtoId || item.produto_id
      const produto = s.produtos[String(pid)]
      if (!produto) throwHttp(404, `Produto ${pid} não encontrado`)
      const qtdNec =
        item.unidadeMedida === 'gramas' ? Number(item.pesoGramas || 0) : Number(item.quantidade || 0)
      if (estoqueDisponivelParaVenda(produto) < qtdNec) {
        throwHttp(400, 'Estoque insuficiente para confirmar pagamento')
      }
    }
    for (const item of comanda.itens || []) {
      const pid = item.produtoId || item.produto_id
      const produto = s.produtos[String(pid)]
      if (produto) {
        const qtdNec =
          item.unidadeMedida === 'gramas' ? Number(item.pesoGramas || 0) : Number(item.quantidade || 0)
        produto.estoque = Math.max(0, Number(produto.estoque || 0) - qtdNec)
        produto.updated_at = new Date().toISOString()
      }
    }
    const caixaAtual = getCaixaStatus(s)
    const vendaId = gerarId()
    const venda = {
      id: vendaId,
      comandaId: comanda.id,
      caixaId: caixaAtual.aberto ? caixaAtual.caixaId || null : null,
      identificacao: comanda.identificacao,
      itens: [...(comanda.itens || [])],
      total: Number(comanda.total || 0),
      metodoPagamento: metodoPagamento || 'Dinheiro',
      valorRecebido: Number(valorRecebido) || 0,
      troco: Number(troco) || 0,
      data: new Date().toISOString(),
      cancelada: false,
    }
    s.vendas[vendaId] = venda
    comanda.status = 'fechada'
    comanda.itens = []
    comanda.total = 0
    comanda.enviadaEm = null
    comanda.fechamentoEm = new Date().toISOString()
    comanda.updated_at = new Date().toISOString()
    liberarLock(s, comanda.numero_comanda)
    return venda
  }

  // ---------- Caixa
  if (method === 'GET' && path === '/caixa/historico') {
    return listarVendasHistorico(s)
  }

  if (method === 'GET' && path === '/caixa/status') {
    return getCaixaStatus(s)
  }

  if (method === 'GET' && path === '/caixa/totais-hoje') {
    const caixaAtual = getCaixaStatus(s)
    let vendasBase
    if (caixaAtual.aberto && caixaAtual.caixaId) {
      vendasBase = listarVendasDoCaixa(s, caixaAtual.caixaId)
    } else {
      vendasBase = listarVendasHistorico(s).filter((v) => {
        if (!caixaAtual.ultimaViradaCaixaEm) return isHoje(v.data)
        return new Date(v.data || 0) >= new Date(caixaAtual.ultimaViradaCaixaEm)
      })
    }
    const totais = somarTotais(vendasBase)
    const totalSangrias = caixaAtual.caixaId ? getTotalSangriasDoCaixa(s, caixaAtual.caixaId) : 0
    const dinheiroLiquido = Number(totais.totalDinheiro || 0) - Number(totalSangrias || 0)
    return { ...totais, totalSangrias, dinheiroLiquido, caixaId: caixaAtual.caixaId || null, vendasHoje: vendasBase }
  }

  if (method === 'POST' && path === '/caixa/abrir') {
    const { valorInicial } = body || {}
    const caixaAtual = getCaixaStatus(s)
    if (caixaAtual.aberto) throwHttp(400, 'Caixa já está aberto')
    const nowDate = new Date()
    const now = nowDate.toISOString()
    const dataViradaAtual =
      obterHoraSp(nowDate) >= 23 ? formatarDataSp(nowDate) : formatarDataSp(new Date(nowDate.getTime() - 86400000))
    const cid = gerarId()
    s.caixas[cid] = {
      id: cid,
      status: 'aberto',
      abertoEm: now,
      fechadoEm: null,
      valorInicial: Number(valorInicial) || 0,
      totalSangrias: 0,
      sangrias: [],
      created_at: now,
      updated_at: now,
    }
    s.caixaConfig = {
      aberto: true,
      valorInicial: Number(valorInicial) || 0,
      aberturaEm: now,
      caixaId: cid,
      ultimaViradaCaixaEm: now,
      ultimaViradaCaixaData: dataViradaAtual,
      updated_at: now,
    }
    return { sucesso: true, caixaId: cid }
  }

  if (method === 'POST' && path === '/caixa/fechar') {
    const { valorContado } = body || {}
    const caixaAtual = getCaixaStatus(s)
    if (!caixaAtual.aberto) throwHttp(400, 'Caixa já está fechado')
    const caixaId = caixaAtual.caixaId || null
    const vendasBase = caixaId
      ? listarVendasDoCaixa(s, caixaId)
      : listarVendasHistorico(s).filter((v) => isHoje(v.data))
    const totais = somarTotais(vendasBase)
    const totalSangrias = caixaId ? getTotalSangriasDoCaixa(s, caixaId) : 0
    const dinheiroLiquido = Number(totais.totalDinheiro || 0) - Number(totalSangrias || 0)
    const totalEsperado = Number(caixaAtual.valorInicial || 0) + dinheiroLiquido
    const valorContadoNum = Number(valorContado) || 0
    const diferenca = valorContadoNum - totalEsperado
    const fid = gerarId()
    const fechamento = {
      id: fid,
      caixaId,
      data: new Date().toISOString(),
      valorInicial: Number(caixaAtual.valorInicial || 0),
      totalDinheiro: totais.totalDinheiro,
      totalCartao: totais.totalCartao,
      totalPix: totais.totalPix,
      totalSangrias,
      dinheiroLiquido,
      valorContado: valorContadoNum,
      diferenca,
    }
    s.fechamentos[fid] = fechamento
    if (caixaId && s.caixas[caixaId]) {
      Object.assign(s.caixas[caixaId], {
        status: 'fechado',
        fechadoEm: new Date().toISOString(),
        totalDinheiro: totais.totalDinheiro,
        totalCartao: totais.totalCartao,
        totalPix: totais.totalPix,
        totalSangrias,
        dinheiroLiquido,
        diferenca,
        updated_at: new Date().toISOString(),
      })
    }
    s.caixaConfig = {
      ...(s.caixaConfig || {}),
      aberto: false,
      valorInicial: 0,
      aberturaEm: null,
      caixaId: null,
      updated_at: new Date().toISOString(),
    }
    const agora = new Date().toISOString()
    let comandasResetadas = 0
    Object.values(s.comandas).forEach((c) => {
      if (['aberta', 'aguardando_pagamento'].includes(c.status)) {
        c.status = 'aberta'
        c.itens = []
        c.total = 0
        c.enviadaEm = null
        c.updated_at = agora
        comandasResetadas += 1
      }
    })
    return { sucesso: true, fechamento, comandasResetadas, avisoComandas: null }
  }

  if (method === 'GET' && path === '/caixa/relatorios') {
    return Object.values(s.fechamentos || {}).sort(
      (a, b) => new Date(b.data || 0) - new Date(a.data || 0)
    )
  }

  if (method === 'GET' && path === '/caixa/sangrias') {
    const caixaId = String(query.get('caixaId') || '').trim()
    if (!caixaId) throwHttp(400, 'caixaId é obrigatório')
    return listarSangriasCaixa(s, caixaId)
  }

  if (method === 'GET' && path === '/caixa/sangrias/total') {
    const caixaId = String(query.get('caixaId') || '').trim()
    if (!caixaId) throwHttp(400, 'caixaId é obrigatório')
    const totalSangrias = getTotalSangriasDoCaixa(s, caixaId)
    return { caixaId, totalSangrias }
  }

  if (method === 'POST' && path === '/caixa/sangrias') {
    const { caixaId, valor, motivo, operadorId } = body || {}
    const caixaIdNorm = String(caixaId || '').trim()
    const operadorIdNorm = String(operadorId || '').trim()
    const valorNum = Number(valor) || 0

    if (!caixaIdNorm) throwHttp(400, 'caixaId é obrigatório')
    if (!operadorIdNorm) throwHttp(400, 'operadorId é obrigatório')
    if (valorNum <= 0) throwHttp(400, 'valor deve ser maior que zero')

    const op = s.usuarios[operadorIdNorm]
    if (!op) throwHttp(403, 'Operador inválido')
    if (String(op.perfil || '') !== 'admin') throwHttp(403, 'Apenas admin pode registrar sangria')

    const caixa = s.caixas[caixaIdNorm]
    if (!caixa) throwHttp(400, 'Caixa não encontrado')
    if (caixa.status !== 'aberto') throwHttp(400, 'Caixa não está aberto')

    const vendasDinheiro = Object.values(s.vendas || {}).filter(
      (v) =>
        String(v.caixaId) === caixaIdNorm &&
        String(v.metodoPagamento || '').toLowerCase().includes('dinheiro') &&
        !v.cancelada
    )
    const totalVendasDinheiro = vendasDinheiro.reduce((acc, v) => acc + Number(v.total || 0), 0)
    const listaSangrias = caixa.sangrias || []
    const totalSangriasAtual = listaSangrias.reduce((acc, row) => acc + Number(row.valor || 0), 0)
    const saldoDisponivelDinheiro = totalVendasDinheiro - totalSangriasAtual

    if (valorNum > saldoDisponivelDinheiro) {
      throwHttp(400, 'Valor da sangria maior que o saldo disponível em dinheiro')
    }

    const now = new Date().toISOString()
    const sid = gerarId()
    const motivoFinal = String(motivo || '').trim() || null
    const row = {
      id: sid,
      valor: valorNum,
      motivo: motivoFinal,
      operadorId: operadorIdNorm,
      operadorNome: op.nome || null,
      createdAt: now,
      tipo: 'sangria',
    }
    if (!caixa.sangrias) caixa.sangrias = []
    caixa.sangrias.push(row)
    const totalSangriasNovo = totalSangriasAtual + valorNum
    caixa.totalSangrias = totalSangriasNovo
    caixa.updated_at = now

    return {
      sucesso: true,
      sangria: {
        id: sid,
        caixaId: caixaIdNorm,
        valor: valorNum,
        motivo: motivoFinal,
        operadorId: operadorIdNorm,
        operadorNome: op.nome || null,
        createdAt: now,
        tipo: 'sangria',
        totalSangrias: totalSangriasNovo,
        saldoDisponivelDinheiro: saldoDisponivelDinheiro - valorNum,
        totalVendasDinheiro,
      },
    }
  }

  if (method === 'DELETE' && path === '/caixa/dados') {
    Object.keys(s.vendas || {}).forEach((k) => delete s.vendas[k])
    Object.keys(s.fechamentos || {}).forEach((k) => delete s.fechamentos[k])
    Object.keys(s.caixas || {}).forEach((k) => delete s.caixas[k])

    let comandasReabertas = 0
    Object.values(s.comandas).forEach((c) => {
      if (c.status === 'aguardando_pagamento') {
        c.status = 'aberta'
        c.enviadaEm = null
        c.updated_at = new Date().toISOString()
        comandasReabertas += 1
      }
    })

    s.caixaConfig = {
      ...(s.caixaConfig || {}),
      aberto: false,
      valorInicial: 0,
      aberturaEm: null,
      caixaId: null,
      updated_at: new Date().toISOString(),
    }
    return { sucesso: true, comandasReabertas }
  }

  let vm = path.match(/^\/vendas\/([^/]+)\/itens$/)
  if (vm && method === 'POST') {
    const vendaId = vm[1]
    const { produtoId, quantidade = 1, pesoGramas, tipoFrio } = body || {}

    const venda = s.vendas[vendaId]
    if (!venda) throwHttp(404, 'Venda não encontrada')

    const produto = s.produtos[String(produtoId)]
    if (!produto) throwHttp(404, 'Produto não encontrado')

    const isFrios = produtoEhFrios(produto)
    const qtd = Math.max(1, Number(quantidade) || 1)
    const pesoNum = Math.max(1, Number(pesoGramas) || 0)
    const tipoFrioFinal = String(tipoFrio || '').trim()
    const precoBase = Number(produto.preco || 0)
    if (!Number.isFinite(precoBase) || precoBase <= 0) {
      throwHttp(400, 'Produto sem preço válido no cardápio')
    }
    const estoqueNecessario = isFrios ? pesoNum : qtd
    if (isFrios && !tipoFrioFinal) throwHttp(400, 'tipoFrio é obrigatório para produto Frios')
    if (estoqueDisponivelParaVenda(produto) < estoqueNecessario) throwHttp(400, 'Estoque insuficiente')

    const item = {
      id: gerarId(),
      produto_id: produto.id,
      produtoId: produto.id,
      nome: isFrios ? `${produto.nome} - ${tipoFrioFinal}` : produto.nome,
      imagem: String(produto.imagem || ''),
      preco: precoBase,
      quantidade: isFrios ? 1 : qtd,
      unidadeMedida: isFrios ? 'gramas' : 'unidade',
      pesoGramas: isFrios ? pesoNum : null,
      tipoFrio: isFrios ? tipoFrioFinal : null,
      valorManualTotal: false,
      subtotal: isFrios ? precoBase * (pesoNum / 100) : precoBase * qtd,
      created_at: new Date().toISOString(),
    }

    const itens = [...(venda.itens || []), item]
    const total = calcularTotal(itens)
    const novoTroco =
      String(venda.metodoPagamento || '').toLowerCase().includes('dinheiro') && venda.valorRecebido != null
        ? Number(venda.valorRecebido || 0) - total
        : Number(venda.troco || 0)

    Object.assign(venda, {
      itens,
      total,
      troco: novoTroco,
      updated_at: new Date().toISOString(),
    })

    produto.estoque = Math.max(0, Number(produto.estoque || 0) - estoqueNecessario)
    produto.updated_at = new Date().toISOString()

    return venda
  }

  vm = path.match(/^\/vendas\/([^/]+)\/cancelar$/)
  if (vm && method === 'POST') {
    const venda = s.vendas[vm[1]]
    if (!venda) throwHttp(404, 'Venda não encontrada')
    if (venda.cancelada === true) throwHttp(400, 'Venda já cancelada')

    for (const item of venda.itens || []) {
      const pid = item.produtoId || item.produto_id
      const produto = s.produtos[String(pid)]
      if (!produto) continue
      const dev =
        item.unidadeMedida === 'gramas'
          ? Number(item.pesoGramas || 0)
          : Number(item.quantidade || 0)
      produto.estoque = Math.max(0, Number(produto.estoque || 0) + Math.max(0, dev))
      produto.updated_at = new Date().toISOString()
    }
    Object.assign(venda, {
      cancelada: true,
      canceladaEm: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    return { sucesso: true, venda }
  }

  if (method === 'GET' && path === '/dashboard/resumo') {
    const produtosSnap = Object.values(s.produtos || {})
    const comandasAbertas = Object.values(s.comandas).filter((c) => c.status === 'aberta').length
    const comandasAguardando = Object.values(s.comandas).filter(
      (c) => c.status === 'aguardando_pagamento'
    ).length
    const todasVendas = listarVendasHistorico(s)
    const caixaAtual = getCaixaStatus(s)
    const vendasHoje = caixaAtual.ultimaViradaCaixaEm
      ? todasVendas.filter((v) => new Date(v.data || 0) >= new Date(caixaAtual.ultimaViradaCaixaEm))
      : todasVendas.filter((v) => isHoje(v.data))
    const totaisHoje = somarTotais(vendasHoje)
    const totalHistorico = todasVendas.reduce((acc, v) => acc + Number(v.total || 0), 0)
    const totalSangrias = caixaAtual.caixaId ? getTotalSangriasDoCaixa(s, caixaAtual.caixaId) : 0
    const dinheiroLiquido = Number(totaisHoje.totalDinheiro || 0) - Number(totalSangrias || 0)

    const produtosEstoqueBaixo = produtosSnap
      .filter((p) => Number(p.estoque || 0) < 5)
      .sort((a, b) => Number(a.estoque || 0) - Number(b.estoque || 0))

    return {
      totalHoje: totaisHoje.totalHoje,
      totalDinheiro: totaisHoje.totalDinheiro,
      totalCartao: totaisHoje.totalCartao,
      totalPix: totaisHoje.totalPix,
      totalSangrias,
      dinheiroLiquido,
      comandasAbertas,
      comandasAguardandoPagamento: comandasAguardando,
      vendasFinalizadasHoje: vendasHoje.length,
      totalHistorico,
      totalVendas: todasVendas.length,
      caixaAberto: caixaAtual.aberto,
      estoqueBaixo: produtosEstoqueBaixo.length,
      produtosEstoqueBaixo: produtosEstoqueBaixo.map((p) => ({
        id: p.id,
        nome: p.nome,
        estoque: Number(p.estoque || 0),
      })),
    }
  }

  if (method === 'GET' && path === '/health') {
    return { status: 'ok', database: 'demo-local' }
  }

  throwHttp(500, `Rota demo não implementada: ${method} ${path}`)
}

export function isDemoBackendEnabled() {
  const explicitFalse = String(import.meta.env.VITE_DEMO_MODE || '').toLowerCase() === 'false'
  if (explicitFalse) return false
  const explicitTrue = String(import.meta.env.VITE_DEMO_MODE || '').toLowerCase() === 'true'
  if (explicitTrue) return true
  return !String(import.meta.env.VITE_API_URL || '').trim()
}

export async function demoApiRequest(path, { method = 'GET', body, headers } = {}) {
  const state = loadState()
  try {
    const payload = dispatch(state, method, path, body, headers || {})
    saveState(state)
    return payload
  } catch (err) {
    saveState(state)
    if (err instanceof HttpErr) {
      const e = new Error(err.message)
      e.status = err.status
      e.extra = err.extra
      throw e
    }
    throw err
  }
}
