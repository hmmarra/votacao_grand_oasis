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
  onSnapshot,
  arrayUnion,
  arrayRemove,
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
  acesso?: 'Administrador' | 'Morador' | 'Engenharia' | 'Desenvolvedor'
  email?: string | null
  isMaster?: boolean
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


export interface Reforma {
  id?: string
  moradorId: string
  moradorCpf?: string // Adicionado campo de CPF do morador
  moradorNome: string
  apartamento: string
  torre: string
  email: string
  telefone?: string
  tipoObra: string
  servicos: string[]
  dataInicio: string
  dataFim: string
  artRrt?: string
  empresa?: string
  cnpjPrestador?: string
  funcionarios?: { nome: string; rg: string }[]
  status: 'Em Análise' | 'Aprovado' | 'Reprovado' | 'Em Andamento' | 'Concluído' | 'Aguardando Vistoria' | 'Vistoria Aprovada' | 'Vistoria Reprovada'
  observacoes?: string
  anexos?: string[] // URLs ou nomes de arquivos
  vistorias?: {
    id?: string
    data: string
    status: string
    observacoes: string
    anexos?: string[]
    fotos?: string[]
    usuario?: string
    timestamp?: string
  }[]
  mensagens?: {
    id: string
    data: string
    autor: string
    texto: string
    isAdmin: boolean
  }[]
  usersTyping?: string[]
  createdAt?: any
  updatedAt?: any
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

