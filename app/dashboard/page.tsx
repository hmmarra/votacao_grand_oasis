'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Footer } from '@/components/Footer'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/lib/auth'
import { api, Pauta } from '@/lib/api-config'

export default function DashboardPage() {
    const { user } = useAuth()
    const router = useRouter()

    const [stats, setStats] = useState({
        totalPautas: 0,
        userVotes: 0,
        userReformas: 0,
        userActiveReformas: 0,
        totalReformas: 0,
        activeReformas: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadStats() {
            if (!user) return

            try {
                // 1. Carregar pautas
                const pautas: Pauta[] = await api.getAllPautas()

                // 2. Carregar votos do usuário
                // Verifica se a função existe no objeto api (para compatibilidade com Google Sheets se necessário)
                let userVotesCount = 0
                if (api.getVotesByCpf) {
                    const votes = await api.getVotesByCpf(user.cpf)
                    userVotesCount = votes.length
                }

                if (api.getReformas) {
                    const reformas = await api.getReformas()
                    const userCpf = user.cpf.replace(/\D/g, '')

                    // Filtrar reformas do usuário
                    const myReformas = reformas.filter((r: any) => {
                        const rCpf = (r.cpf || r.moradorCpf || '').replace(/\D/g, '')
                        return rCpf === userCpf
                    })

                    // Filtrar reformas ativias do usuário
                    const myActiveReformas = myReformas.filter((r: any) => {
                        const s = (r.status || '').toLowerCase()
                        return s !== 'concluído' && s !== 'concluido' && s !== 'recusado' && s !== 'cancelado' && s !== 'vistoria aprovada'
                    })

                    // Todas as reformas (Admin)
                    const allActiveReformas = reformas.filter((r: any) => {
                        const s = (r.status || '').toLowerCase()
                        return s !== 'concluído' && s !== 'concluido' && s !== 'recusado' && s !== 'cancelado' && s !== 'vistoria aprovada'
                    })

                    setStats({
                        totalPautas: pautas.length,
                        userVotes: userVotesCount,
                        userReformas: myReformas.length,
                        userActiveReformas: myActiveReformas.length,
                        totalReformas: reformas.length,
                        activeReformas: allActiveReformas.length
                    })
                }

            } catch (error) {
                console.error('Erro ao carregar estatísticas:', error)
            } finally {
                setLoading(false)
            }
        }

        loadStats()
    }, [user])

    // Saudação baseada na hora do dia
    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Bom dia'
        if (hour < 18) return 'Boa tarde'
        return 'Boa noite'
    }

    const firstName = user?.nome?.split(' ')[0] || 'Morador'

    // Definir se o usuário tem privilégios de visualização de todas as reformas
    const isAdmin = user?.acesso === 'Administrador' || user?.acesso === 'Engenharia' || user?.acesso === 'Desenvolvedor' || user?.isMaster
    const isPrivilegedUser = isAdmin

    return (
        <ProtectedRoute>
            <div className="min-h-screen flex bg-transparent">
                <Sidebar />

                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex-1 w-full px-4 pt-24 lg:pt-10 pb-10">
                        <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-6">

                            {/* Header Section */}
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 py-2 border-b border-slate-700/50 pb-8">
                                <div className="space-y-2">
                                    <h1 className="text-2xl sm:text-4xl font-bold text-slate-800 dark:text-white tracking-tight leading-tight">
                                        {getGreeting()}, <br className="sm:hidden" />
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                                            {firstName}
                                        </span>
                                    </h1>
                                    <div className="flex flex-col gap-1">
                                        <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-sm sm:text-base font-medium">
                                            <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4" />
                                                </svg>
                                            </div>
                                            Painel do Condomínio &bull; {user?.apartamento} - Torre {user?.torre}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center sm:items-end gap-3 sm:text-right">
                                    <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl px-4 py-2 sm:bg-transparent sm:border-0 sm:p-0">
                                        <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-0.5">Data de Hoje</p>
                                        <p className="text-sm sm:text-base font-bold text-white capitalize">
                                            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                {/* Link para Votações (Feature Hero) */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Stats Grid Compact & Horizontal */}
                                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                                        {/* Card 1: Votações */}
                                        <div className="bg-[#0f172a]/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 shadow-lg relative overflow-hidden group hover:border-cyan-500/30 transition-all">
                                            <div className="absolute -right-6 -bottom-6 opacity-[0.03] transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                                                <svg className="w-24 h-24 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                                                </svg>
                                            </div>
                                            <div className="relative z-10 flex flex-col justify-between h-full gap-2">
                                                <div className="flex items-start justify-between">
                                                    <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center text-cyan-400">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-slate-400 text-xs font-bold mb-0.5">Votações</h3>
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className="text-2xl font-bold text-white tracking-tight">{loading ? '-' : stats.totalPautas}</span>
                                                        <span className="text-[10px] text-slate-500">ativas</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card 2: Minhas Participações */}
                                        <div className="bg-[#0f172a]/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                                            <div className="absolute -right-6 -bottom-6 opacity-[0.03] transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                                                <svg className="w-24 h-24 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                                </svg>
                                            </div>
                                            <div className="relative z-10 flex flex-col justify-between h-full gap-2">
                                                <div className="flex items-start justify-between">
                                                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-slate-400 text-xs font-bold mb-0.5">Meus Votos</h3>
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className="text-2xl font-bold text-white tracking-tight">{loading ? '-' : stats.userVotes}</span>
                                                        <span className="text-[10px] text-slate-500">feitos</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card 3: Minhas/Total Reformas */}
                                        <div className="bg-[#0f172a]/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 shadow-lg relative overflow-hidden group hover:border-orange-500/30 transition-all">
                                            <div className="absolute -right-6 -bottom-6 opacity-[0.03] transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                                                <svg className="w-24 h-24 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
                                                </svg>
                                            </div>
                                            <div className="relative z-10 flex flex-col justify-between h-full gap-2">
                                                <div className="flex items-start justify-between">
                                                    <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-400">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-slate-400 text-xs font-bold mb-0.5">
                                                        {isPrivilegedUser ? 'Total de Reformas' : 'Minhas Reformas'}
                                                    </h3>
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className="text-2xl font-bold text-white tracking-tight">
                                                            {loading ? '-' : (isPrivilegedUser ? stats.totalReformas : stats.userReformas)}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500">
                                                            {isPrivilegedUser ? 'no condomínio' : 'solicitadas'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card 4: Reformas Ativas */}
                                        <div className="bg-[#0f172a]/60 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 shadow-lg relative overflow-hidden group hover:border-purple-500/30 transition-all">
                                            <div className="absolute -right-6 -bottom-6 opacity-[0.03] transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                                                <svg className="w-24 h-24 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
                                                </svg>
                                            </div>
                                            <div className="relative z-10 flex flex-col justify-between h-full gap-2">
                                                <div className="flex items-start justify-between">
                                                    <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-slate-400 text-xs font-bold mb-0.5">
                                                        {isPrivilegedUser ? 'Reformas Ativas' : 'Minha Reforma Ativa'}
                                                    </h3>
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className="text-2xl font-bold text-white tracking-tight">
                                                            {loading ? '-' : (isPrivilegedUser ? stats.activeReformas : stats.userActiveReformas)}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500">
                                                            {isPrivilegedUser ? 'no prédio' : 'em andamento'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notifications Card */}
                                    <div className="bg-[#0f172a]/60 backdrop-blur-md border border-slate-700/50 rounded-3xl p-6 shadow-xl relative overflow-hidden flex-1">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                                Avisos do Condomínio
                                            </h3>
                                            <button className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">Ver todos</button>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/50 hover:bg-slate-700/40 transition-colors cursor-pointer group">
                                                <div className="flex gap-3">
                                                    <div className="text-center bg-slate-800 rounded-lg p-1.5 h-fit min-w-[50px]">
                                                        <span className="block text-[10px] text-slate-400 uppercase font-bold">JAN</span>
                                                        <span className="block text-lg font-bold text-white leading-none">25</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-slate-200 font-medium text-sm group-hover:text-cyan-400 transition-colors">Assembleia Geral Extraordinária</h4>
                                                        <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">Discussão sobre reformas da área externa e...</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/50 hover:bg-slate-700/40 transition-colors cursor-pointer group">
                                                <div className="flex gap-3">
                                                    <div className="text-center bg-slate-800 rounded-lg p-1.5 h-fit min-w-[50px]">
                                                        <span className="block text-[10px] text-slate-400 uppercase font-bold">HOJE</span>
                                                        <span className="block text-lg font-bold text-white leading-none">04</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-slate-200 font-medium text-sm group-hover:text-cyan-400 transition-colors">Manutenção Elevador Social</h4>
                                                        <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">Parada programada das 14h às 16h para...</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Quick Actions & Profile Summary */}
                                <div className="space-y-6">
                                    {/* Action Center - Now more visually appealing */}
                                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                                        <h3 className="text-xl font-bold mb-1 relative z-10">O que deseja fazer?</h3>
                                        <p className="text-blue-100 text-sm mb-6 relative z-10">Acesse rapidamente as principais funções.</p>

                                        <div className="grid grid-cols-1 gap-3 relative z-10">
                                            <button
                                                onClick={() => router.push('/pautas')}
                                                className="flex items-center gap-3 bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all border border-white/10 group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                </div>
                                                <div className="text-left">
                                                    <span className="block font-semibold text-sm">Votar Agora</span>
                                                    <span className="block text-[10px] text-blue-200 opacity-80">Participe das decisões</span>
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => router.push('/reformas')}
                                                className="flex items-center gap-3 bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all border border-white/10 group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                                                </div>
                                                <div className="text-left">
                                                    <span className="block font-semibold text-sm">Nova Reforma</span>
                                                    <span className="block text-[10px] text-blue-200 opacity-80">Solicite autorização</span>
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => router.push('/resultados')}
                                                className="flex items-center gap-3 bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all border border-white/10 group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                </div>
                                                <div className="text-left">
                                                    <span className="block font-semibold text-sm">Resultados</span>
                                                    <span className="block text-[10px] text-blue-200 opacity-80">Veja os placares</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* System Status Mini */}
                                    <div className="bg-[#0f172a]/60 backdrop-blur-md border border-slate-700/50 rounded-3xl p-6 shadow-xl">
                                        <h4 className="text-slate-400 text-xs font-bold uppercase mb-4 tracking-wider">Status do Sistema</h4>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                <span className="text-sm text-slate-300">Servidores</span>
                                            </div>
                                            <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                Online
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                <span className="text-sm text-slate-300">Banco de Dados</span>
                                            </div>
                                            <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                Conectado
                                            </span>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Footer Section */}
                            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-4">
                                <Footer />
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
