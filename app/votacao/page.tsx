'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TopBar } from '@/components/TopBar'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Footer } from '@/components/Footer'
import { useAuth } from '@/lib/auth'
import { api, VotingConfig, VoterStatus, Placar } from '@/lib/api-config'

function VotacaoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tipo = searchParams.get('tipo') || ''
  const { user, loading: authLoading } = useAuth()
  
  const [config, setConfig] = useState<VotingConfig | null>(null)
  const [voter, setVoter] = useState<VoterStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [placar, setPlacar] = useState<Placar | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingVote, setPendingVote] = useState<string | null>(null)
  const [pautaStatus, setPautaStatus] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.push('/login')
      return
    }

    if (tipo && user.cpf) {
      loadVotingData()
    }
  }, [tipo, user, authLoading, router])

  const loadVotingData = async () => {
    if (!user?.cpf || !tipo) return
    
    try {
      setLoading(true)
      setMessage(null)
      
      // Carregar a pauta completa para verificar o status
      const pauta = await api.getPautaByAba(tipo)
      setPautaStatus(pauta.status)
      
      // Carregar configuração
      const votingConfig = await api.getVotingConfig(tipo)
      setConfig(votingConfig)
      
      // Tentar carregar status do votante (pode falhar se não estiver na lista de moradores)
      try {
        const voterStatus = await api.getVoterStatus(user.cpf, tipo)
        setVoter(voterStatus)
        
        // Sempre carregar placar
        loadPlacar()
      } catch (voterErr: any) {
        // Se falhar ao buscar status, criar um status básico com dados do usuário
        setVoter({
          nome: user.nome,
          apartamento: user.apartamento,
          torre: user.torre,
          votou: false,
          voto: null
        })
        // Carregar placar mesmo assim
        loadPlacar()
      }
    } catch (err: any) {
      setMessage({ text: 'Erro ao carregar dados da votação: ' + err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleVote = (voto: string) => {
    if (!user?.cpf) {
      setMessage({ text: 'Erro: dados do usuário não encontrados.', type: 'error' })
      return
    }

    // Verificar se o usuário é mestre (não pode votar)
    if (user.isMaster) {
      setMessage({ 
        text: 'Usuários mestres não podem votar. Você pode apenas acompanhar a votação.', 
        type: 'error' 
      })
      return
    }

    // Verificar se a votação está liberada
    if (pautaStatus && pautaStatus !== 'Votação Liberada') {
      setMessage({ 
        text: pautaStatus === 'Votação Planejada' 
          ? 'Esta votação está planejada e ainda não está disponível para votação.' 
          : 'Esta votação está bloqueada e não está disponível para votação.', 
        type: 'error' 
      })
      return
    }

    // Abrir modal de confirmação
    setPendingVote(voto)
    setShowConfirmModal(true)
  }

  const confirmVote = async () => {
    if (!user?.cpf || !pendingVote) {
      return
    }

    // Verificar se o usuário é mestre (não pode votar)
    if (user.isMaster) {
      setMessage({ 
        text: 'Usuários mestres não podem votar. Você pode apenas acompanhar a votação.', 
        type: 'error' 
      })
      setShowConfirmModal(false)
      setPendingVote(null)
      return
    }

    // Verificar novamente se a votação está liberada antes de confirmar
    if (pautaStatus && pautaStatus !== 'Votação Liberada') {
      setMessage({ 
        text: pautaStatus === 'Votação Planejada' 
          ? 'Esta votação está planejada e ainda não está disponível para votação.' 
          : 'Esta votação está bloqueada e não está disponível para votação.', 
        type: 'error' 
      })
      setShowConfirmModal(false)
      setPendingVote(null)
      return
    }

    const voto = pendingVote
    const isEditing = voter?.votou

    try {
      setLoading(true)
      setMessage(null)
      setShowConfirmModal(false)
      
      await api.saveVote(user.cpf, voto, tipo)
      
      setMessage({ 
        text: isEditing 
          ? `Voto alterado com sucesso para "${voto}"!` 
          : 'Voto registrado com sucesso!', 
        type: 'success' 
      })
      
      // Recarregar dados do votante para atualizar o estado
      const updatedStatus = await api.getVoterStatus(user.cpf, tipo)
      setVoter(updatedStatus)
      
      // Carregar placar após votar
      await loadPlacar()
    } catch (err: any) {
      setMessage({ text: 'Erro ao registrar voto: ' + err.message, type: 'error' })
    } finally {
      setLoading(false)
      setPendingVote(null)
    }
  }

  const cancelVote = () => {
    setShowConfirmModal(false)
    setPendingVote(null)
  }

  const loadPlacar = async () => {
    try {
      const data = await api.getScores(tipo)
      setPlacar(data)
    } catch (err: any) {
      setMessage({ text: 'Erro ao carregar placar: ' + err.message, type: 'error' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
        <TopBar />
        <div className="flex-1 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                {config ? `Formulário de Votação: ${config.titulo}` : 'Formulário de Votação'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user ? `Olá, ${user.nome.split(' ')[0]}! Selecione sua opção de voto abaixo.` : 'Carregando...'}
              </p>
            </div>

            {/* Botão Voltar - Apenas em mobile */}
            <div className="mb-8 sm:hidden">
              <button
                onClick={() => router.push('/pautas')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 text-white px-6 py-3 hover:bg-violet-700 text-base font-semibold shadow-lg transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M19.5 12a.75.75 0 0 1-.75.75H7.31l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 1 1 1.06 1.06l-3.22 3.22h11.44c.414 0 .75.336.75.75Z" clipRule="evenodd"/>
                </svg>
                Voltar para Pautas
              </button>
            </div>

            {/* Message */}
            {config && (
          <div className="mb-8 rounded-2xl border border-indigo-100 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-900/20 p-6 sm:p-8 text-indigo-900 dark:text-indigo-100">
            <div className="text-sm font-medium mb-2">Criado por: <span className="font-semibold">Grand Oasis Poá</span></div>
            {config.descricao && (
              <p className="mt-2 text-sm leading-relaxed font-medium">{config.descricao}</p>
            )}
            <p className="mt-2 text-sm leading-relaxed">
              Este formulário foi elaborado exclusivamente para a votação a ser realizada na <strong>Assembleia Geral</strong> conforme edital de convocação oficial. Sua validade restringe-se ao dia e horário da referida assembleia, conforme registrados em ata.
            </p>
            <p className="mt-2 text-xs text-indigo-800 dark:text-indigo-200">
              Votos emitidos fora do horário estipulado para a assembleia ou em desacordo com as normas estabelecidas não serão considerados válidos.
            </p>
          </div>
        )}

            {/* Loading State */}
            {(authLoading || (loading && !voter && !config)) && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mb-6"></div>
                <p className="text-lg text-gray-600 dark:text-gray-400">Carregando dados da votação...</p>
              </div>
            )}

            {/* Form */}
            {!authLoading && config && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10">
            {voter && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                  <input
                    type="text"
                    value={voter.nome || user?.nome || '-'}
                    readOnly
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-white h-12 text-base px-4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apartamento</label>
                  <input
                    type="text"
                    value={voter.apartamento || user?.apartamento || '-'}
                    readOnly
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-white h-12 text-base px-4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Torre</label>
                  <input
                    type="text"
                    value={voter.torre || user?.torre || '-'}
                    readOnly
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-white h-12 text-base px-4"
                  />
                </div>
              </div>
            )}

            {/* Voting Options - Mostrar apenas se votação estiver liberada e usuário não for mestre */}
            {config && pautaStatus === 'Votação Liberada' && !user?.isMaster && (
              <div className="mb-8">
                <p className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-6">
                  {voter?.votou ? `Você votou em "${voter.voto}". Altere sua opção (se necessário):` : 'Escolha sua opção de voto:'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  {config.candidatos.map((candidato: string, index: number) => {
                    const isSelected = voter?.votou && voter?.voto === candidato
                    return (
                      <button
                        key={index}
                        onClick={() => handleVote(candidato)}
                        disabled={loading}
                        className={`p-6 sm:p-8 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 ${
                          isSelected
                            ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/30'
                            : 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 hover:border-indigo-500 dark:hover:border-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {isSelected && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="currentColor">
                              <path fillRule="evenodd" d="M2.25 12c0-2.248 0-4.122.116-5.527.119-1.44.36-2.527 1.035-3.388.676-.86 1.63-1.354 3.098-1.79C7.98.854 9.81.56 12 .56c2.19 0 4.019.294 5.501.736 1.469.436 2.422.93 3.098 1.79.676.861.916 1.948 1.035 3.388.116 1.405.116 3.279.116 5.527 0 2.248 0 4.123-.116 5.528-.119 1.44-.36 2.527-1.035 3.387-.676.862-1.63 1.356-3.098 1.792-1.482.441-3.311.735-5.501.735-2.19 0-4.02-.294-5.501-.735-1.469-.436-2.422-.93-3.098-1.792-.676-.86-.916-1.947-1.035-3.387C2.25 16.123 2.25 14.248 2.25 12Zm12.53-2.03a.75.75 0 0 0-1.06-1.06L11 11.62l-.72-.72a.75.75 0 1 0-1.06 1.06l1.25 1.25a.75.75 0 0 0 1.06 0l3.25-3.25Z" clipRule="evenodd"/>
                            </svg>
                          )}
                          <span className={`text-lg sm:text-xl font-semibold ${
                            isSelected 
                              ? 'text-green-700 dark:text-green-300' 
                              : 'text-gray-800 dark:text-gray-100'
                          }`}>
                            {candidato}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Mensagem quando usuário é mestre */}
            {config && user?.isMaster && (
              <div className="mb-8 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center gap-3 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd"/>
                  </svg>
                  <p className="text-base font-semibold text-blue-800 dark:text-blue-200">
                    Modo Acompanhamento
                  </p>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Como usuário mestre, você pode apenas acompanhar a votação e visualizar o placar. Não é possível votar.
                </p>
              </div>
            )}

            {/* Mensagem quando votação não está liberada */}
            {config && pautaStatus && pautaStatus !== 'Votação Liberada' && !user?.isMaster && (
              <div className="mb-8 p-6 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                <div className="flex items-center gap-3 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd"/>
                  </svg>
                  <p className="text-base font-semibold text-amber-800 dark:text-amber-200">
                    {pautaStatus === 'Votação Planejada' 
                      ? 'Votação Planejada' 
                      : 'Votação Bloqueada'}
                  </p>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {pautaStatus === 'Votação Planejada'
                    ? 'Esta votação está planejada e ainda não está disponível para votação. Você pode visualizar o placar abaixo, mas não é possível votar no momento.'
                    : 'Esta votação está bloqueada e não está disponível para votação. Você pode visualizar o placar abaixo, mas não é possível votar.'}
                </p>
              </div>
            )}

            {/* Placar - Sempre visível */}
            {config && (
              <div className="mb-8 p-6 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-6">
                  <p className="block text-base font-semibold text-gray-700 dark:text-gray-300">Placar em Tempo Real</p>
                  <button
                    onClick={loadPlacar}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                  >
                    Atualizar
                  </button>
                </div>
                {placar && placar.total > 0 ? (
                  <>
                    <div className="space-y-4">
                      {Object.entries(placar.counts || {}).map(([option, count]: [string, any]) => {
                        const pct = placar.total > 0 ? Math.round((count / placar.total) * 100) : 0
                        return (
                          <div key={option} className="mb-4">
                            <div className="flex justify-between text-base mb-2">
                              <span className="text-gray-700 dark:text-gray-300 font-medium">{option}</span>
                              <span className="text-gray-600 dark:text-gray-400 font-semibold">{count} votos ({pct}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                              <div
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <p className="mt-6 text-base font-semibold text-gray-700 dark:text-gray-300 text-center">
                      Total de votos: <span className="text-indigo-600 dark:text-indigo-400">{placar.total}</span>
                    </p>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">Ainda não há votos registrados.</p>
                    <button
                      onClick={loadPlacar}
                      className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                    >
                      Atualizar placar
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Message */}
            {message && (
              <div className={`mt-6 p-4 rounded-xl ${
                message.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
              }`}>
                <p className="text-base font-medium">{message.text}</p>
              </div>
            )}
          </div>
        )}

            {/* Modal de Confirmação */}
            {showConfirmModal && pendingVote && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M2.25 12c0-2.248 0-4.122.116-5.527.119-1.44.36-2.527 1.035-3.388.676-.86 1.63-1.354 3.098-1.79C7.98.854 9.81.56 12 .56c2.19 0 4.019.294 5.501.736 1.469.436 2.422.93 3.098 1.79.676.861.916 1.948 1.035 3.388.116 1.405.116 3.279.116 5.527 0 2.248 0 4.123-.116 5.528-.119 1.44-.36 2.527-1.035 3.387-.676.862-1.63 1.356-3.098 1.792-1.482.441-3.311.735-5.501.735-2.19 0-4.02-.294-5.501-.735-1.469-.436-2.422-.93-3.098-1.792-.676-.86-.916-1.947-1.035-3.387C2.25 16.123 2.25 14.248 2.25 12Zm12.53-2.03a.75.75 0 0 0-1.06-1.06L11 11.62l-.72-.72a.75.75 0 1 0-1.06 1.06l1.25 1.25a.75.75 0 0 0 1.06 0l3.25-3.25Z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                      Confirmar Voto
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {voter?.votou 
                        ? `Você já votou em "${voter?.voto}". Deseja alterar seu voto para "${pendingVote}"?`
                        : `Confirma seu voto para "${pendingVote}"?`
                      }
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <button
                      onClick={cancelVote}
                      disabled={loading}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-5 py-3 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmVote}
                      disabled={loading}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white px-5 py-3 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium transition-all"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          Processando...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M2.25 12c0-2.248 0-4.122.116-5.527.119-1.44.36-2.527 1.035-3.388.676-.86 1.63-1.354 3.098-1.79C7.98.854 9.81.56 12 .56c2.19 0 4.019.294 5.501.736 1.469.436 2.422.93 3.098 1.79.676.861.916 1.948 1.035 3.388.116 1.405.116 3.279.116 5.527 0 2.248 0 4.123-.116 5.528-.119 1.44-.36 2.527-1.035 3.387-.676.862-1.63 1.356-3.098 1.792-1.482.441-3.311.735-5.501.735-2.19 0-4.02-.294-5.501-.735-1.469-.436-2.422-.93-3.098-1.792-.676-.86-.916-1.947-1.035-3.387C2.25 16.123 2.25 14.248 2.25 12Zm12.53-2.03a.75.75 0 0 0-1.06-1.06L11 11.62l-.72-.72a.75.75 0 1 0-1.06 1.06l1.25 1.25a.75.75 0 0 0 1.06 0l3.25-3.25Z" clipRule="evenodd"/>
                          </svg>
                          Confirmar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
  )
}

export default function VotacaoPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
          <TopBar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mb-6"></div>
              <p className="text-lg text-gray-600 dark:text-gray-400">Carregando...</p>
            </div>
          </div>
          <Footer />
        </div>
      }>
        <VotacaoContent />
      </Suspense>
    </ProtectedRoute>
  )
}