    // Retornar todos os registros para permitir gestão total no painel admin
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Morador))
  },

  createMorador: async (moradorData: {
    cpf: string
    nome: string
    apartamento: string
    torre: string
    acesso?: 'Administrador' | 'Morador' | 'Engenharia' | 'Desenvolvedor'
    email?: string | null
    isMaster?: boolean
  }): Promise<void> => {
    const { cpf, nome, apartamento, torre, acesso = 'Morador', email = null, isMaster = false } = moradorData
    const normalizedCPF = normalizeCPF(cpf)

    // Validar dados - Apartamento e Torre só obrigatórios para Morador
    const isMorador = acesso === 'Morador'
    if (!normalizedCPF || !nome.trim() || (isMorador && (!apartamento.trim() || !torre.trim()))) {
      throw new Error(isMorador
        ? 'CPF, Nome, Apartamento e Torre são obrigatórios para moradores comuns'
        : 'CPF e Nome são obrigatórios')
    }

    const dbInstance = ensureDb()
    const administradoresRef = collection(dbInstance, 'administradores')

    // Verificar duplicidade
    let q
    if (isMorador) {
      // Para Moradores: CPF + Apartamento + Torre deve ser único (um morador pode ter múltiplos aptos, mas um apto só tem aquele vínculo)
      // Ou melhor: Apartamento + Torre é a chave primária de moradores comuns.
      q = query(
        administradoresRef,
        where('apartamento', '==', apartamento.trim()),
        where('torre', '==', torre.trim())
      )
    } else {
      // Para outros tipos: CPF + Acesso deve ser único
      q = query(
        administradoresRef,
        where('cpf', '==', normalizedCPF),
        where('acesso', '==', acesso)
      )
    }
    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      if (isMorador) {
        const existingData = snapshot.docs[0].data();
        if (existingData.cpf === normalizedCPF) {
          throw new Error('Este morador já existe nesta unidade.');
        }
        throw new Error('Esta unidade já possui um cadastro ativo.');
      } else {
        throw new Error(`Este CPF já possui um cadastro como ${acesso}.`);
      }
    }

    // Criar novo morador se não existir
    const senha = isMorador ? `${apartamento.trim()}${torre.trim()}` : 'Senha123456'
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

  updateMorador: async (id: string, moradorData: {
    cpf: string;
    nome: string;
    apartamento: string;
    torre: string;
    acesso?: 'Administrador' | 'Morador' | 'Engenharia' | 'Desenvolvedor';
    isMaster?: boolean;
    email?: string | null;
  }): Promise<void> => {
    const { cpf, nome, apartamento, torre, acesso, isMaster, email } = moradorData
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

    // Não permitir alterar apartamento ou torre - usar os valores existentes
    const apartamentoFinal = existingData.apartamento || apartamento.trim()
    const torreFinal = existingData.torre || torre.trim()

    // Atualizar apenas CPF e Nome (apartamento e torre não podem ser alterados)
    const senha = `${apartamentoFinal}${torreFinal}`
    await updateDoc(docRef, {
      cpf: normalizedCPF,
      nome: nome.trim(),
      email: moradorData.email || null,
      acesso: acesso,
      isMaster: isMaster,
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

    await deleteDoc(docRef)
  },

  // Export (para compatibilidade - pode retornar URL de download)
  exportPautaToExcel: async (abaNome: string): Promise<string> => {
    // TODO: Implementar exportação para Excel usando biblioteca como xlsx
    // Por enquanto, retorna uma mensagem
    return 'Exportação para Excel será implementada em breve'
  },

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
  },

  // Dashboard Helpers
  getVotesByCpf: async (cpf: string): Promise<Voto[]> => {
    const normalizedCPF = normalizeCPF(cpf)
    const dbInstance = ensureDb()
    const votosRef = collection(dbInstance, 'votos')
    const q = query(votosRef, where('cpf', '==', normalizedCPF))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Voto))
  },

  getReformas: async (): Promise<Reforma[]> => {
    const dbInstance = ensureDb()
    try {
      const reformasRef = collection(dbInstance, 'reformas')
      const snapshot = await getDocs(reformasRef)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Reforma))
    } catch (e) {
      console.warn('Coleção de reformas não encontrada ou erro ao acessar:', e)
      return []
    }
  },

  getReformasByUser: async (cpf: string): Promise<Reforma[]> => {
    const dbInstance = ensureDb()
    // Precisamos buscar o ID do morador pelo CPF primeiro ou assumir que o CPF é guardado na reforma?
    // Vamos guardar o CPF na reforma para facilitar busca inversa se necessário, 
    // mas aqui vou buscar pelo moradorId se o contexto guardar o ID, ou adicionar CPF na reforma.
    // Melhor adicionar cpf na interface Reforma para garantir.
    // Mas seguindo o padrão atual, vamos buscar por 'moradorId' que será o ID do doc do morador.

    // UPDATE: Vamos adicionar campo cpf na Reforma para facilitar query
    const reformasRef = collection(dbInstance, 'reformas')
    const q = query(reformasRef, where('moradorCpf', '==', normalizeCPF(cpf)))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Reforma))
  },

  createReforma: async (reformaData: Omit<Reforma, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { moradorCpf: string }): Promise<string> => {
    const dbInstance = ensureDb()
    const reformasRef = collection(dbInstance, 'reformas')

    // Verificar se já existe reforma com esta ART/RRT
    // Obs: ART pode ser opcional em alguns casos? Na interface está required.
    // Vamos verificar apenas se foi fornecido.
    if (reformaData.artRrt) {
      const q = query(reformasRef, where('artRrt', '==', reformaData.artRrt.trim()))
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        throw new Error('Já existe uma reforma cadastrada com esta ART/RRT.')
      }
    }

    const docRef = await addDoc(reformasRef, {
      ...reformaData,
      status: 'Em Análise',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  },

  updateReforma: async (id: string, updates: Partial<Reforma>): Promise<void> => {
    const dbInstance = ensureDb()
    const docRef = doc(dbInstance, 'reformas', id)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })
  },

  deleteReforma: async (id: string): Promise<void> => {
    const dbInstance = ensureDb()
    const docRef = doc(dbInstance, 'reformas', id)

    // Buscar a reforma para pegar os anexos antes de deletar
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const data = docSnap.data() as Reforma
      const filesToDelete: string[] = []

      // Coletar anexos da reforma
      if (data.anexos && Array.isArray(data.anexos)) {
        filesToDelete.push(...data.anexos)
      }

      // Coletar anexos e fotos das vistorias
      if (data.vistorias && Array.isArray(data.vistorias)) {
        data.vistorias.forEach(vistoria => {
          if (vistoria.anexos) filesToDelete.push(...vistoria.anexos)
          if (vistoria.fotos) filesToDelete.push(...vistoria.fotos)
        })
      }

      // Se houver arquivos para deletar, chamar a API
      if (filesToDelete.length > 0) {
        try {
          await fetch('/api/delete-files', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fileKeys: filesToDelete })
          })
        } catch (error) {
          console.error('Erro ao excluir arquivos da reforma:', error)
          // Não impedir a exclusão do doc se falhar a exclusão dos arquivos (opcional)
        }
      }
    }

    await deleteDoc(docRef)
  },

  checkArtExists: async (artRrt: string): Promise<boolean> => {
    const dbInstance = ensureDb()
    const reformasRef = collection(dbInstance, 'reformas')
    const q = query(reformasRef, where('artRrt', '==', artRrt.trim()))
    const snapshot = await getDocs(q)
    return !snapshot.empty
  },

  subscribeToReforma: (id: string, onUpdate: (reforma: Reforma) => void): (() => void) => {
    const dbInstance = ensureDb()
    const docRef = doc(dbInstance, 'reformas', id)
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        onUpdate({ id: doc.id, ...doc.data() } as Reforma)
      }
    })
  },

  setTypingStatus: async (id: string, user: string, isTyping: boolean): Promise<void> => {
    const dbInstance = ensureDb()
    const docRef = doc(dbInstance, 'reformas', id)
    await updateDoc(docRef, {
      usersTyping: isTyping ? arrayUnion(user) : arrayRemove(user)
    })
  },

  subscribeToReformas: (isAdmin: boolean, cpf: string, onUpdate: (reformas: Reforma[]) => void): (() => void) => {
    const dbInstance = ensureDb()
    const reformasRef = collection(dbInstance, 'reformas')

    let q = query(reformasRef)
    if (!isAdmin) {
      q = query(reformasRef, where('moradorCpf', '==', normalizeCPF(cpf)))
    }

    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Reforma))

      onUpdate(data)
    })
  }

}

