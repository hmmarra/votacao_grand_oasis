'use client'

import { useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'

export default function InitAdminPage() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'creating' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const initializeAdmin = async () => {
    try {
      setStatus('checking')
      setMessage('Verificando se o usuário mestre já existe...')

      // Verificar se já existe
      if (!db) {
        setStatus('error')
        setMessage('Firebase não inicializado. Verifique as variáveis de ambiente.')
        return
      }
      
      const administradoresRef = collection(db, 'administradores')
      const q = query(administradoresRef, where('email', '==', 'admin@admin.com'))
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        setStatus('success')
        setMessage('✅ Usuário mestre já existe! Não é necessário criar novamente.')
        return
      }

      setStatus('creating')
      setMessage('Criando usuário mestre...')

      // Criar usuário mestre
      await addDoc(administradoresRef, {
        nome: 'Administrador Mestre',
        cpf: '00000000000',
        email: 'admin@admin.com',
        senha: 'Senha123456',
        acesso: 'Administrador',
        apartamento: '0',
        torre: '0',
        data_cadastro: serverTimestamp(),
        isMaster: true
      })

      setStatus('success')
      setMessage('✅ Usuário mestre criado com sucesso!\n\nEmail: admin@admin.com\nSenha: Senha123456')
    } catch (error: any) {
      setStatus('error')
      setMessage(`❌ Erro: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-6 sm:py-10 px-3 sm:px-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
            🔧 Inicializar Sistema
          </h1>

          <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              <strong>Usuário Mestre:</strong>
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>Email: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">admin@admin.com</code></li>
              <li>Senha: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">Senha123456</code></li>
            </ul>
          </div>

          <button
            onClick={initializeAdmin}
            disabled={status === 'checking' || status === 'creating'}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 text-white px-5 py-3 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-base h-12 font-medium"
          >
            {status === 'checking' || status === 'creating' ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                {status === 'checking' ? 'Verificando...' : 'Criando...'}
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.06l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 0 0 1.061 1.06l8.69-8.69Z"/>
                  <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z"/>
                </svg>
                Criar Usuário Mestre
              </>
            )}
          </button>

          {message && (
            <div className={`mt-4 p-3 rounded-lg whitespace-pre-line ${
              status === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                : status === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}>
              <p className="text-sm">{message}</p>
            </div>
          )}

          <div className="mt-6 text-center">
            <a
              href="/login"
              className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium"
            >
              ← Voltar para Login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

