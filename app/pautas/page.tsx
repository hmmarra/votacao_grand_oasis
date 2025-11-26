'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/TopBar'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Footer } from '@/components/Footer'
import { api, Pauta, Placar } from '@/lib/api-config'

// Função para formatar datas do Firestore
const formatDate = (date: any): string => {
  if (!date) return 'N/A'
  
  try {
    let timestamp: Date
    
    // Se for um objeto Timestamp do Firestore
    if (date.seconds) {
      timestamp = new Date(date.seconds * 1000)
    } 
    // Se for um objeto com toDate (Timestamp do Firestore)
    else if (typeof date.toDate === 'function') {
      timestamp = date.toDate()
    }
    // Se já for uma Date
    else if (date instanceof Date) {
      timestamp = date
    }
    // Se for uma string ISO
    else if (typeof date === 'string') {
      timestamp = new Date(date)
    }
    else {
      return 'N/A'
    }
    
    return timestamp.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (err) {
    return 'N/A'
  }
}

export default function PautasPage() {
  const router = useRouter()
  const [allPautas, setAllPautas] = useState<Pauta[]>([])
  const [showBlocked, setShowBlocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [placares, setPlacares] = useState<Record<string, Placar>>({})

  useEffect(() => {
    loadPautas()
  }, [])

  const loadPautas = async () => {
    try {
      setLoading(true)
      setError(null)
      const data: Pauta[] = await api.getAllPautas()
      setAllPautas(data)
      
      // Carregar placares para todas as pautas
      const placaresData: Record<string, Placar> = {}
      await Promise.all(
        data.map(async (pauta: Pauta) => {
          try {
            const placar = await api.getScores(pauta.aba)
            placaresData[pauta.aba] = placar
          } catch (err) {
            // Se não houver votos ainda, criar placar vazio
            placaresData[pauta.aba] = { counts: {}, total: 0 }
          }
        })
      )
      setPlacares(placaresData)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar pautas')
    } finally {
      setLoading(false)
    }
  }

  // Separar pautas por status
  const pautasLiberadas = allPautas.filter(p => p.status === 'Votação Liberada')
  const pautasBloqueadas = allPautas.filter(p => p.status === 'Votação Bloqueada')
  const pautasPlanejadas = allPautas.filter(p => p.status === 'Votação Planejada')

  const handleVotar = (aba: string) => {
    router.push(`/votacao?tipo=${encodeURIComponent(aba)}`)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
        <TopBar />
        <div className="flex-1 py-6 sm:py-10 px-3 sm:px-4">
          <div className="max-w-6xl mx-auto">
            {/* Título e Toggle */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Pautas para Votação</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Selecione uma pauta para votar</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Mostrar bloqueadas</span>
                    <div className="relative inline-block">
                      <input
                        type="checkbox"
                        checked={showBlocked}
                        onChange={(e) => setShowBlocked(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors flex items-center ${
                        showBlocked ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                          showBlocked ? 'translate-x-5' : 'translate-x-0.5'
                        }`}></div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-violet-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando pautas...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && pautasLiberadas.length === 0 && (!showBlocked || (pautasBloqueadas.length === 0 && pautasPlanejadas.length === 0)) && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">Nenhuma pauta disponível para votação no momento.</p>
          </div>
        )}

        {/* Seção: Votação Liberada */}
        {!loading && !error && pautasLiberadas.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Votação Liberada
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pautasLiberadas.map((pauta: Pauta, index: number) => (
                <div
                  key={pauta.id || index}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full"
                >
                  {/* Topo - Título - 2 linhas com truncate - Altura fixa para alinhamento */}
                  <div className="p-4 pb-3 border-b border-gray-200 dark:border-gray-700 h-[4.5rem] flex items-start">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 leading-tight line-clamp-2">
                      {pauta.nomePauta}
                    </h3>
                  </div>
                  
                  {/* Body - Descrição e Opções */}
                  <div className="flex-1 p-4 pt-3 flex flex-col">
                    {/* Descrição - 2 linhas com truncate - Altura fixa para alinhamento */}
                    <div className="mb-3 h-[3rem] flex items-start">
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {pauta.descricao}
                      </p>
                    </div>
                    
                    {/* Opções - Mostrar apenas a opção com mais votos - Altura fixa para alinhamento */}
                    <div className="mb-3 h-[3.5rem] flex flex-col justify-center">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Opções disponíveis:</p>
                      {(() => {
                        const placar = placares[pauta.aba]
                        const opcoesComVotos = pauta.opcoes.map((opcao: string) => ({
                          opcao,
                          votos: placar?.counts[opcao] || 0
                        }))
                        // Encontrar a opção com mais votos
                        const opcaoMaisVotada = opcoesComVotos.reduce((max: { opcao: string; votos: number }, item: { opcao: string; votos: number }) => 
                          item.votos > max.votos ? item : max, 
                          opcoesComVotos[0] || { opcao: '', votos: 0 }
                        )
                        // Calcular total de votos para a porcentagem
                        const totalVotos = opcoesComVotos.reduce((sum: number, item: { opcao: string; votos: number }) => sum + item.votos, 0)
                        const porcentagem = totalVotos > 0 ? (opcaoMaisVotada.votos / totalVotos) * 100 : 0
                        
                        return (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 font-medium">
                                {opcaoMaisVotada.opcao}
                              </span>
                              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                {opcaoMaisVotada.votos} {opcaoMaisVotada.votos === 1 ? 'voto' : 'votos'}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-violet-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${porcentagem}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>

                    {/* Informações de Data - 2 linhas - Altura fixa para alinhamento */}
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 h-[3.5rem] flex flex-col justify-center">
                      <div className="space-y-1">
                        {pauta.createdAt && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                              <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v16.5l-7.72 4.036a.75.75 0 0 1-1.06-1.06L11.25 18v-15a.75.75 0 0 1 .75-.75Z" clipRule="evenodd"/>
                            </svg>
                            <span>Criada em: {formatDate(pauta.createdAt)}</span>
                          </div>
                        )}
                        {pauta.updatedAt && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                              <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v16.5l-7.72 4.036a.75.75 0 0 1-1.06-1.06L11.25 18v-15a.75.75 0 0 1 .75-.75Z" clipRule="evenodd"/>
                            </svg>
                            <span>Atualizada em: {formatDate(pauta.updatedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer - Botão */}
                  <div className="p-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleVotar(pauta.aba)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 text-sm font-medium transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M2.25 12c0-2.248 0-4.122.116-5.527.119-1.44.36-2.527 1.035-3.388.676-.86 1.63-1.354 3.098-1.79C7.98.854 9.81.56 12 .56c2.19 0 4.019.294 5.501.736 1.469.436 2.422.93 3.098 1.79.676.861.916 1.948 1.035 3.388.116 1.405.116 3.279.116 5.527 0 2.248 0 4.123-.116 5.528-.119 1.44-.36 2.527-1.035 3.387-.676.862-1.63 1.356-3.098 1.792-1.482.441-3.311.735-5.501.735-2.19 0-4.02-.294-5.501-.735-1.469-.436-2.422-.93-3.098-1.792-.676-.86-.916-1.947-1.035-3.387C2.25 16.123 2.25 14.248 2.25 12Zm12.53-2.03a.75.75 0 0 0-1.06-1.06L11 11.62l-.72-.72a.75.75 0 1 0-1.06 1.06l1.25 1.25a.75.75 0 0 0 1.06 0l3.25-3.25Z" clipRule="evenodd"/>
                      </svg>
                      Votar Agora
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seção: Votação Planejada */}
        {!loading && !error && showBlocked && pautasPlanejadas.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Votação Planejada
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pautasPlanejadas.map((pauta: Pauta, index: number) => (
                <div
                  key={pauta.id || index}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg opacity-75 flex flex-col h-full border-2 border-blue-200 dark:border-blue-800"
                >
                  {/* Topo - Título - 2 linhas com truncate - Altura fixa para alinhamento */}
                  <div className="p-4 pb-3 border-b border-gray-200 dark:border-gray-700 h-[4.5rem] flex items-start">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 leading-tight line-clamp-2">
                      {pauta.nomePauta}
                    </h3>
                  </div>
                  
                  {/* Body - Descrição e Opções */}
                  <div className="flex-1 p-4 pt-3 flex flex-col">
                    {/* Descrição - 2 linhas com truncate - Altura fixa para alinhamento */}
                    <div className="mb-3 h-[3rem] flex items-start">
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {pauta.descricao}
                      </p>
                    </div>
                    
                    {/* Opções - Mostrar apenas a opção com mais votos - Altura fixa para alinhamento */}
                    <div className="mb-3 h-[3.5rem] flex flex-col justify-center">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Opções disponíveis:</p>
                      {(() => {
                        const placar = placares[pauta.aba]
                        const opcoesComVotos = pauta.opcoes.map((opcao: string) => ({
                          opcao,
                          votos: placar?.counts[opcao] || 0
                        }))
                        // Encontrar a opção com mais votos
                        const opcaoMaisVotada = opcoesComVotos.reduce((max: { opcao: string; votos: number }, item: { opcao: string; votos: number }) => 
                          item.votos > max.votos ? item : max, 
                          opcoesComVotos[0] || { opcao: '', votos: 0 }
                        )
                        // Calcular total de votos para a porcentagem
                        const totalVotos = opcoesComVotos.reduce((sum: number, item: { opcao: string; votos: number }) => sum + item.votos, 0)
                        const porcentagem = totalVotos > 0 ? (opcaoMaisVotada.votos / totalVotos) * 100 : 0
                        
                        return (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium">
                                {opcaoMaisVotada.opcao}
                              </span>
                              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                {opcaoMaisVotada.votos} {opcaoMaisVotada.votos === 1 ? 'voto' : 'votos'}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${porcentagem}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>

                    {/* Informações de Data - 2 linhas - Altura fixa para alinhamento */}
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 h-[3.5rem] flex flex-col justify-center">
                      <div className="space-y-1">
                        {pauta.createdAt && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                              <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v16.5l-7.72 4.036a.75.75 0 0 1-1.06-1.06L11.25 18v-15a.75.75 0 0 1 .75-.75Z" clipRule="evenodd"/>
                            </svg>
                            <span>Criada em: {formatDate(pauta.createdAt)}</span>
                          </div>
                        )}
                        {pauta.updatedAt && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                              <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v16.5l-7.72 4.036a.75.75 0 0 1-1.06-1.06L11.25 18v-15a.75.75 0 0 1 .75-.75Z" clipRule="evenodd"/>
                            </svg>
                            <span>Atualizada em: {formatDate(pauta.updatedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer - Botão */}
                  <div className="p-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleVotar(pauta.aba)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 text-sm font-medium transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M2.25 12c0-2.248 0-4.122.116-5.527.119-1.44.36-2.527 1.035-3.388.676-.86 1.63-1.354 3.098-1.79C7.98.854 9.81.56 12 .56c2.19 0 4.019.294 5.501.736 1.469.436 2.422.93 3.098 1.79.676.861.916 1.948 1.035 3.388.116 1.405.116 3.279.116 5.527 0 2.248 0 4.123-.116 5.528-.119 1.44-.36 2.527-1.035 3.387-.676.862-1.63 1.356-3.098 1.792-1.482.441-3.311.735-5.501.735-2.19 0-4.02-.294-5.501-.735-1.469-.436-2.422-.93-3.098-1.792-.676-.86-.916-1.947-1.035-3.387C2.25 16.123 2.25 14.248 2.25 12Zm12.53-2.03a.75.75 0 0 0-1.06-1.06L11 11.62l-.72-.72a.75.75 0 1 0-1.06 1.06l1.25 1.25a.75.75 0 0 0 1.06 0l3.25-3.25Z" clipRule="evenodd"/>
                      </svg>
                      Ver Pauta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seção: Votação Bloqueada */}
        {!loading && !error && showBlocked && pautasBloqueadas.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Votação Bloqueada
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pautasBloqueadas.map((pauta: Pauta, index: number) => (
                <div
                  key={pauta.id || index}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg opacity-75 flex flex-col h-full border-2 border-red-200 dark:border-red-800"
                >
                  {/* Topo - Título - 2 linhas com truncate - Altura fixa para alinhamento */}
                  <div className="p-4 pb-3 border-b border-gray-200 dark:border-gray-700 h-[4.5rem] flex items-start">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 leading-tight line-clamp-2">
                      {pauta.nomePauta}
                    </h3>
                  </div>
                  
                  {/* Body - Descrição e Opções */}
                  <div className="flex-1 p-4 pt-3 flex flex-col">
                    {/* Descrição - 2 linhas com truncate - Altura fixa para alinhamento */}
                    <div className="mb-3 h-[3rem] flex items-start">
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {pauta.descricao}
                      </p>
                    </div>
                    
                    {/* Opções - Mostrar apenas a opção com mais votos - Altura fixa para alinhamento */}
                    <div className="mb-3 h-[3.5rem] flex flex-col justify-center">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Opções disponíveis:</p>
                      {(() => {
                        const placar = placares[pauta.aba]
                        const opcoesComVotos = pauta.opcoes.map((opcao: string) => ({
                          opcao,
                          votos: placar?.counts[opcao] || 0
                        }))
                        // Encontrar a opção com mais votos
                        const opcaoMaisVotada = opcoesComVotos.reduce((max: { opcao: string; votos: number }, item: { opcao: string; votos: number }) => 
                          item.votos > max.votos ? item : max, 
                          opcoesComVotos[0] || { opcao: '', votos: 0 }
                        )
                        // Calcular total de votos para a porcentagem
                        const totalVotos = opcoesComVotos.reduce((sum: number, item: { opcao: string; votos: number }) => sum + item.votos, 0)
                        const porcentagem = totalVotos > 0 ? (opcaoMaisVotada.votos / totalVotos) * 100 : 0
                        
                        return (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium">
                                {opcaoMaisVotada.opcao}
                              </span>
                              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                {opcaoMaisVotada.votos} {opcaoMaisVotada.votos === 1 ? 'voto' : 'votos'}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${porcentagem}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>

                    {/* Informações de Data - 2 linhas - Altura fixa para alinhamento */}
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 h-[3.5rem] flex flex-col justify-center">
                      <div className="space-y-1">
                        {pauta.createdAt && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                              <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v16.5l-7.72 4.036a.75.75 0 0 1-1.06-1.06L11.25 18v-15a.75.75 0 0 1 .75-.75Z" clipRule="evenodd"/>
                            </svg>
                            <span>Criada em: {formatDate(pauta.createdAt)}</span>
                          </div>
                        )}
                        {pauta.updatedAt && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                              <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v16.5l-7.72 4.036a.75.75 0 0 1-1.06-1.06L11.25 18v-15a.75.75 0 0 1 .75-.75Z" clipRule="evenodd"/>
                            </svg>
                            <span>Atualizada em: {formatDate(pauta.updatedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer - Botão */}
                  <div className="p-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleVotar(pauta.aba)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 text-white px-4 py-2 hover:bg-red-700 text-sm font-medium transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M2.25 12c0-2.248 0-4.122.116-5.527.119-1.44.36-2.527 1.035-3.388.676-.86 1.63-1.354 3.098-1.79C7.98.854 9.81.56 12 .56c2.19 0 4.019.294 5.501.736 1.469.436 2.422.93 3.098 1.79.676.861.916 1.948 1.035 3.388.116 1.405.116 3.279.116 5.527 0 2.248 0 4.123-.116 5.528-.119 1.44-.36 2.527-1.035 3.387-.676.862-1.63 1.356-3.098 1.792-1.482.441-3.311.735-5.501.735-2.19 0-4.02-.294-5.501-.735-1.469-.436-2.422-.93-3.098-1.792-.676-.86-.916-1.947-1.035-3.387C2.25 16.123 2.25 14.248 2.25 12Zm12.53-2.03a.75.75 0 0 0-1.06-1.06L11 11.62l-.72-.72a.75.75 0 1 0-1.06 1.06l1.25 1.25a.75.75 0 0 0 1.06 0l3.25-3.25Z" clipRule="evenodd"/>
                      </svg>
                      Ver Pauta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}

