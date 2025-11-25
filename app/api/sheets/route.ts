import { NextRequest, NextResponse } from 'next/server'

const SPREADSHEET_ID = '1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ'
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY || ''

// Função auxiliar para normalizar CPF
function normalizeCPF(value: string): string {
  return String(value || '').replace(/\D/g, '')
}

// Função auxiliar para buscar dados de uma aba
async function getSheetData(sheetName: string, range?: string) {
  const rangeParam = range || 'A:Z'
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}!${rangeParam}?key=${API_KEY}`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Erro ao buscar dados: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.values || []
}

// Função auxiliar para escrever dados em uma aba
// NOTA: Para escrita, é necessário usar OAuth 2.0 ou Service Account
// Por enquanto, vamos tentar com API Key (pode não funcionar se a planilha não estiver pública)
async function appendRow(sheetName: string, values: any[]) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}!A:Z:append?valueInputOption=RAW&key=${API_KEY}`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [values]
    })
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`Erro ao escrever dados: ${errorData.error?.message || response.statusText}. Para escrita, é necessário configurar Service Account ou OAuth 2.0.`)
  }
  
  return await response.json()
}

// Função auxiliar para atualizar uma célula
async function updateCell(sheetName: string, range: string, value: any) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}!${range}?valueInputOption=RAW&key=${API_KEY}`
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [[value]]
    })
  })
  
  if (!response.ok) {
    throw new Error(`Erro ao atualizar célula: ${response.statusText}`)
  }
  
  return await response.json()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'GOOGLE_SHEETS_API_KEY não configurada' },
        { status: 500 }
      )
    }

    // Buscar pautas disponíveis
    if (action === 'getPautas') {
      const pautasData = await getSheetData('pautas')
      const headers = pautasData[0] || []
      const pautas = []
      
      for (let i = 1; i < pautasData.length; i++) {
        const row = pautasData[i]
        if (row && row.length > 0 && row[headers.indexOf('Status')] === 'Votação Liberada') {
          const opcoesStr = row[headers.indexOf('Opções')] || ''
          pautas.push({
            nomePauta: row[headers.indexOf('Nome da Pauta')] || '',
            descricao: row[headers.indexOf('Descrição')] || '',
            opcoes: opcoesStr.split(',').map((o: string) => o.trim()).filter((o: string) => o),
            status: row[headers.indexOf('Status')] || '',
            aba: row[headers.indexOf('Nome da Aba')] || ''
          })
        }
      }
      
      return NextResponse.json(pautas)
    }

    // Buscar todas as pautas (admin)
    if (action === 'getAllPautas') {
      const pautasData = await getSheetData('pautas')
      const headers = pautasData[0] || []
      const pautas = []
      
      for (let i = 1; i < pautasData.length; i++) {
        const row = pautasData[i]
        if (row && row.length > 0) {
          const opcoesStr = row[headers.indexOf('Opções')] || ''
          pautas.push({
            nomePauta: row[headers.indexOf('Nome da Pauta')] || '',
            descricao: row[headers.indexOf('Descrição')] || '',
            opcoes: opcoesStr.split(',').map((o: string) => o.trim()).filter((o: string) => o),
            status: row[headers.indexOf('Status')] || '',
            aba: row[headers.indexOf('Nome da Aba')] || ''
          })
        }
      }
      
      return NextResponse.json(pautas)
    }

    // Buscar pauta por aba
    if (action === 'getPautaByAba') {
      const aba = searchParams.get('aba')
      if (!aba) {
        return NextResponse.json({ error: 'Aba não especificada' }, { status: 400 })
      }
      
      const pautasData = await getSheetData('pautas')
      const headers = pautasData[0] || []
      
      for (let i = 1; i < pautasData.length; i++) {
        const row = pautasData[i]
        if (row && row[headers.indexOf('Nome da Aba')] === aba) {
          const opcoesStr = row[headers.indexOf('Opções')] || ''
          return NextResponse.json({
            nomePauta: row[headers.indexOf('Nome da Pauta')] || '',
            descricao: row[headers.indexOf('Descrição')] || '',
            opcoes: opcoesStr.split(',').map((o: string) => o.trim()).filter((o: string) => o),
            status: row[headers.indexOf('Status')] || '',
            aba: row[headers.indexOf('Nome da Aba')] || ''
          })
        }
      }
      
      return NextResponse.json({ error: 'Pauta não encontrada' }, { status: 404 })
    }

    // Buscar configuração de votação
    if (action === 'getVotingConfig') {
      const tipo = searchParams.get('tipo')
      if (!tipo) {
        return NextResponse.json({ error: 'Tipo não especificado' }, { status: 400 })
      }
      
      const pauta = await fetch(`${request.nextUrl.origin}/api/sheets?action=getPautaByAba&aba=${tipo}`)
      const pautaData = await pauta.json()
      
      return NextResponse.json({
        titulo: pautaData.nomePauta || '',
        descricao: pautaData.descricao || '',
        candidatos: pautaData.opcoes || []
      })
    }

    // Buscar status do eleitor
    if (action === 'getVoterStatus') {
      const cpf = searchParams.get('cpf')
      const tipo = searchParams.get('tipo')
      
      if (!cpf || !tipo) {
        return NextResponse.json({ error: 'CPF ou tipo não especificado' }, { status: 400 })
      }

      // Buscar morador
      const moradoresData = await getSheetData('moradores')
      const normalizedCPF = normalizeCPF(cpf)
      let voter = null
      
      for (let i = 1; i < moradoresData.length; i++) {
        const row = moradoresData[i]
        if (row && normalizeCPF(row[0] || '') === normalizedCPF) {
          voter = {
            cpf: normalizedCPF,
            nome: row[1] || '',
            apartamento: row[2] || '',
            torre: row[3] || ''
          }
          break
        }
      }
      
      if (!voter) {
        return NextResponse.json({ error: 'CPF não encontrado' }, { status: 404 })
      }

      // Verificar se já votou
      try {
        const votacaoData = await getSheetData(tipo)
        let votou = false
        let voto = ''
        
        for (let i = 1; i < votacaoData.length; i++) {
          const row = votacaoData[i]
          if (row && normalizeCPF(row[0] || '') === normalizedCPF) {
            if (row[4]) { // Coluna E (índice 4)
              votou = true
              voto = row[4]
              break
            }
          }
        }
        
        return NextResponse.json({
          ...voter,
          votou,
          voto
        })
      } catch (e) {
        // Se a aba não existe, o eleitor ainda não votou
        return NextResponse.json({
          ...voter,
          votou: false,
          voto: ''
        })
      }
    }

    // Buscar placar
    if (action === 'getScores') {
      const tipo = searchParams.get('tipo')
      if (!tipo) {
        return NextResponse.json({ error: 'Tipo não especificado' }, { status: 400 })
      }
      
      try {
        const votacaoData = await getSheetData(tipo)
        const counts: Record<string, number> = {}
        let total = 0
        
        for (let i = 1; i < votacaoData.length; i++) {
          const row = votacaoData[i]
          if (row && row[4]) { // Coluna E (índice 4) tem o voto
            const voto = String(row[4]).trim()
            if (voto) {
              counts[voto] = (counts[voto] || 0) + 1
              total++
            }
          }
        }
        
        return NextResponse.json({ counts, total })
      } catch (e) {
        return NextResponse.json({ counts: {}, total: 0 })
      }
    }

    // Buscar todos os moradores
    if (action === 'getAllMoradores') {
      const moradoresData = await getSheetData('moradores')
      const moradores = []
      
      for (let i = 1; i < moradoresData.length; i++) {
        const row = moradoresData[i]
        if (row && row.length > 0) {
          moradores.push({
            cpf: row[0] || '',
            nome: row[1] || '',
            apartamento: row[2] || '',
            torre: row[3] || ''
          })
        }
      }
      
      return NextResponse.json(moradores)
    }

    // Buscar todos os votos de uma aba
    if (action === 'getAllVotesByAba') {
      const abaNome = searchParams.get('abaNome')
      if (!abaNome) {
        return NextResponse.json({ error: 'Aba não especificada' }, { status: 400 })
      }
      
      try {
        const votacaoData = await getSheetData(abaNome)
        const votes = []
        
        for (let i = 1; i < votacaoData.length; i++) {
          const row = votacaoData[i]
          if (row && row.length > 0) {
            votes.push({
              cpf: row[0] || '',
              nome: row[1] || '',
              apartamento: row[2] || '',
              torre: row[3] || '',
              voto: row[4] || '',
              timestamp: row[5] || ''
            })
          }
        }
        
        return NextResponse.json(votes)
      } catch (e) {
        return NextResponse.json([])
      }
    }

    // Autenticação admin
    if (action === 'authenticateAdmin') {
      const cpf = searchParams.get('cpf')
      const senha = searchParams.get('senha')
      
      if (!cpf || !senha) {
        return NextResponse.json({ error: 'CPF ou senha não especificado' }, { status: 400 })
      }

      const adminData = await getSheetData('administrador')
      const normalizedCPF = normalizeCPF(cpf)
      
      for (let i = 1; i < adminData.length; i++) {
        const row = adminData[i]
        if (row && normalizeCPF(row[0] || '') === normalizedCPF && row[1] === senha) {
          return NextResponse.json({
            success: true,
            nome: row[2] || 'Administrador'
          })
        }
      }
      
      return NextResponse.json({ success: false, error: 'Credenciais inválidas' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 })
  } catch (error: any) {
    console.error('Erro na API:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'GOOGLE_SHEETS_API_KEY não configurada' },
        { status: 500 }
      )
    }

    // Salvar voto
    if (action === 'saveVote') {
      const { cpf, voto, tipo } = body
      
      if (!cpf || !voto || !tipo) {
        return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
      }

      // Buscar dados do morador
      const moradoresData = await getSheetData('moradores')
      const normalizedCPF = normalizeCPF(cpf)
      let voter = null
      
      for (let i = 1; i < moradoresData.length; i++) {
        const row = moradoresData[i]
        if (row && normalizeCPF(row[0] || '') === normalizedCPF) {
          voter = {
            cpf: normalizedCPF,
            nome: row[1] || '',
            apartamento: row[2] || '',
            torre: row[3] || ''
          }
          break
        }
      }
      
      if (!voter) {
        return NextResponse.json({ error: 'CPF não encontrado' }, { status: 404 })
      }

      // Verificar se já votou
      try {
        const votacaoData = await getSheetData(tipo)
        for (let i = 1; i < votacaoData.length; i++) {
          const row = votacaoData[i]
          if (row && normalizeCPF(row[0] || '') === normalizedCPF && row[4]) {
            return NextResponse.json({ error: 'Você já votou nesta pauta' }, { status: 400 })
          }
        }
      } catch (e) {
        // Aba não existe ainda, pode criar
      }

      // Adicionar voto
      const timestamp = new Date().toLocaleString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })
      
      await appendRow(tipo, [
        voter.cpf,
        voter.nome,
        voter.apartamento,
        voter.torre,
        voto,
        timestamp
      ])
      
      return NextResponse.json({ success: true })
    }

    // Autenticação admin (POST)
    if (action === 'authenticateAdmin') {
      const { cpf, senha } = body
      
      if (!cpf || !senha) {
        return NextResponse.json({ error: 'CPF ou senha não especificado' }, { status: 400 })
      }

      const adminData = await getSheetData('administrador')
      const normalizedCPF = normalizeCPF(cpf)
      
      for (let i = 1; i < adminData.length; i++) {
        const row = adminData[i]
        if (row && normalizeCPF(row[0] || '') === normalizedCPF && row[1] === senha) {
          return NextResponse.json({
            success: true,
            nome: row[2] || 'Administrador'
          })
        }
      }
      
      return NextResponse.json({ success: false, error: 'Credenciais inválidas' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 })
  } catch (error: any) {
    console.error('Erro na API:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

