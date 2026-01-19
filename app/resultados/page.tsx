'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Footer } from '@/components/Footer'
import { useAuth } from '@/lib/auth'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Pauta } from '@/lib/api-config'

interface VoteResult {
    pauta: Pauta
    userVote: string | null
    timestamp: any | null
}

export default function ResultadosPage() {
    const { user, loading: authLoading } = useAuth()
    const [results, setResults] = useState<VoteResult[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !user.cpf || !db) return

            try {
                setLoading(true)

                // 1. Buscar todas as pautas
                const pautasRef = collection(db, 'pautas')
                const pautasSnapshot = await getDocs(pautasRef)
                const pautas = pautasSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Pauta))

                // 2. Buscar votos do usuário
                const votesRef = collection(db, 'votos')
                // O CPF deve estar normalizado no banco
                const q = query(votesRef, where('cpf', '==', user.cpf))
                const votesSnapshot = await getDocs(q)

                const userVotes = new Map<string, { voto: string, timestamp: any }>()
                votesSnapshot.docs.forEach(doc => {
                    const data = doc.data()
                    // A chave é o tipoVotacao, que corresponde ao campo 'aba' da pauta
                    if (data.tipoVotacao) {
                        userVotes.set(data.tipoVotacao, {
                            voto: data.voto,
                            timestamp: data.timestamp
                        })
                    }
                })

                // 3. Combinar dados
                const combinedResults: VoteResult[] = pautas.map(pauta => ({
                    pauta,
                    userVote: userVotes.get(pauta.aba)?.voto || null,
                    timestamp: userVotes.get(pauta.aba)?.timestamp || null
                }))

                setResults(combinedResults)
            } catch (error) {
                console.error("Erro ao carregar resultados:", error)
            } finally {
                setLoading(false)
            }
        }

        if (!authLoading && user) {
            fetchData()
        } else if (!authLoading && !user) {
            // Se não estiver logado, o ProtectedRoute ou redirecionamento deve acontecer, 
            // mas por segurança paramos o loading
            setLoading(false)
        }
    }, [user, authLoading])

    if (authLoading) return null

    return (
        <div className="min-h-screen flex bg-transparent">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 w-full px-4 pt-24 lg:pt-10 pb-10">
                    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-6">

                        <div className="mb-2">
                            <h1 className="text-3xl font-bold text-white mb-2">Histórico de Votações</h1>
                            <p className="text-slate-400">Acompanhe as pautas e verifique seus votos registrados.</p>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                            </div>
                        ) : results.length === 0 ? (
                            <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-700/50 rounded-3xl p-12 text-center">
                                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Nenhuma pauta encontrada</h3>
                                <p className="text-slate-400">Não há registros de votações no momento.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {results.map((result, index) => (
                                    <div
                                        key={result.pauta.id || index}
                                        className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-700/50 rounded-3xl p-6 shadow-xl flex flex-col transition-all hover:border-cyan-500/30 group"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`
                                                px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                                ${result.pauta.status === 'Votação Liberada'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'}
                                            `}>
                                                {result.pauta.status}
                                            </div>

                                            {result.userVote && (
                                                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center" title="Computado">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2" title={result.pauta.nomePauta}>
                                            {result.pauta.nomePauta}
                                        </h3>

                                        <div className="bg-slate-800/50 rounded-xl p-3 mb-4 flex-1">
                                            <p className="text-slate-400 text-sm line-clamp-3">
                                                {result.pauta.descricao}
                                            </p>
                                        </div>

                                        <div className="mt-auto">
                                            {result.userVote ? (
                                                <div className="bg-cyan-900/20 border border-cyan-500/20 rounded-xl p-4">
                                                    <p className="text-cyan-200/60 text-xs font-semibold uppercase tracking-wider mb-1">
                                                        Seu voto
                                                    </p>
                                                    <p className="text-white font-bold text-lg">
                                                        {result.userVote}
                                                    </p>
                                                    {result.timestamp && (
                                                        <p className="text-cyan-500/40 text-[10px] mt-1">
                                                            Registrado em: {new Date(result.timestamp?.seconds * 1000).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="bg-slate-800/30 border border-dashed border-slate-700 rounded-xl p-4 text-center">
                                                    <p className="text-slate-500 text-sm">
                                                        Você não participou desta votação
                                                    </p>
                                                </div>
                                            )}
                                        </div>
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
    )
}
