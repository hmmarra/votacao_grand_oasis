'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/TopBar'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Footer } from '@/components/Footer'
import { Sidebar } from '@/components/Sidebar'
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
      <div className="min-h-screen flex bg-transparent">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 w-full px-4 py-10">
            <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Pautas em Votação</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Confira abaixo as pautas disponíveis para o seu voto.
                </p>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                  <p className="text-red-400 mb-4">{error}</p>
                  <button
                    onClick={loadPautas}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm font-medium"
                  >
                    Tentar Novamente
                  </button>
                </div>
              ) : pautasLiberadas.length === 0 ? (
                <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-700/50 rounded-3xl p-12 text-center shadow-xl">
                  <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Nenhuma Votação Ativa</h3>
                  <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
                    No momento, não há pautas abertas para votação. Fique atento às notificações para saber quando novas assembleias forem iniciadas.
                  </p>
                  <div className="mt-8 flex justify-center gap-4">
                    <button
                      onClick={() => router.push('/resultados')}
                      className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-all border border-slate-700 hover:border-slate-500"
                    >
                      Ver Histórico
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {pautasLiberadas.map((pauta) => (
                    <div key={pauta.id} className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-700/50 rounded-3xl p-6 shadow-xl flex flex-col hover:border-emerald-500/30 transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -mr-16 -mt-16 blur-xl group-hover:bg-emerald-500/20 transition-all"></div>

                      {/* Status Badge */}
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                          Em Aberto
                        </span>
                        <span className="text-slate-500 text-xs font-medium">
                          Criada em {formatDate(pauta.createdAt)}
                        </span>
                      </div>

                      {/* Content */}
                      <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 relative z-10 group-hover:text-emerald-400 transition-colors">
                        {pauta.nomePauta}
                      </h3>

                      <div className="bg-slate-800/50 rounded-2xl p-4 mb-6 flex-1 border border-slate-700/30">
                        <p className="text-slate-400 text-sm line-clamp-4 leading-relaxed">
                          {pauta.descricao}
                        </p>
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => handleVotar(pauta.aba)}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group-hover:shadow-emerald-500/30"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Participar da Votação
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-4">
            <Footer />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

