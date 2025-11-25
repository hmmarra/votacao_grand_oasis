// API base URL - usa as rotas do Next.js que fazem proxy para Google Sheets API
const API_BASE_URL = typeof window !== 'undefined' ? '/api/sheets' : 'http://localhost:3000/api/sheets'

export interface Pauta {
  nomePauta: string
  descricao: string
  opcoes: string[]
  status: string
  aba: string
}

export interface VotingConfig {
  titulo: string
  descricao: string
  candidatos: string[]
}

export interface VoterStatus {
  cpf?: string
  nome: string
  apartamento: string
  torre: string
  votou: boolean
  voto: string | null
}

export interface Placar {
  counts: Record<string, number>
  total: number
}

export interface AdminData {
  success: boolean
  nome: string
}

export interface Morador {
  cpf: string
  nome: string
  apartamento: string
  torre: string
}

export const api = {
  // Pautas
  getPautas: async (): Promise<Pauta[]> => {
    const response = await fetch(`${API_BASE_URL}?action=getPautas`)
    if (!response.ok) throw new Error('Erro ao buscar pautas')
    return await response.json()
  },

  // Votação
  getVotingConfig: async (tipo: string): Promise<VotingConfig> => {
    const response = await fetch(`${API_BASE_URL}?action=getVotingConfig&tipo=${encodeURIComponent(tipo)}`)
    if (!response.ok) throw new Error('Erro ao buscar configuração')
    return await response.json()
  },

  getVoterStatus: async (cpf: string, tipo: string): Promise<VoterStatus> => {
    const response = await fetch(`${API_BASE_URL}?action=getVoterStatus&cpf=${encodeURIComponent(cpf)}&tipo=${encodeURIComponent(tipo)}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao buscar status do eleitor')
    }
    return await response.json()
  },

  saveVote: async (cpf: string, voto: string, tipo: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveVote', cpf, voto, tipo })
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao salvar voto')
    }
  },

  getScores: async (tipo: string): Promise<Placar> => {
    const response = await fetch(`${API_BASE_URL}?action=getScores&tipo=${encodeURIComponent(tipo)}`)
    if (!response.ok) throw new Error('Erro ao buscar placar')
    return await response.json()
  },

  // Admin
  authenticateAdmin: async (cpf: string, senha: string): Promise<AdminData> => {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'authenticateAdmin', cpf, senha })
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro na autenticação')
    }
    return await response.json()
  },

  getAllPautas: async (): Promise<Pauta[]> => {
    const response = await fetch(`${API_BASE_URL}?action=getAllPautas`)
    if (!response.ok) throw new Error('Erro ao buscar pautas')
    return await response.json()
  },

  getPautaByAba: async (aba: string): Promise<Pauta> => {
    const response = await fetch(`${API_BASE_URL}?action=getPautaByAba&aba=${encodeURIComponent(aba)}`)
    if (!response.ok) throw new Error('Erro ao buscar pauta')
    return await response.json()
  },

  savePauta: async (pautaData: Partial<Pauta>): Promise<void> => {
    // TODO: Implementar quando necessário
    throw new Error('Funcionalidade ainda não implementada')
  },

  deletePauta: async (rowIndex: number): Promise<void> => {
    // TODO: Implementar quando necessário
    throw new Error('Funcionalidade ainda não implementada')
  },

  updatePautaStatus: async (rowIndex: number, novoStatus: string): Promise<void> => {
    // TODO: Implementar quando necessário
    throw new Error('Funcionalidade ainda não implementada')
  },

  // Moradores
  getAllMoradores: async (): Promise<Morador[]> => {
    const response = await fetch(`${API_BASE_URL}?action=getAllMoradores`)
    if (!response.ok) throw new Error('Erro ao buscar moradores')
    return await response.json()
  },

  createMorador: async (moradorData: { cpf: string; nome: string; apartamento: string; torre: string }): Promise<void> => {
    // TODO: Implementar quando necessário para Google Sheets
    throw new Error('Cadastro manual de moradores disponível apenas com Firebase')
  },

  updateMorador: async (id: string, moradorData: { cpf: string; nome: string; apartamento: string; torre: string }): Promise<void> => {
    // TODO: Implementar quando necessário para Google Sheets
    throw new Error('Edição manual de moradores disponível apenas com Firebase')
  },

  deleteMorador: async (rowIndex: number): Promise<void> => {
    // TODO: Implementar quando necessário
    throw new Error('Funcionalidade ainda não implementada')
  },

  processExcelUpload: async (base64Data: string, fileName: string): Promise<{ inserted: number; updated: number; total: number }> => {
    // TODO: Implementar quando necessário
    throw new Error('Funcionalidade ainda não implementada')
  },

  // Export
  exportPautaToExcel: async (abaNome: string): Promise<string> => {
    // TODO: Implementar quando necessário
    throw new Error('Funcionalidade ainda não implementada')
  },

  // Votes
  getAllVotesByAba: async (abaNome: string): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}?action=getAllVotesByAba&abaNome=${encodeURIComponent(abaNome)}`)
    if (!response.ok) throw new Error('Erro ao buscar votos')
    return await response.json()
  }
}

