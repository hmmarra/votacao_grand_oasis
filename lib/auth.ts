'use client'

import { useState, useEffect } from 'react'
import { db } from './firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

export interface User {
  id: string
  nome: string
  cpf: string
  acesso: 'Administrador' | 'Morador' | 'Engenharia' | 'Desenvolvedor'
  apartamento: string
  torre: string
  email?: string
  data_cadastro?: any
  isMaster?: boolean
}

// Função auxiliar para normalizar CPF
function normalizeCPF(value: string): string {
  return String(value || '').replace(/\D/g, '')
}

export async function authenticateUser(emailOrCpf: string, senha: string): Promise<User | null> {
  try {
    const normalizedInput = normalizeCPF(emailOrCpf)
    const isEmail = emailOrCpf.includes('@')

    if (!db) {
      throw new Error('Firebase não inicializado')
    }

    const administradoresRef = collection(db, 'administradores')

    let q
    if (isEmail) {
      q = query(administradoresRef, where('email', '==', emailOrCpf.toLowerCase()))
    } else {
      q = query(administradoresRef, where('cpf', '==', normalizedInput))
    }

    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return null
    }

    // Verificar entre os documentos encontrados qual coincide com a senha fornecida
    // Isso permite que um mesmo CPF tenha múltiplos perfis (ex: Morador e Engenheiro) com senhas diferentes
    for (const adminDoc of snapshot.docs) {
      const data = adminDoc.data()
      const expectedPassword = data.senha || `${data.apartamento}${data.torre}`

      if (senha === expectedPassword || (data.senha && senha === data.senha)) {
        return {
          id: adminDoc.id,
          nome: data.nome,
          cpf: data.cpf,
          acesso: data.acesso || 'Morador',
          apartamento: data.apartamento,
          torre: data.torre,
          email: data.email,
          data_cadastro: data.data_cadastro,
          isMaster: data.isMaster || false
        }
      }
    }

    return null
  } catch (error) {
    console.error('Erro na autenticação:', error)
    return null
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar se há usuário salvo (primeiro localStorage, depois sessionStorage)
    const savedUserLocal = localStorage.getItem('user')
    const savedUserSession = sessionStorage.getItem('user')
    const savedUser = savedUserLocal || savedUserSession

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (e) {
        localStorage.removeItem('user')
        sessionStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (emailOrCpf: string, senha: string, rememberMe: boolean = false): Promise<boolean> => {
    const authenticatedUser = await authenticateUser(emailOrCpf, senha)
    if (authenticatedUser) {
      setUser(authenticatedUser)
      // Salva no storage apropriado e limpa o outro para evitar conflitos
      if (rememberMe) {
        localStorage.setItem('user', JSON.stringify(authenticatedUser))
        sessionStorage.removeItem('user')
      } else {
        sessionStorage.setItem('user', JSON.stringify(authenticatedUser))
        localStorage.removeItem('user')
      }
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem('user')
    localStorage.removeItem('user')
  }

  return { user, loading, login, logout }
}

