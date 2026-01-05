'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/lib/auth'
import { ThemeToggle } from '@/components/ThemeToggle'
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
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

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
      const success = await login(emailOrCpf, senha, rememberMe)
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
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4">



      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center justify-between gap-12 lg:gap-16 xl:gap-24">
          {/* Left Side - Branding */}
          <div className="w-full lg:w-1/2">
            {/* Main Message */}
            <div className="space-y-8 max-w-2xl">
              <h1 className="text-4xl xl:text-6xl font-bold text-white leading-tight">
                SEU LAR,
                <br />
                SUA VOZ,
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  SUA DECISÃO
                </span>
              </h1>

              <p className="text-slate-300 text-lg leading-relaxed max-w-xl">
                Participe das decisões do seu condomínio de forma digital e transparente.
                Localizado no Jardim Débora, com mais de 20 itens de lazer.
              </p>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-6 max-w-md pt-8">
                <div className="bg-slate-800/30 backdrop-blur-sm p-6 border border-slate-700/30">
                  <div className="mb-3">
                    <div className="p-2.5 bg-orange-500/10 inline-block">
                      <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-white mb-1">2 Dorm</p>
                  <p className="text-sm text-slate-400">Maior da região</p>
                </div>

                <div className="bg-slate-800/30 backdrop-blur-sm p-6 border border-slate-700/30">
                  <div className="mb-3">
                    <div className="p-2.5 bg-blue-500/10 inline-block">
                      <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-white mb-1">+20</p>
                  <p className="text-sm text-slate-400">Itens de lazer</p>
                </div>
              </div>

              {/* Footer Text */}
              <div className="pt-10">
                <p className="text-slate-400 text-sm">
                  <span className="font-semibold text-slate-300">📍 Av. Nossa Senhora de Lourdes, 472</span><br />
                  Jardim Débora - Poá - SP
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Form Card */}
          <div className="w-full lg:w-1/2 xl:w-5/12 max-w-xl mx-auto lg:mx-0">
            {/* Form Card */}
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-8 shadow-2xl">
              {/* Logo and Brand - Centered */}
              <div className="flex flex-col items-center mb-8">
                <Image
                  src="/img/logo_grand_oasis.webp"
                  alt="Meu Condomínio"
                  width={64}
                  height={64}
                  className="mb-3 object-contain"
                />
                <h2 className="text-white font-bold text-xl tracking-wide">MEU CONDOMÍNIO</h2>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email/CPF */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Email ou CPF <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={emailOrCpf}
                    onChange={(e) => setEmailOrCpf(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-600 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 h-12 text-sm px-4 transition-all autofill:bg-slate-900/50 autofill:text-white"
                    style={{
                      WebkitBoxShadow: '0 0 0 1000px rgb(15 23 42 / 0.5) inset',
                      WebkitTextFillColor: 'white'
                    }}
                    placeholder="Digite seu email ou CPF"
                    required

                    disabled={loading}
                  />
                </div>

                {/* Senha */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Senha <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 h-12 text-sm px-4 pr-12 transition-all"
                      style={{
                        WebkitBoxShadow: '0 0 0 1000px rgb(15 23 42 / 0.5) inset',
                        WebkitTextFillColor: 'white'
                      }}
                      placeholder="Digite sua senha"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Padrão: Número do AP + Número da Torre (ex: 34 + 2 = 342)
                  </p>
                </div>



                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30">
                    <p className="text-sm text-red-300 font-medium">{error}</p>
                  </div>
                )}

                {/* Terms Checkbox */}
                <div className="flex items-start gap-3 p-4 bg-slate-900/30 border border-slate-700/50">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                    disabled={loading}
                  />
                  <label htmlFor="acceptTerms" className="text-xs text-slate-400 cursor-pointer leading-relaxed">
                    Concordo com os{' '}
                    <button
                      type="button"
                      className="text-cyan-400 hover:text-cyan-300 hover:underline font-medium"
                      onClick={() => setShowTermsModal(true)}
                    >
                      Termos de Uso
                    </button>
                    {' '}e{' '}
                    <button
                      type="button"
                      className="text-cyan-400 hover:text-cyan-300 hover:underline font-medium"
                      onClick={() => setShowPrivacyModal(true)}
                    >
                      Política de Privacidade
                    </button>
                    {' '}e autorizo o uso dos meus dados pessoais de acordo com a LGPD.
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !acceptedTerms}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3.5 px-6 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Entrando...
                    </span>
                  ) : (
                    'Entrar'
                  )}
                </button>

                {/* Manter conectado */}
                <div className="flex items-center justify-center mt-4">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-300 cursor-pointer hover:text-white transition-colors">
                    Manter conectado
                  </label>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

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

      {/* Developer Info */}
      <div className="pt-0">
        <div className="absolute bottom-4 right-4 text-right">
          <p className="text-xs text-slate-600 dark:text-slate-500">
            Desenvolvido por <span className="font-medium text-slate-500 dark:text-slate-400">Luis Marra</span>
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-500">
            <a href="tel:+5511953395665" className="hover:text-slate-400 transition-colors">
              (11) 95339-5665
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
