'use client'

import { useState, useEffect } from 'react'
import { db } from './firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

export interface User {
  id: string
  nome: string
  cpf: string
  acesso: 'Administrador' | 'Morador'
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
    
    const admin = snapshot.docs[0]
    const data = admin.data()
    
    // Verificar senha (formato: apartamento + torre, ou senha customizada)
    const expectedPassword = data.senha || `${data.apartamento}${data.torre}`
    
    if (senha === expectedPassword || senha === data.senha) {
      return {
        id: admin.id,
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
    // Verificar se há usuário salvo no sessionStorage
    const savedUser = sessionStorage.getItem('user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (e) {
        sessionStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (emailOrCpf: string, senha: string): Promise<boolean> => {
    const authenticatedUser = await authenticateUser(emailOrCpf, senha)
    if (authenticatedUser) {
      setUser(authenticatedUser)
      sessionStorage.setItem('user', JSON.stringify(authenticatedUser))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem('user')
  }

  return { user, loading, login, logout }
}

