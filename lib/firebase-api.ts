import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  Timestamp,
  serverTimestamp,
  type Firestore
} from 'firebase/firestore'
import { db } from './firebase'

// Função auxiliar para normalizar CPF
function normalizeCPF(value: string): string {
  return String(value || '').replace(/\D/g, '')
}

// Função auxiliar para verificar se db está inicializado
function ensureDb(): Firestore {
  if (!db) {
    throw new Error('Firebase não inicializado. Verifique as variáveis de ambiente NEXT_PUBLIC_FIREBASE_*')
  }
  return db
}

export interface Pauta {
  id?: string
  nomePauta: string
  descricao: string
  opcoes: string[]
  status: string
  aba: string
  createdAt?: any
  updatedAt?: any
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
  id?: string
  cpf: string
  nome: string
  apartamento: string
  torre: string
}

export interface Voto {
  id?: string
  cpf: string
  nome: string
  apartamento: string
  torre: string
  voto: string
  tipoVotacao: string
  timestamp: any
}

export const firebaseApi = {
  // Pautas
  getPautas: async (): Promise<Pauta[]> => {
    const dbInstance = ensureDb()
    const pautasRef = collection(dbInstance, 'pautas')
    const q = query(pautasRef, where('status', '==', 'Votação Liberada'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Pauta))
  },

  getAllPautas: async (): Promise<Pauta[]> => {
    const dbInstance = ensureDb()
    const pautasRef = collection(dbInstance, 'pautas')
    const snapshot = await getDocs(pautasRef)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Pauta))
  },

  getPautaByAba: async (aba: string): Promise<Pauta> => {
    const dbInstance = ensureDb()
    const pautasRef = collection(dbInstance, 'pautas')
    const q = query(pautasRef, where('aba', '==', aba))
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      throw new Error('Pauta não encontrada')
    }
    
    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    } as Pauta
  },

  savePauta: async (pautaData: Partial<Pauta>): Promise<string> => {
    const dbInstance = ensureDb()
    const pautasRef = collection(dbInstance, 'pautas')
    const docRef = await addDoc(pautasRef, {
      ...pautaData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  },

  updatePauta: async (id: string, pautaData: Partial<Pauta>): Promise<void> => {
    const dbInstance = ensureDb()
    const pautaRef = doc(dbInstance, 'pautas', id)
    await updateDoc(pautaRef, {
      ...pautaData,
      updatedAt: serverTimestamp()
    })
  },

  deletePauta: async (id: string): Promise<void> => {
    const dbInstance = ensureDb()
    const pautaRef = doc(dbInstance, 'pautas', id)
    await deleteDoc(pautaRef)
  },

  // Votação
  getVotingConfig: async (tipo: string): Promise<VotingConfig> => {
    const pauta = await firebaseApi.getPautaByAba(tipo)
    return {
      titulo: pauta.nomePauta,
      descricao: pauta.descricao,
      candidatos: pauta.opcoes
    }
  },

  getVoterStatus: async (cpf: string, tipo: string): Promise<VoterStatus> => {
    const normalizedCPF = normalizeCPF(cpf)
    
    // Buscar na coleção administradores (que inclui moradores e administradores)
    const dbInstance = ensureDb()
    const administradoresRef = collection(dbInstance, 'administradores')
    const q = query(administradoresRef, where('cpf', '==', normalizedCPF))
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      throw new Error('CPF não encontrado na lista de moradores')
    }
    
    const usuario = snapshot.docs[0].data()
    
    // Verificar se já votou
    const dbInstance = ensureDb()
    const votosRef = collection(dbInstance, 'votos')
    const votoQuery = query(
      votosRef, 
      where('cpf', '==', normalizedCPF),
      where('tipoVotacao', '==', tipo)
    )
    const votoSnapshot = await getDocs(votoQuery)
    
    let votou = false
    let voto: string | null = null
    
    if (!votoSnapshot.empty) {
      votou = true
      voto = votoSnapshot.docs[0].data().voto
    }
    
    return {
      cpf: usuario.cpf,
      nome: usuario.nome,
      apartamento: usuario.apartamento,
      torre: usuario.torre,
      votou,
      voto
    }
  },

  saveVote: async (cpf: string, voto: string, tipo: string): Promise<void> => {
    const normalizedCPF = normalizeCPF(cpf)
    
    // Buscar TODOS os registros com esse CPF na coleção administradores
    const dbInstance = ensureDb()
    const administradoresRef = collection(dbInstance, 'administradores')
    const q = query(administradoresRef, where('cpf', '==', normalizedCPF))
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      throw new Error('CPF não encontrado')
    }

    // Verificar se algum dos usuários com esse CPF é mestre
    const isMaster = snapshot.docs.some(doc => doc.data().isMaster === true)
    if (isMaster) {
      throw new Error('Usuários mestres não podem votar')
    }
    
    // Verificar se já votou nesta pauta (buscar qualquer voto desse CPF)
    const dbInstance = ensureDb()
    const votosRef = collection(dbInstance, 'votos')
    const votoQuery = query(
      votosRef,
      where('cpf', '==', normalizedCPF),
      where('tipoVotacao', '==', tipo)
    )
    const votoSnapshot = await getDocs(votoQuery)
    
    if (!votoSnapshot.empty) {
      // Se já votou, atualizar TODOS os votos existentes desse CPF (editar)
      const updatePromises = votoSnapshot.docs.map(votoDoc => 
        updateDoc(doc(votosRef, votoDoc.id), {
          voto,
          timestamp: serverTimestamp()
        })
      )
      await Promise.all(updatePromises)
    } else {
      // Se não votou ainda, criar um voto para CADA apartamento/torre desse CPF
      const createPromises = snapshot.docs.map(usuarioDoc => {
        const usuario = usuarioDoc.data()
        return addDoc(votosRef, {
          cpf: normalizedCPF,
          nome: usuario.nome,
          apartamento: usuario.apartamento,
          torre: usuario.torre,
          voto,
          tipoVotacao: tipo,
          timestamp: serverTimestamp()
        })
      })
      await Promise.all(createPromises)
    }
  },

  getScores: async (tipo: string): Promise<Placar> => {
    const dbInstance = ensureDb()
    const votosRef = collection(dbInstance, 'votos')
    
    // Buscar votos de duas formas:
    // 1. Votos corretos: tipoVotacao == tipo
    // 2. Votos antigos com campos invertidos: voto == tipo (onde voto contém o tipo da pauta)
    const q1 = query(votosRef, where('tipoVotacao', '==', tipo))
    const q2 = query(votosRef, where('voto', '==', tipo))
    
    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ])
    
    const counts: Record<string, number> = {}
    let total = 0
    const processedIds = new Set<string>()
    
    // Processar votos corretos (tipoVotacao == tipo, voto == candidato)
    snapshot1.docs.forEach((doc) => {
      if (processedIds.has(doc.id)) return
      processedIds.add(doc.id)
      
      const data = doc.data()
      const voto = data.voto
      const tipoVotacao = data.tipoVotacao
      
      if (voto && tipoVotacao === tipo) {
        counts[voto] = (counts[voto] || 0) + 1
        total++
      }
    })
    
    // Processar votos antigos com campos invertidos (voto == tipo, tipoVotacao == candidato)
    snapshot2.docs.forEach((docSnapshot) => {
      if (processedIds.has(docSnapshot.id)) return
      processedIds.add(docSnapshot.id)
      
      const data = docSnapshot.data()
      const voto = data.voto // Contém o tipo (campos invertidos)
      const tipoVotacao = data.tipoVotacao // Contém o candidato (campos invertidos)
      
      // Se voto == tipo, significa que os campos estão invertidos
      if (voto === tipo && tipoVotacao) {
        const candidato = tipoVotacao // O candidato está em tipoVotacao
        
        // Contar o voto (candidato está em tipoVotacao)
        counts[candidato] = (counts[candidato] || 0) + 1
        total++
        
        // Corrigir o documento automaticamente (fazer de forma assíncrona sem bloquear)
        const docRef = doc(votosRef, docSnapshot.id)
        updateDoc(docRef, {
          voto: candidato, // Candidato vai para voto
          tipoVotacao: tipo, // Tipo vai para tipoVotacao
          timestamp: serverTimestamp()
        }).catch(() => {
          // Silenciosamente ignorar erros de correção
        })
      }
    })
    
    return { counts, total }
  },

  getAllVotesByAba: async (abaNome: string): Promise<Voto[]> => {
    const dbInstance = ensureDb()
    const votosRef = collection(dbInstance, 'votos')
    const q = query(votosRef, where('tipoVotacao', '==', abaNome))
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Voto))
  },

  clearVotesByAba: async (abaNome: string): Promise<void> => {
    const dbInstance = ensureDb()
    const votosRef = collection(dbInstance, 'votos')
    const q = query(votosRef, where('tipoVotacao', '==', abaNome))
    const snapshot = await getDocs(q)
    
    // Deletar todos os votos encontrados
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(deletePromises)
  },

  // Admin - Autenticação (usar lib/auth.ts ao invés desta função)
  authenticateAdmin: async (emailOrCpf: string, senha: string): Promise<AdminData> => {
    const normalizedInput = normalizeCPF(emailOrCpf)
    const isEmail = emailOrCpf.includes('@')
    
    const dbInstance = ensureDb()
    const administradoresRef = collection(dbInstance, 'administradores')
    
    let q
    if (isEmail) {
      q = query(administradoresRef, where('email', '==', emailOrCpf.toLowerCase()))
    } else {
      q = query(administradoresRef, where('cpf', '==', normalizedInput))
    }
    
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return { success: false, nome: '' }
    }
    
    const admin = snapshot.docs[0].data()
    
    // Verificar senha (formato: apartamento + torre, ou senha customizada)
    const expectedPassword = admin.senha || `${admin.apartamento}${admin.torre}`
    
    if (senha === expectedPassword || senha === admin.senha) {
      return {
        success: true,
        nome: admin.nome || 'Administrador'
      }
    }
    
    return { success: false, nome: '' }
  },

  // Moradores - Buscar da coleção administradores com acesso "Morador" ou isMaster
  getAllMoradores: async (): Promise<Morador[]> => {
    const dbInstance = ensureDb()
    const administradoresRef = collection(dbInstance, 'administradores')
    
    // Buscar todos os registros (sem filtro) para incluir moradores e usuário mestre
    const snapshot = await getDocs(administradoresRef)
    
    // Filtrar apenas moradores e usuários mestres (excluir administradores não-mestres)
    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Morador))
      .filter(morador => {
        // Incluir se for morador OU se for usuário mestre
        return morador.acesso === 'Morador' || morador.isMaster === true
      })
  },

  createMorador: async (moradorData: { 
    cpf: string
    nome: string
    apartamento: string
    torre: string
    acesso?: 'Administrador' | 'Morador'
    email?: string | null
    isMaster?: boolean
  }): Promise<void> => {
    const { cpf, nome, apartamento, torre, acesso = 'Morador', email = null, isMaster = false } = moradorData
    const normalizedCPF = normalizeCPF(cpf)
    
    // Validar dados
    if (!normalizedCPF || !nome.trim() || !apartamento.trim() || !torre.trim()) {
      throw new Error('Todos os campos obrigatórios devem ser preenchidos')
    }

    // Validar isMaster apenas para Administradores
    if (isMaster && acesso !== 'Administrador') {
      throw new Error('Apenas Administradores podem ser marcados como Mestre')
    }
    
    const dbInstance = ensureDb()
    const administradoresRef = collection(dbInstance, 'administradores')
    
    // Verificar se já existe por Apartamento + Torre (campos chave)
    const qByApt = query(
      administradoresRef,
      where('apartamento', '==', apartamento.trim()),
      where('torre', '==', torre.trim())
    )
    const snapshotApt = await getDocs(qByApt)
    
    if (!snapshotApt.empty) {
      // Se já existe, atualizar o registro existente
      const docRef = snapshotApt.docs[0]
      const existingData = docRef.data()
      
      // Não atualizar se for usuário mestre
      if (existingData.isMaster) {
        throw new Error('Não é possível atualizar usuário mestre')
      }
      
      await updateDoc(docRef.ref, {
        cpf: normalizedCPF,
        nome: nome.trim(),
        senha: `${apartamento.trim()}${torre.trim()}`,
        acesso: acesso,
        email: email && email.trim() ? email.trim().toLowerCase() : null,
        data_cadastro: serverTimestamp()
      })
      return // Retornar sem criar novo
    }
    
    // Criar novo morador se não existir
    const senha = `${apartamento.trim()}${torre.trim()}`
    await addDoc(administradoresRef, {
      cpf: normalizedCPF,
      nome: nome.trim(),
      apartamento: apartamento.trim(),
      torre: torre.trim(),
      senha,
      acesso: acesso,
      email: email && email.trim() ? email.trim().toLowerCase() : null,
      isMaster: isMaster,
      data_cadastro: serverTimestamp()
    })
  },

  updateMorador: async (id: string, moradorData: { cpf: string; nome: string; apartamento: string; torre: string }): Promise<void> => {
    const { cpf, nome, apartamento, torre } = moradorData
    const normalizedCPF = normalizeCPF(cpf)
    
    // Validar dados
    if (!normalizedCPF || !nome.trim()) {
      throw new Error('CPF e Nome são obrigatórios')
    }
    
    const dbInstance = ensureDb()
    const administradoresRef = collection(dbInstance, 'administradores')
    const docRef = doc(administradoresRef, id)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      throw new Error('Morador não encontrado')
    }
    
    const existingData = docSnap.data()
    
    // Não permitir editar usuário mestre
    if (existingData.isMaster) {
      throw new Error('Não é possível editar usuário mestre')
    }
    
    // Não permitir alterar apartamento ou torre - usar os valores existentes
    const apartamentoFinal = existingData.apartamento || apartamento.trim()
    const torreFinal = existingData.torre || torre.trim()
    
    // Atualizar apenas CPF e Nome (apartamento e torre não podem ser alterados)
    const senha = `${apartamentoFinal}${torreFinal}`
    await updateDoc(docRef, {
      cpf: normalizedCPF,
      nome: nome.trim(),
      data_cadastro: serverTimestamp()
    })
  },

  deleteMorador: async (id: string): Promise<void> => {
    const dbInstance = ensureDb()
    const administradoresRef = collection(dbInstance, 'administradores')
    const docRef = doc(administradoresRef, id)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      throw new Error('Morador não encontrado')
    }
    
    const data = docSnap.data()
    
    // Não permitir deletar usuário mestre
    if (data.isMaster) {
      throw new Error('Não é possível excluir usuário mestre')
    }
    
    await deleteDoc(docRef)
  },

  // Export (para compatibilidade - pode retornar URL de download)
  exportPautaToExcel: async (abaNome: string): Promise<string> => {
    // TODO: Implementar exportação para Excel usando biblioteca como xlsx
    // Por enquanto, retorna uma mensagem
    return 'Exportação para Excel será implementada em breve'
  },

  // Upload Excel - Processa planilha e salva na coleção administradores
  processExcelUpload: async (base64Data: string, fileName: string): Promise<{ inserted: number; updated: number; total: number }> => {
    // Converter base64 para ArrayBuffer
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const arrayBuffer = bytes.buffer

    // Usar a API do Next.js para processar o Excel
    const response = await fetch('/api/process-excel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileData: Array.from(new Uint8Array(arrayBuffer)),
        fileName
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erro ao processar arquivo Excel')
    }

    return await response.json()
  }
}

