'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Footer } from '@/components/Footer'
import { TermsModal } from '@/components/TermsModal'

export default function LoginPage() {
  const router = useRouter()
  const { user, login } = useAuth()
  const [emailOrCpf, setEmailOrCpf] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

  useEffect(() => {
    // Se já estiver logado, redirecionar
    if (user) {
      router.push('/pautas')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const success = await login(emailOrCpf, senha)
      if (success) {
        router.push('/pautas')
      } else {
        setError('Credenciais inválidas. Verifique seu email/CPF e senha.')
      }
    } catch (err: any) {
      setError('Erro ao fazer login: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      <div className="flex-1 flex items-center justify-center py-6 sm:py-10 px-3 sm:px-4">
        <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/img/logo_grand_oasis.webp" 
                alt="Grand Oasis Poá" 
                className="h-24 w-auto object-contain max-w-full"
              />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email ou CPF
              </label>
              <input
                type="text"
                value={emailOrCpf}
                onChange={(e) => setEmailOrCpf(e.target.value)}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-violet-500 focus:ring-violet-500 h-12 text-base px-4"
                placeholder="admin@admin.com ou 00000000000"
                required
                autoFocus
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-violet-500 focus:ring-violet-500 h-12 text-base px-4"
                placeholder="Digite sua senha"
                required
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Padrão: Número do AP + Número da Torre (ex: 34 + 2 = 342)
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Checkbox de aceite dos termos LGPD */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-700"
                disabled={loading}
              />
              <label htmlFor="acceptTerms" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                Concordo com os{' '}
                <button 
                  type="button"
                  className="text-violet-600 dark:text-violet-400 hover:underline"
                  onClick={() => setShowTermsModal(true)}
                >
                  Termos de Uso
                </button>
                {' '}e{' '}
                <button 
                  type="button"
                  className="text-violet-600 dark:text-violet-400 hover:underline"
                  onClick={() => setShowPrivacyModal(true)}
                >
                  Política de Privacidade
                </button>
                {' '}e autorizo o uso dos meus dados pessoais de acordo com a LGPD.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !acceptedTerms}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white px-5 py-3 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-base h-12 font-semibold shadow-lg transition-all"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Entrando...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M7.5 3.75a1.5 1.5 0 0 0-1.5 1.5v3.75h-3a.75.75 0 0 0 0 1.5h3v7.5h-3a.75.75 0 0 0 0 1.5h3V21a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5v-3.75h3a.75.75 0 0 0 0-1.5h-3v-7.5h3a.75.75 0 0 0 0-1.5h-3V5.25a1.5 1.5 0 0 0-1.5-1.5h-9Z" clipRule="evenodd"/>
                  </svg>
                  Entrar
                </>
              )}
            </button>
          </form>
        </div>
        </div>
      </div>
      <Footer />

      {/* Modais de Termos e Privacidade */}
      <TermsModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
        type="terms" 
      />
      <TermsModal 
        isOpen={showPrivacyModal} 
        onClose={() => setShowPrivacyModal(false)} 
        type="privacy" 
      />
    </div>
  )
}

