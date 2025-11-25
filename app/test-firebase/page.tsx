'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'

export default function TestFirebasePage() {
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking')
  const [message, setMessage] = useState('')
  const [collections, setCollections] = useState<string[]>([])
  const [testWrite, setTestWrite] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [mounted, setMounted] = useState(false)
  const [envCheck, setEnvCheck] = useState<{ missing: string[]; present: string[]; values: Record<string, string> }>({
    missing: [],
    present: [],
    values: {}
  })

  useEffect(() => {
    setMounted(true)
    checkEnvVars()
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      setStatus('checking')
      setMessage('Testando conexão com Firebase...')

      // Verificar se o db está inicializado
      if (!db) {
        throw new Error('Firebase não foi inicializado. Verifique as variáveis de ambiente.')
      }

      // Tentar listar coleções (teste de leitura)
      const testCollection = collection(db, 'test')
      const snapshot = await getDocs(testCollection)
      
      setStatus('success')
      setMessage('✅ Conexão com Firebase estabelecida com sucesso!')
      
      // Listar coleções disponíveis
      const availableCollections = ['moradores', 'pautas', 'votos', 'administradores']
      setCollections(availableCollections)
      
    } catch (error: any) {
      setStatus('error')
      setMessage(`❌ Erro: ${error.message}`)
      console.error('Erro ao testar Firebase:', error)
    }
  }

  const testWriteOperation = async () => {
    if (!db) {
      setTestWrite('error')
      return
    }
    
    try {
      setTestWrite('testing')
      
      // Tentar escrever um documento de teste
      const testCollection = collection(db, 'test')
      await addDoc(testCollection, {
        message: 'Teste de escrita do Firebase',
        timestamp: serverTimestamp(),
        test: true
      })
      
      setTestWrite('success')
      setTimeout(() => setTestWrite('idle'), 3000)
    } catch (error: any) {
      setTestWrite('error')
      console.error('Erro ao testar escrita:', error)
    }
  }

  const checkEnvVars = () => {
    if (typeof window === 'undefined') return
    
    const required = [
      'NEXT_PUBLIC_USE_FIREBASE',
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID'
    ]

    const missing: string[] = []
    const present: string[] = []
    const values: Record<string, string> = {}

    // Verificar se o Firebase foi inicializado (melhor indicador)
    const firebaseInitialized = db !== null

    required.forEach(key => {
      // No Next.js, variáveis NEXT_PUBLIC_* são injetadas no build
      // Podem não estar disponíveis via process.env no cliente
      // Mas se o Firebase inicializou, significa que estão configuradas
      const value = process.env[key]
      
      // Se o Firebase está inicializado, assumimos que as variáveis estão OK
      if (firebaseInitialized) {
        present.push(key)
        if (key === 'NEXT_PUBLIC_USE_FIREBASE') {
          values[key] = 'true (inferido)'
        } else {
          values[key] = '*** (configurado)'
        }
      } else if (!value || value.trim() === '') {
        missing.push(key)
      } else {
        present.push(key)
        // Mostrar apenas os primeiros e últimos caracteres por segurança
        if (key === 'NEXT_PUBLIC_USE_FIREBASE') {
          values[key] = value
        } else {
          const masked = value.length > 10 
            ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
            : '***'
          values[key] = masked
        }
      }
    })

    setEnvCheck({ missing, present, values })
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-6 sm:py-10 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
              🔥 Teste de Conexão Firebase
            </h1>
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-violet-600 border-t-transparent"></div>
              <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-6 sm:py-10 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
            🔥 Teste de Conexão Firebase
          </h1>

          {/* Verificação de Variáveis de Ambiente */}
          <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
              Variáveis de Ambiente
            </h2>
            
            {mounted && envCheck.missing.length > 0 && status !== 'success' && (
              <div className="space-y-2">
                <p className="text-red-600 dark:text-red-400 font-medium">
                  ❌ Variáveis faltando:
                </p>
                <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 space-y-1">
                  {envCheck.missing.map(key => (
                    <li key={key}>{key}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {mounted && envCheck.missing.length > 0 && status === 'success' && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                  ✅ <strong>Variáveis Configuradas Corretamente!</strong>
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mb-2">
                  As variáveis não foram detectadas via <code className="bg-green-100 dark:bg-green-900 px-1 rounded">process.env</code> no cliente, 
                  mas como a <strong>conexão com Firebase está funcionando</strong>, isso significa que todas as variáveis estão configuradas corretamente no <code className="bg-green-100 dark:bg-green-900 px-1 rounded">.env.local</code>.
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Isso é normal no Next.js - as variáveis <code>NEXT_PUBLIC_*</code> são injetadas no build e podem não estar acessíveis via <code>process.env</code> no runtime do cliente.
                </p>
              </div>
            )}
            
            {mounted && envCheck.missing.length === 0 && envCheck.present.length > 0 && (
              <>
                <p className="text-green-600 dark:text-green-400 font-medium">
                  ✅ Todas as variáveis de ambiente estão configuradas
                </p>
                <div className="mt-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Variáveis encontradas ({envCheck.present.length}/{7}):
                  </p>
                  <ul className="list-disc list-inside text-xs text-gray-500 dark:text-gray-500 space-y-1">
                    {envCheck.present.map(key => (
                      <li key={key}>
                        <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{key}</code>
                        {envCheck.values[key] && (
                          <span className="ml-2 text-gray-400">= {envCheck.values[key]}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✅ Todas as variáveis estão configuradas! Verifique se os valores estão corretos.
                  </p>
                </div>
              </>
            )}
            
            {!mounted && (
              <div className="space-y-2">
                <p className="text-gray-600 dark:text-gray-400">Verificando variáveis de ambiente...</p>
              </div>
            )}
            
            {mounted && envCheck.missing.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  ⚠️ Variáveis não encontradas
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                  Se você já configurou o <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">.env.local</code>, certifique-se de:
                </p>
                <ul className="list-disc list-inside text-xs text-yellow-700 dark:text-yellow-300 space-y-1 mb-3">
                  <li>O arquivo está na <strong>raiz do projeto</strong> (mesmo nível do package.json)</li>
                  <li>O servidor foi <strong>reiniciado</strong> após criar/alterar o .env.local</li>
                  <li>As variáveis começam com <code>NEXT_PUBLIC_</code></li>
                  <li>Não há espaços antes ou depois do <code>=</code></li>
                </ul>
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded text-xs">
                  <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                    🔄 Ação Necessária:
                  </p>
                  <p className="text-yellow-800 dark:text-yellow-200">
                    1. Pare o servidor (Ctrl+C no terminal)<br/>
                    2. Execute <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">npm run dev</code> novamente<br/>
                    3. Recarregue esta página
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Status da Conexão */}
          <div className="mb-6 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Status da Conexão
              </h2>
              <button
                onClick={testConnection}
                className="px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 text-sm"
              >
                Testar Novamente
              </button>
            </div>

            {status === 'checking' && (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-violet-600 border-t-transparent"></div>
                <p className="text-gray-600 dark:text-gray-400">{message}</p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-3">
                <p className="text-green-600 dark:text-green-400 font-medium">{message}</p>
                
                {collections.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Coleções esperadas no Firestore:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      {collections.map(col => (
                        <li key={col}>{col}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-2">
                <p className="text-red-600 dark:text-red-400 font-medium">{message}</p>
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                  <p className="font-medium mb-2">Possíveis causas:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Variáveis de ambiente não configuradas corretamente</li>
                    <li>Firestore não foi ativado no Firebase Console</li>
                    <li>Regras de segurança do Firestore bloqueando acesso</li>
                    <li>Projeto Firebase não existe ou está incorreto</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Teste de Escrita */}
          <div className="mb-6 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
              Teste de Escrita
            </h2>
            
            <button
              onClick={testWriteOperation}
              disabled={status !== 'success' || testWrite === 'testing'}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {testWrite === 'testing' ? 'Testando...' : 'Testar Escrita'}
            </button>

            {testWrite === 'success' && (
              <p className="mt-3 text-green-600 dark:text-green-400 font-medium">
                ✅ Escrita realizada com sucesso! Verifique a coleção "test" no Firebase Console.
              </p>
            )}

            {testWrite === 'error' && (
              <p className="mt-3 text-red-600 dark:text-red-400 font-medium">
                ❌ Erro ao escrever. Verifique as regras de segurança do Firestore.
              </p>
            )}
          </div>

          {/* Instruções */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
              📝 Próximos Passos:
            </h3>
            <ol className="list-decimal list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>Verifique se todas as variáveis estão no arquivo <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">.env.local</code></li>
              <li>Certifique-se de que o Firestore está ativado no Firebase Console</li>
              <li>Configure as regras de segurança do Firestore (veja SETUP_FIREBASE.md)</li>
              <li>Se o teste de escrita falhar, ajuste as regras para permitir escrita na coleção "test"</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

