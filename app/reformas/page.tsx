'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Sidebar } from '@/components/Sidebar'
import { Footer } from '@/components/Footer'
import { useAuth } from '@/lib/auth'
import { api, Reforma, Morador } from '@/lib/api-config'
import { Zap, Hammer, Paintbrush, Grid, Droplets, Wind, AppWindow, Layers, Camera, FileText, Calendar, User, Clock, Trash2, X, Plus, Image as ImageIcon, Download, ChevronLeft, ChevronRight, Search, Check, ChevronDown, AlertCircle } from 'lucide-react'
import VistoriaModal from './VistoriaModal'
import { notifyNewReformaMessage, notifyAdminsNewMessage } from '@/lib/notifications-api'
import ReformaDetailsModalNew from './ReformaDetailsModal'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

// Tipos para Notificação
type NotificationType = 'success' | 'error' | 'info'
interface NotificationState {
    open: boolean
    type: NotificationType
    message: string
}

function NotificationModal({ open, type, message, onClose }: { open: boolean, type: NotificationType, message: string, onClose: () => void }) {
    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 transform scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 
                        ${type === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
                            type === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' :
                                'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'}`}>
                        {type === 'success' && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        {type === 'error' && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>}
                        {type === 'info' && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                        {type === 'success' ? 'Sucesso!' : type === 'error' ? 'Atenção' : 'Informação'}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        {message}
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                    >
                        Entendi
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function ReformasPage() {
    const { user } = useAuth()
    const [reformas, setReformas] = useState<Reforma[]>([])
    const [moradores, setMoradores] = useState<Morador[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('Todas')
    const [showModal, setShowModal] = useState(false)
    const [selectedReforma, setSelectedReforma] = useState<Reforma | null>(null)
    const [editingReformaId, setEditingReformaId] = useState<string | null>(null)
    const [originalData, setOriginalData] = useState<Reforma | null>(null)
    const [saving, setSaving] = useState(false)
    const [notification, setNotification] = useState<NotificationState>({ open: false, type: 'info', message: '' })
    const [docsExpanded, setDocsExpanded] = useState(false)
    const [statusExpanded, setStatusExpanded] = useState(false)

    const showNotification = (type: NotificationType, message: string) => {
        setNotification({ open: true, type, message })
    }

    // Form States
    const [formData, setFormData] = useState<Partial<Reforma>>({
        tipoObra: 'Apartamento',
        servicos: [],
        dataInicio: '',
        dataFim: '',
        artRrt: '',
        empresa: '',
        cnpjPrestador: '',
        funcionarios: [],
        observacoes: '' // Initial observation empty
    })

    // Checkbox options based on user requirements
    const servicosOptions = [
        'Elétrica', 'Gesso', 'Pintura',
        'Retirada de Piso/Azulejo', 'Instalação de Piso/Azulejo',
        'Hidráulica (Área Úmida/Seca)', 'Ar Condicionado', 'Envidraçamento de Sacada'
    ]

    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    // Sync URL -> State (Deep Linking & Back Button)
    useEffect(() => {
        if (loading || reformas.length === 0) return

        const artParam = searchParams.get('art')

        if (artParam) {
            // Only update if not already selected to avoid fighting with the other effect
            if (selectedReforma?.artRrt !== artParam) {
                const found = reformas.find(r => r.artRrt === artParam)
                if (found) {
                    setSelectedReforma(found)
                }
            }
        } else {
            // Only clear if currently selected to avoid redundant updates
            if (selectedReforma) {
                setSelectedReforma(null)
            }
        }
        // We exclude selectedReforma from deps to avoid loop, we only want to react to URL/Data changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, reformas, loading])

    // Sync State -> URL (User Interaction)
    useEffect(() => {
        if (loading) return

        const currentArt = searchParams.get('art')

        if (selectedReforma?.artRrt) {
            if (currentArt !== selectedReforma.artRrt) {
                // Use replace instead of push to avoid cluttering history if rapid changes, 
                // but push is usually better for "navigation" feel. 
                // To avoid loop, we must be sure this only runs when USER changes state.
                router.push(`${pathname}?art=${encodeURIComponent(selectedReforma.artRrt)}`)
            }
        } else {
            if (currentArt) {
                router.push(pathname)
            }
        }
    }, [selectedReforma, pathname, router]) // Removed searchParams to avoid reacting to URL changes induced by this effect

    useEffect(() => {
        if (!user?.cpf) return

        if (api.subscribeToReformas) {
            setLoading(true)
            const isAdmin = user.acesso === 'Administrador' || user.acesso === 'Engenharia' || user.acesso === 'Desenvolvedor' || user.isMaster

            if (isAdmin && api.getAllMoradores) {
                api.getAllMoradores().then(setMoradores).catch(console.error)
            }

            const unsubscribe = api.subscribeToReformas(isAdmin, user.cpf, (data: Reforma[]) => {
                // Ordenar por data de criação (mais recente primeiro)
                data.sort((a, b) => {
                    const timeA = a.updatedAt?.seconds || a.createdAt?.seconds || 0
                    const timeB = b.updatedAt?.seconds || b.createdAt?.seconds || 0
                    return timeB - timeA
                })
                setReformas(data)
                setLoading(false)
            })
            return () => unsubscribe()
        } else {
            loadReformas()
        }
    }, [user])

    // Update selectedReforma when the list updates
    useEffect(() => {
        if (selectedReforma) {
            const updated = reformas.find(r => r.id === selectedReforma.id)
            if (updated) {
                setSelectedReforma(updated)
            }
        }
    }, [reformas])

    const loadReformas = async () => {
        if (!user?.cpf) return
        try {
            setLoading(true)
            let data: Reforma[] = []

            if (user.acesso === 'Administrador' || user.acesso === 'Engenharia' || user.acesso === 'Desenvolvedor' || user.isMaster) {
                // Se for administrador, busca todas as reformas
                data = await api.getReformas()
            } else {
                // Se for morador, busca apenas as suas
                data = await api.getReformasByUser(user.cpf)
            }

            // Ordenar por data de criação (mais recente primeiro)
            data.sort((a, b) => {
                const timeA = a.updatedAt?.seconds || a.createdAt?.seconds || 0
                const timeB = b.updatedAt?.seconds || b.createdAt?.seconds || 0
                return timeB - timeA
            })

            setReformas(data)
        } catch (error) {
            console.error('Erro ao carregar reformas:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleServiceChange = (service: string) => {
        setFormData(prev => {
            const services = prev.servicos || []
            if (services.includes(service)) {
                return { ...prev, servicos: services.filter(s => s !== service) }
            } else {
                return { ...prev, servicos: [...services, service] }
            }
        })
    }

    const handleEditReforma = (reforma: Reforma) => {
        setEditingReformaId(reforma.id || null)
        setOriginalData(reforma)
        setFormData({
            tipoObra: reforma.tipoObra,
            servicos: reforma.servicos || [],
            dataInicio: reforma.dataInicio,
            dataFim: reforma.dataFim,
            artRrt: reforma.artRrt || '',
            empresa: reforma.empresa || '',
            cnpjPrestador: reforma.cnpjPrestador || '',
            funcionarios: reforma.funcionarios || [],
            anexos: reforma.anexos || [],
            observacoes: ''
        })
        setSelectedReforma(null)
        setShowModal(true)
    }

    const handleDeleteReforma = async (id: string) => {
        try {
            await api.deleteReforma(id)
            showNotification('success', 'Reforma excluída com sucesso!')

            // Reload list if not using subscription
            if (!api.subscribeToReformas) {
                loadReformas()
            }
        } catch (error: any) {
            console.error('Erro ao excluir reforma:', error)
            showNotification('error', 'Erro ao excluir reforma: ' + (error.message || 'Erro desconhecido'))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        // Validações de Segurança (Backend-like)
        if (!formData.dataInicio || !formData.dataFim) {
            showNotification('error', 'As datas de início e previsão de fim são obrigatórias.')
            return
        }
        if (!formData.servicos || formData.servicos.length === 0) {
            showNotification('error', 'Selecione pelo menos um serviço para a reforma.')
            return
        }
        if (!formData.artRrt || !formData.empresa || !formData.cnpjPrestador) {
            showNotification('error', 'Todos os campos do Responsável Técnico são obrigatórios.')
            return
        }
        if (!formData.anexos || formData.anexos.length === 0) {
            showNotification('error', 'O anexo da ART/RRT é obrigatório.')
            return
        }

        try {
            setSaving(true)
            // Comparar mudanças para gerar mensagem automática
            let systemMsg = ''
            if (editingReformaId && originalData) {
                const changes: string[] = []

                // ART/RRT
                if (originalData.artRrt !== formData.artRrt) {
                    changes.push(`ART/RRT: ${originalData.artRrt || 'N/A'} ➔ ${formData.artRrt || 'N/A'}`)
                }

                // Empresa
                if (originalData.empresa !== formData.empresa) {
                    changes.push(`Empresa: ${originalData.empresa || 'N/A'} ➔ ${formData.empresa || 'N/A'}`)
                }

                // Serviços
                const oldServicos = originalData.servicos || []
                const newServicos = formData.servicos || []
                const servicosAdicionados = newServicos.filter(s => !oldServicos.includes(s))
                const servicosRemovidos = oldServicos.filter(s => !newServicos.includes(s))

                if (servicosAdicionados.length > 0) changes.push(`Serviços incluídos: ${servicosAdicionados.join(', ')}`)
                if (servicosRemovidos.length > 0) changes.push(`Serviços removidos: ${servicosRemovidos.join(', ')}`)

                // Cronograma
                if (originalData.dataInicio !== formData.dataInicio || originalData.dataFim !== formData.dataFim) {
                    changes.push(`Cronograma e datas alterados`)
                }

                // Anexos
                const oldAnexos = originalData.anexos || []
                const newAnexos = formData.anexos || []
                const anexosAdicionados = newAnexos.filter(a => !oldAnexos.includes(a))
                const anexosRemovidos = oldAnexos.filter(a => !newAnexos.includes(a))

                const formatFileName = (url: string) => url.split('/').pop()?.substring(14) || 'Arquivo'

                if (anexosAdicionados.length > 0) {
                    changes.push(`Anexos incluídos: ${anexosAdicionados.map(formatFileName).join(', ')}`)
                }
                if (anexosRemovidos.length > 0) {
                    changes.push(`Anexos removidos: ${anexosRemovidos.map(formatFileName).join(', ')}`)
                }

                if (changes.length > 0) {
                    systemMsg = `📋 Atualização Realizada:\n${changes.map(c => `• ${c}`).join('\n')}`
                } else {
                    systemMsg = `🔄 Solicitação reenviada sem alterações detectadas.`
                }
            }

            const payload: any = {
                moradorCpf: formData.moradorCpf || user.cpf,
                moradorId: formData.moradorId || user.id,
                moradorNome: formData.moradorNome || user.nome,
                apartamento: formData.apartamento || user.apartamento,
                torre: formData.torre || user.torre,
                email: formData.email || user.email || '',
                telefone: '',
                tipoObra: formData.tipoObra || 'Geral',
                servicos: formData.servicos || [],
                dataInicio: formData.dataInicio || '',
                dataFim: formData.dataFim || '',
                artRrt: formData.artRrt,
                empresa: formData.empresa,
                cnpjPrestador: formData.cnpjPrestador,
                funcionarios: formData.funcionarios || [],
                observacoes: '',
                anexos: formData.anexos || [],
                status: 'Em Análise'
            }

            // Se for edição, adiciona a mensagem de log no histórico
            if (editingReformaId && systemMsg) {
                const logMsg = {
                    id: crypto.randomUUID(),
                    data: new Date().toISOString(),
                    autor: user.nome,
                    texto: systemMsg,
                    isAdmin: false
                }
                payload.mensagens = [...(originalData?.mensagens || []), logMsg]
            }

            if (editingReformaId) {
                await api.updateReforma(editingReformaId, payload)
            } else {
                await api.createReforma(payload)
            }

            // Reset and reload
            setShowModal(false)
            setEditingReformaId(null)
            setOriginalData(null)
            setFormData({
                tipoObra: 'Apartamento',
                servicos: [],
                dataInicio: '',
                dataFim: '',
                artRrt: '',
                empresa: '',
                cnpjPrestador: '',
                funcionarios: [],
                observacoes: '',
                anexos: []
            })
            if (!api.subscribeToReformas) {
                await loadReformas()
            }
            showNotification('success', editingReformaId ? 'Solicitação atualizada com sucesso!' : 'Solicitação enviada com sucesso!')

        } catch (error: any) {
            console.error('Erro ao salvar reforma:', error)
            showNotification('error', error.message || 'Erro ao processar solicitação. Tente novamente.')
        } finally {
            setSaving(false)
        }
    }

    const filteredReformas = reformas.filter(r => {
        const matchesSearch = r.tipoObra.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.artRrt || '').toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'Todas' || r.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = {
            'Todas': reformas.length,
            'Em Análise': 0,
            'Aprovado': 0,
            'Reprovado': 0,
            'Aguardando Vistoria': 0,
            'Vistoria Aprovada': 0,
            'Vistoria Reprovada': 0,
            'Concluído': 0
        }
        reformas.forEach(r => {
            if (counts[r.status] !== undefined) {
                counts[r.status]++
            }
        })
        return counts
    }, [reformas])

    return (
        <ProtectedRoute>
            <div
                className="flex min-h-screen transition-all duration-300 font-sans"
            >
                <NotificationModal
                    open={notification.open}
                    type={notification.type}
                    message={notification.message}
                    onClose={() => setNotification({ ...notification, open: false })}
                />
                <div className="min-h-screen flex w-full bg-transparent">
                    <Sidebar />
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex-1 w-full px-4 pt-24 lg:pt-6">
                            <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-4">

                                {/* Header */}
                                <div className="mb-0">
                                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Gestão de Reformas</h1>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        Solicite autorização e acompanhe o andamento das obras da sua unidade.
                                    </p>
                                </div>

                                <div className="flex flex-col lg:flex-row gap-6">
                                    {/* Sidebar de Ações e Filtros */}
                                    <div className="w-full lg:w-64 flex-shrink-0">
                                        <div className="bg-slate-900/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-4 h-full flex flex-col">

                                            {/* CTA: Nova Solicitação */}
                                            <div className="space-y-3">
                                                <button
                                                    onClick={() => setShowModal(true)}
                                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl py-3 text-[11px] font-bold shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all">
                                                    Cadastrar Solicitação
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                                        <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>

                                            {/* Documentos */}
                                            <div className="pt-1 border-t border-slate-200 dark:border-slate-800">
                                                <button
                                                    onClick={() => setDocsExpanded(!docsExpanded)}
                                                    className="w-full flex items-center justify-between py-3 px-1 group"
                                                >
                                                    <h4 className="font-bold text-slate-800 dark:text-white text-xs flex items-center gap-2">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-500" viewBox="0 0 24 24" fill="currentColor">
                                                            <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5h-7.5Z" clipRule="evenodd" />
                                                            <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                                                        </svg>
                                                        Documentos
                                                    </h4>
                                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${docsExpanded ? 'rotate-180' : ''}`} />
                                                </button>

                                                {docsExpanded && (
                                                    <div className="space-y-1.5 pb-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <button className="w-full h-11 flex items-center justify-between px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xs text-slate-700 dark:text-slate-300 font-bold group border border-slate-200/50 dark:border-slate-700/50">
                                                            <span className="flex items-center gap-2.5">
                                                                <Download className="h-4 w-4 text-slate-400 group-hover:text-teal-500 transition-colors" />
                                                                Manual de Obras
                                                            </span>
                                                        </button>
                                                        <button className="w-full h-11 flex items-center justify-between px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xs text-slate-700 dark:text-slate-300 font-bold group border border-slate-200/50 dark:border-slate-700/50">
                                                            <span className="flex items-center gap-2.5">
                                                                <Download className="h-4 w-4 text-slate-400 group-hover:text-teal-500 transition-colors" />
                                                                Termo de Resp.
                                                            </span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Filtro Status */}
                                            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col">
                                                <button
                                                    onClick={() => setStatusExpanded(!statusExpanded)}
                                                    className="w-full flex items-center justify-between py-3 px-1 group"
                                                >
                                                    <h4 className="font-bold text-slate-800 dark:text-white text-xs flex items-center gap-2">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-500" viewBox="0 0 24 24" fill="currentColor">
                                                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                                                        </svg>
                                                        Status da Solicitação
                                                    </h4>
                                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${statusExpanded ? 'rotate-180' : ''}`} />
                                                </button>

                                                {statusExpanded && (
                                                    <div className="flex flex-col gap-1 pb-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        {['Todas', 'Em Análise', 'Aprovado', 'Reprovado', 'Aguardando Vistoria', 'Vistoria Aprovada', 'Vistoria Reprovada', 'Concluído'].map((status) => (
                                                            <label key={status} className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all group ${statusFilter === status ? 'bg-teal-500/10 dark:bg-teal-500/10 border border-teal-500/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent'}`}>
                                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${statusFilter === status ? 'border-teal-500' : 'border-slate-300 dark:border-slate-700 group-hover:border-slate-400'}`}>
                                                                    {statusFilter === status && <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>}
                                                                </div>
                                                                <div className="flex-1 flex justify-between items-center min-w-0">
                                                                    <span className={`text-[11px] font-bold truncate ${statusFilter === status ? 'text-teal-600 dark:text-teal-400' : 'text-slate-600 dark:text-slate-400'}`}>{status}</span>
                                                                    {(statusCounts[status] || 0) > 0 && (
                                                                        <span className={`text-[11px] font-black transition-colors ${statusFilter === status ? 'text-teal-500' : 'text-slate-400 dark:text-slate-500'}`}>
                                                                            {statusCounts[status]}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <input
                                                                    type="radio"
                                                                    name="status"
                                                                    value={status}
                                                                    checked={statusFilter === status}
                                                                    onChange={(e) => setStatusFilter(e.target.value)}
                                                                    className="hidden"
                                                                />
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lista Principal */}
                                    <div className="flex-1 min-w-0 flex flex-col gap-4">
                                        {/* Header: Busca - Fora da div escura */}
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Buscar por tipo, ART ou serviços..."
                                                className="block w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500/50 text-sm transition-all"
                                            />
                                        </div>

                                        <div className="bg-slate-900/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 h-[465px] overflow-y-auto custom-scrollbar flex flex-col">
                                            {/* Container Dinâmico */}
                                            <div className="pb-1">
                                                {/* Loading State */}
                                                {loading ? (
                                                    <div className="flex items-center justify-center py-20">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                                                    </div>
                                                ) : filteredReformas.length > 0 ? (
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {filteredReformas.map((reforma) => (
                                                            <div
                                                                key={reforma.id}
                                                                onClick={() => setSelectedReforma(reforma)}
                                                                className="bg-white dark:bg-slate-800 rounded-xl px-4 py-2 border border-transparent hover:border-teal-500/30 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                                            >
                                                                <div className="flex justify-between items-center mb-2 gap-4">
                                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
                                                                        <h3 className="font-bold text-slate-800 dark:text-white text-[13px] whitespace-nowrap">ART: {reforma.artRrt || 'Não informado'}</h3>
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="text-[11px] text-slate-500 truncate">
                                                                                {reforma.moradorNome} - Apt {reforma.apartamento} • Início: {reforma.dataInicio}
                                                                            </p>
                                                                            {reforma.dataFim && (
                                                                                <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-slate-200 dark:border-slate-800">
                                                                                    <Clock className="w-3 h-3 text-teal-500" />
                                                                                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                                                                        Fim: {reforma.dataFim}
                                                                                        {(() => {
                                                                                            const today = new Date();
                                                                                            today.setHours(0, 0, 0, 0);
                                                                                            const end = new Date(reforma.dataFim + 'T00:00:00');
                                                                                            const diff = end.getTime() - today.getTime();
                                                                                            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

                                                                                            if (days < 0) return <span className="ml-1 text-red-500">(Atrasada)</span>;
                                                                                            if (days === 0) return <span className="ml-1 text-amber-500">(Termina hoje)</span>;
                                                                                            return <span className="ml-1 text-teal-500">({days} dias restantes)</span>;
                                                                                        })()}
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider 
                                                                             ${reforma.status?.toLowerCase().includes('reprovad') ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                                                                                reforma.status?.toLowerCase().includes('aprovad') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                                                                    reforma.status?.toLowerCase().includes('concluíd') ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                                                                                        reforma.status?.toLowerCase().includes('vistoria') || reforma.status?.toLowerCase().includes('agendada') ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' :
                                                                                            reforma.status?.toLowerCase().includes('análise') ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                                                                                'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400'}`}>
                                                                            {reforma.status}
                                                                        </span>
                                                                    </div>

                                                                    {/* Delete button only for Desenvolvedor */}
                                                                    {user?.acesso === 'Desenvolvedor' && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                if (confirm('Tem certeza que deseja excluir esta reforma? Esta ação não pode ser desfeita.')) {
                                                                                    handleDeleteReforma(reforma.id!)
                                                                                }
                                                                            }}
                                                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                                            title="Excluir Reforma (Apenas Desenvolvedor)"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                    <div className="text-right flex-shrink-0 min-w-fit flex flex-col gap-0.5">
                                                                        <div className="flex items-center justify-end gap-1.5">
                                                                            <span className="text-[10px] font-black text-slate-400">S |</span>
                                                                            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                                                {reforma.createdAt?.seconds ? new Date(reforma.createdAt.seconds * 1000).toLocaleString('pt-BR', {
                                                                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                                                                    hour: '2-digit', minute: '2-digit'
                                                                                }) : '---'}
                                                                            </p>
                                                                        </div>
                                                                        {reforma.updatedAt && reforma.updatedAt?.seconds !== reforma.createdAt?.seconds && (
                                                                            <div className="flex items-center justify-end gap-1.5 border-t border-slate-100 dark:border-slate-800/50 pt-0.5">
                                                                                <span className="text-[10px] font-black text-teal-500/70">A |</span>
                                                                                <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400">
                                                                                    {new Date(reforma.updatedAt.seconds * 1000).toLocaleString('pt-BR', {
                                                                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                                                                        hour: '2-digit', minute: '2-digit'
                                                                                    })}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="flex flex-wrap gap-1.5 mb-1">
                                                                    {reforma.servicos?.map((servico, i) => {
                                                                        let colors = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                                                                        if (servico.includes('Elétrica')) colors = 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30'
                                                                        else if (servico.includes('Pintura')) colors = 'bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-500/30'
                                                                        else if (servico.includes('Hidráulica')) colors = 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30'
                                                                        else if (servico.includes('Piso')) colors = 'bg-stone-100 dark:bg-stone-500/20 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-500/30'
                                                                        else if (servico.includes('Gesso')) colors = 'bg-zinc-100 dark:bg-zinc-500/20 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-500/30'
                                                                        else if (servico.includes('Ar')) colors = 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/30'

                                                                        return (
                                                                            <span key={i} className={`px-2 py-0.5 text-[8px] rounded-md border ${colors}`}>
                                                                                {servico}
                                                                            </span>
                                                                        )
                                                                    })}
                                                                </div>

                                                                {
                                                                    reforma.observacoes && (
                                                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-xs mb-3">
                                                                            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Observações do Síndico:</p>
                                                                            <p className="text-slate-600 dark:text-slate-400">{reforma.observacoes}</p>
                                                                        </div>
                                                                    )
                                                                }
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    /* Lista Vazia (Empty State) */
                                                    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800/50 rounded-2xl p-12 text-center shadow-lg">
                                                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/50 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                                                                <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Nenhuma reforma encontrada</h3>
                                                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                                                            {searchTerm ? 'Não encontramos resultados para sua busca.' : 'Você ainda não possui solicitações de reforma registradas.'}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-4">
                            <Footer />
                        </div>
                    </div>
                </div >
            </div >

            {
                showModal && (
                    <ModalNovaSolicitacao
                        onClose={() => {
                            setShowModal(false)
                            setEditingReformaId(null)
                        }}
                        onSubmit={handleSubmit}
                        saving={saving}
                        formData={formData}
                        setFormData={setFormData}
                        handleServiceChange={handleServiceChange}
                        user={user}
                        moradores={moradores}
                        showNotification={showNotification}
                        isEditing={!!editingReformaId}
                    />
                )
            }

            {
                selectedReforma && (
                    <ReformaDetailsModalNew
                        reforma={selectedReforma}
                        onClose={() => setSelectedReforma(null)}
                        onUpdate={loadReformas}
                        onEdit={handleEditReforma}
                        user={user}
                        showNotification={showNotification}
                    />
                )
            }
        </ProtectedRoute >
    )
}

function ModalNovaSolicitacao({ onClose, onSubmit, saving, formData, setFormData, handleServiceChange, user, moradores = [], showNotification, isEditing }: any) {
    const isAdmin = user?.acesso === 'Administrador' || user?.isMaster
    const [activeSection, setActiveSection] = useState('detalhes')
    const [uploading, setUploading] = useState(false)
    const [artError, setArtError] = useState('')

    // Searchable Select State
    const [searchTerm, setSearchTerm] = useState('')
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const filteredMoradores = moradores
        .filter((m: any) => {
            if (!searchTerm) return true
            const searchLower = searchTerm.toLowerCase()
            return (
                m.nome.toLowerCase().includes(searchLower) ||
                m.apartamento.includes(searchLower) ||
                m.torre.toLowerCase().includes(searchLower)
            )
        })
        .sort((a: any, b: any) => {
            const aptA = parseInt(a.apartamento) || 0;
            const aptB = parseInt(b.apartamento) || 0;
            if (aptA !== aptB) return aptA - aptB;
            return a.torre.localeCompare(b.torre);
        })

    const validateStep = (sectionId: string) => {
        if (sectionId === 'detalhes') {
            if (!formData.dataInicio || !formData.dataFim) {
                showNotification('info', 'Por favor, preencha as datas de início e fim.')
                return false
            }
            if (!formData.servicos || formData.servicos.length === 0) {
                showNotification('info', 'Selecione pelo menos um serviço.')
                return false
            }
        }

        if (sectionId === 'prestador') {
            if (!formData.artRrt || !formData.empresa || !formData.cnpjPrestador) {
                showNotification('info', 'Todos os dados do Responsável Técnico são obrigatórios.')
                return false
            }
        }

        if (sectionId === 'documentos') {
            if (!formData.anexos || formData.anexos.length === 0) {
                showNotification('info', 'O anexo da ART/RRT é obrigatório.')
                return false
            }
        }

        return true
    }

    const handleNext = () => {
        const currentIndex = sections.findIndex(s => s.id === activeSection)
        if (validateStep(activeSection)) {
            setActiveSection(sections[currentIndex + 1].id)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return
        setUploading(true)

        const files = Array.from(e.target.files)
        const newAnexos = [...(formData.anexos || [])]

        for (const file of files) {
            const data = new FormData()
            data.append('file', file)

            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: data
                })
                const result = await res.json()

                if (result.success) {
                    newAnexos.push(result.key)
                } else {
                    showNotification('error', 'Falha no upload: ' + (result.error || 'Erro desconhecido'))
                }
            } catch (error) {
                console.error('Erro de upload:', error)
                showNotification('error', 'Erro ao enviar arquivo. Verifique sua conexão.')
            }
        }

        setFormData({ ...formData, anexos: newAnexos })
        setUploading(false)
        e.target.value = ''
    }

    const removeAnexo = (index: number) => {
        const newAnexos = [...(formData.anexos || [])]
        newAnexos.splice(index, 1)
        setFormData({ ...formData, anexos: newAnexos })
    }

    const sections = [
        {
            id: 'detalhes', label: 'Detalhes da Obra', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3h18v18H3zM12 8v8M8 12h8" />
                </svg>
            )
        },
        {
            id: 'prestador', label: 'Prestador / Empresa', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
            )
        },
        {
            id: 'documentos', label: 'Documentação', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
            )
        }
    ]

    const servicosOptions = [
        'Elétrica', 'Gesso', 'Pintura',
        'Retirada de Piso/Azulejo', 'Instalação de Piso/Azulejo',
        'Hidráulica (Área Úmida/Seca)', 'Ar Condicionado', 'Envidraçamento de Sacada'
    ]

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[110] md:p-6 p-0 font-sans animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 w-full md:max-w-4xl h-full md:h-[90vh] md:max-h-[750px] md:rounded-[32px] shadow-2xl border-x md:border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row overflow-hidden relative">

                {/* Sidebar / Stepper */}
                <div className="w-full md:w-1/4 md:min-w-[240px] bg-slate-50 dark:bg-slate-950/50 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-4 md:p-8 flex flex-col shrink-0">
                    <div className="mb-4 md:mb-8">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white leading-tight">
                            {isEditing ? 'Editar Solicitação' : 'Nova Solicitação'}
                        </h3>
                        <p className="text-[10px] font-bold text-teal-500 uppercase tracking-widest mt-1">
                            {isEditing ? 'Atualize os dados' : 'Passo a Passo'}
                        </p>
                    </div>

                    <nav className="flex md:flex-col gap-1 md:gap-3 overflow-x-auto no-scrollbar scroll-smooth">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                type="button"
                                onClick={() => {
                                    const targetIndex = sections.findIndex(s => s.id === section.id)
                                    const currentIndex = sections.findIndex(s => s.id === activeSection)

                                    if (targetIndex > currentIndex) {
                                        let canMove = true
                                        for (let i = currentIndex; i < targetIndex; i++) {
                                            if (!validateStep(sections[i].id)) {
                                                canMove = false
                                                break
                                            }
                                        }
                                        if (canMove) setActiveSection(section.id)
                                    } else {
                                        setActiveSection(section.id)
                                    }
                                }}
                                className={`flex-1 md:flex-none flex items-center gap-2 md:gap-4 px-3 md:px-5 py-2.5 md:py-4 text-[10px] md:text-xs font-bold uppercase md:capitalize tracking-wider md:tracking-normal rounded-xl transition-all duration-300 shrink-0 ${activeSection === section.id
                                    ? 'bg-teal-600 md:bg-teal-500/10 text-white md:text-teal-600 dark:text-teal-400 shadow-lg shadow-teal-600/20 md:shadow-none'
                                    : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <span className={activeSection === section.id ? 'text-white md:text-teal-600 dark:text-teal-400' : 'text-slate-400'}>
                                    {section.icon}
                                </span>
                                <span className="hidden sm:inline-block">{section.label}</span>
                                <span className="sm:hidden">{sections.findIndex(s => s.id === section.id) + 1}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="hidden md:block pt-8 border-t border-slate-200 dark:border-slate-800 mt-auto opacity-50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Portal de Reformas</p>
                        <p className="text-[10px] text-slate-500 mt-1">Preencha cada etapa com atenção.</p>
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 overflow-hidden">
                    {/* Desktop Close Button */}
                    <button
                        onClick={onClose}
                        className="hidden md:flex absolute top-8 right-8 p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all z-20"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12">
                        <form id="reformaForm" onSubmit={onSubmit} className="max-w-2xl mx-auto space-y-10">
                            {/* Inner form content remains largely the same, but wrapped in a container */}

                            {activeSection === 'detalhes' && (
                                <div className="space-y-6 animate-fadeIn">

                                    {isAdmin && !isEditing && (
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 relative z-20">
                                            <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">
                                                Selecione o Morador (Administrativo)
                                            </label>

                                            <div className="relative" ref={dropdownRef}>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={searchTerm}
                                                        onChange={(e) => {
                                                            setSearchTerm(e.target.value)
                                                            setDropdownOpen(true)
                                                            if (!e.target.value) {
                                                                // Clear selection if input is cleared manually? 
                                                                // Optional: setFormData({...formData, moradorId: '' ...})
                                                            }
                                                        }}
                                                        onFocus={() => setDropdownOpen(true)}
                                                        placeholder="Buscar por nome, apartamento ou torre..."
                                                        className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400"
                                                    />
                                                    <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />

                                                    {/* Clear or Dropdown Icon */}
                                                    {searchTerm || formData.moradorId ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSearchTerm('')
                                                                setFormData({
                                                                    ...formData,
                                                                    moradorId: '',
                                                                    moradorNome: '',
                                                                    moradorCpf: '',
                                                                    apartamento: '',
                                                                    torre: '',
                                                                    email: ''
                                                                })
                                                                setDropdownOpen(false)
                                                            }}
                                                            className="absolute right-3 top-3.5 text-slate-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                                                    )}
                                                </div>

                                                {dropdownOpen && (
                                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 custom-scrollbar animate-fadeIn">
                                                        {filteredMoradores.length > 0 ? (
                                                            filteredMoradores.map((m: any) => {
                                                                const label = `Apt ${m.apartamento} - Torre ${m.torre} | ${m.nome}`
                                                                const isSelected = formData.moradorId === m.id

                                                                return (
                                                                    <button
                                                                        key={m.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setFormData({
                                                                                ...formData,
                                                                                moradorId: m.id,
                                                                                moradorNome: m.nome,
                                                                                moradorCpf: m.cpf,
                                                                                apartamento: m.apartamento,
                                                                                torre: m.torre,
                                                                                email: m.email
                                                                            })
                                                                            setSearchTerm(label)
                                                                            setDropdownOpen(false)
                                                                        }}
                                                                        className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between border-b last:border-0 border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${isSelected ? 'bg-teal-50 dark:bg-teal-900/10 text-teal-700 dark:text-teal-400 font-bold' : 'text-slate-600 dark:text-slate-300'}`}
                                                                    >
                                                                        <span>
                                                                            <span className="font-bold text-slate-800 dark:text-slate-200">Apt {m.apartamento}</span>
                                                                            <span className="text-slate-400 mx-2">•</span>
                                                                            Torre {m.torre}
                                                                            <span className="text-slate-400 mx-2">|</span>
                                                                            {m.nome}
                                                                        </span>
                                                                        {isSelected && <Check className="w-4 h-4 text-teal-600" />}
                                                                    </button>
                                                                )
                                                            })
                                                        ) : (
                                                            <div className="px-4 py-4 text-center text-slate-500 dark:text-slate-400 text-sm italic">
                                                                Nenhum morador encontrado.
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Detalhes da Obra</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Especifique o tipo e período da reforma.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">


                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Data Início</label>
                                            <input
                                                type="date"
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm py-2.5 px-3 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                                                value={formData.dataInicio}
                                                onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Data Previsão Fim</label>
                                            <input
                                                type="date"
                                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm py-2.5 px-3 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                                                value={formData.dataFim}
                                                onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Serviços a serem realizados:</label>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {servicosOptions.map(option => {
                                                    const isSelected = (formData.servicos || []).includes(option)
                                                    return (
                                                        <label
                                                            key={option}
                                                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer gap-3 text-center h-28 group relative overflow-hidden ${isSelected
                                                                ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 shadow-sm'
                                                                : 'border-slate-200 dark:border-slate-700 hover:border-teal-200 dark:hover:border-teal-500/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                                                                }`}
                                                        >
                                                            <div className={`transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}>
                                                                {option === 'Elétrica' && <Zap className="w-6 h-6" />}
                                                                {option === 'Gesso' && <Layers className="w-6 h-6" />}
                                                                {option === 'Pintura' && <Paintbrush className="w-6 h-6" />}
                                                                {option === 'Retirada de Piso/Azulejo' && <Hammer className="w-6 h-6" />}
                                                                {option === 'Instalação de Piso/Azulejo' && <Grid className="w-6 h-6" />}
                                                                {option === 'Hidráulica (Área Úmida/Seca)' && <Droplets className="w-6 h-6" />}
                                                                {option === 'Ar Condicionado' && <Wind className="w-6 h-6" />}
                                                                {option === 'Envidraçamento de Sacada' && <AppWindow className="w-6 h-6" />}
                                                            </div>

                                                            <span className="text-xs font-semibold leading-tight">{option}</span>

                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={isSelected}
                                                                onChange={() => handleServiceChange(option)}
                                                            />

                                                            {isSelected && (
                                                                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
                                                            )}
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'prestador' && (
                                <div className="space-y-6 animate-fadeIn">
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Responsável Técnico</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Informe os dados da empresa ou profissional.</p>
                                    </div>

                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Número ART / RRT</label>
                                            <input
                                                type="text"
                                                className={`w-full rounded-lg border bg-white dark:bg-slate-800 text-sm py-2.5 px-3 focus:ring-2 transition-all placeholder:text-slate-400 ${artError
                                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                                    : 'border-slate-200 dark:border-slate-700 focus:ring-teal-500/20 focus:border-teal-500'
                                                    }`}
                                                value={formData.artRrt}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, artRrt: e.target.value })
                                                    if (artError) setArtError('') // Clear error on typing
                                                }}
                                                onBlur={async (e) => {
                                                    const val = e.target.value
                                                    if (val && api.checkArtExists) {
                                                        const exists = await api.checkArtExists(val)
                                                        if (exists) {
                                                            setArtError('Esta ART/RRT já está cadastrada no sistema.')
                                                        }
                                                    }
                                                }}
                                                placeholder="Ex: 12345678-9"
                                                required
                                            />
                                            {artError ? (
                                                <p className="text-xs text-red-500 mt-1 font-bold flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    {artError}
                                                </p>
                                            ) : (
                                                <p className="text-[10px] text-slate-400 mt-1">A Anotação de Responsabilidade Técnica é obrigatória.</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nome da Empresa / Profissional</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm py-2.5 px-3 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                                                    value={formData.empresa}
                                                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nº Registro CREA</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm py-2.5 px-3 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                                                    value={formData.cnpjPrestador}
                                                    onChange={(e) => setFormData({ ...formData, cnpjPrestador: e.target.value })}
                                                    placeholder="Registro: 5071108126-SP"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'documentos' && (
                                <div className="space-y-6 animate-fadeIn">
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Documentação</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Anexe os arquivos necessários.</p>
                                    </div>

                                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 rounded-xl p-5 text-center hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group relative overflow-hidden">
                                        <input
                                            type="file"
                                            multiple
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={handleFileUpload}
                                            disabled={uploading}
                                        />

                                        {uploading ? (
                                            <div className="flex flex-col items-center justify-center py-2">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500 mb-2"></div>
                                                <p className="text-xs text-slate-500">Enviando arquivos...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                                    <svg className="h-6 w-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                </div>
                                                <h5 className="text-sm font-bold text-slate-700 dark:text-white mb-0.5">Upload de Arquivos</h5>
                                                <p className="text-[10px] text-slate-500 mb-3">
                                                    Arraste e solte seus arquivos aqui ou <span className="text-teal-600 font-semibold underline">clique para selecionar</span>
                                                </p>
                                                <div className="flex justify-center gap-1.5">
                                                    <span className="px-2 py-0.5 bg-slate-200/50 dark:bg-slate-700 text-[9px] rounded text-slate-600 dark:text-slate-300 font-medium">ART / RRT</span>
                                                    <span className="px-2 py-0.5 bg-slate-200/50 dark:bg-slate-700 text-[9px] rounded text-slate-600 dark:text-slate-300 font-medium">Cronograma</span>
                                                    <span className="px-2 py-0.5 bg-slate-200/50 dark:bg-slate-700 text-[9px] rounded text-slate-600 dark:text-slate-300 font-medium">Memorial</span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Lista de Anexos */}
                                    {formData.anexos && formData.anexos.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            <h6 className="text-sm font-bold text-slate-700 dark:text-gray-300">Arquivos Anexados:</h6>
                                            {formData.anexos.map((anexo: string, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="bg-teal-100 dark:bg-teal-500/20 p-2 rounded-lg">
                                                            <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={anexo}>
                                                            {anexo.split('/').pop()?.substring(14) || anexo}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAnexo(idx)}
                                                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Remover arquivo"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                        </form>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 md:p-8 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex md:hidden items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500"
                        >
                            <X className="w-3 h-3" /> Cancelar
                        </button>

                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">
                            Etapa {sections.findIndex(s => s.id === activeSection) + 1} / {sections.length}
                        </div>

                        <div className="flex gap-3">
                            {sections.findIndex(s => s.id === activeSection) > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setActiveSection(sections[sections.findIndex(s => s.id === activeSection) - 1].id)}
                                    className="px-5 py-3 md:px-8 md:py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                                >
                                    Voltar
                                </button>
                            )}

                            {sections.findIndex(s => s.id === activeSection) < sections.length - 1 ? (
                                <button
                                    key="btn-next"
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handleNext()
                                    }}
                                    className="px-8 py-3 md:px-12 md:py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-teal-600/20 active:scale-95 transition-all"
                                >
                                    Próximo
                                </button>
                            ) : (
                                <button
                                    key="btn-submit"
                                    type="submit"
                                    form="reformaForm"
                                    disabled={saving || uploading}
                                    className="px-8 py-3 md:px-12 md:py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-teal-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95 transition-all"
                                >
                                    {(saving || uploading) && <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" src="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                    {uploading ? 'Enviando...' : (isEditing ? 'Atualizar' : 'Finalizar')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function ModalDetalhesReforma({ reforma, onClose, onUpdate, onEdit, user, showNotification }: any) {
    const isAdmin = user?.acesso === 'Administrador' || user?.isMaster
    const [newMessage, setNewMessage] = useState('')
    const [sendingMsg, setSendingMsg] = useState(false)
    const [showAdminActions, setShowAdminActions] = useState(false)
    const [messages, setMessages] = useState<any[]>(reforma.mensagens || [])
    const [usersTyping, setUsersTyping] = useState<string[]>(reforma.usersTyping || [])
    const [statusLoading, setStatusLoading] = useState(false)
    const [confirmStatus, setConfirmStatus] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'solicitacao' | 'vistoria'>('solicitacao')
    const [activeLightbox, setActiveLightbox] = useState<{ photos: string[], index: number } | null>(null)
    const [showVistoriaModal, setShowVistoriaModal] = useState(false)
    const [deleteVistoriaIndex, setDeleteVistoriaIndex] = useState<number | null>(null)

    // Vistoria Form State
    const [vistoriaForm, setVistoriaForm] = useState({
        data: new Date().toISOString().split('T')[0],
        responsavel: user?.nome || '',
        status: 'Aguardando Vistoria',
        observacoes: '',
        fotos: [] as string[]
    })
    const [uploadingVistoria, setUploadingVistoria] = useState(false)

    // Helper para garantir URL válida da imagem
    const getImageUrl = (urlOrKey: string) => {
        if (!urlOrKey) return ''
        if (urlOrKey.startsWith('http') || urlOrKey.startsWith('/api')) return urlOrKey
        return `/api/image/${encodeURIComponent(urlOrKey)}`
    }

    const handleVistoriaPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return
        setUploadingVistoria(true)
        const files = Array.from(e.target.files)
        const newFotos = [...vistoriaForm.fotos]

        for (const file of files) {
            const data = new FormData()
            data.append('file', file)
            try {
                const res = await fetch('/api/upload', { method: 'POST', body: data })
                const result = await res.json()
                if (result.success) {
                    newFotos.push(result.url || result.key)
                }
            } catch (error) { console.error('Erro de upload:', error) }
        }

        setVistoriaForm(prev => ({ ...prev, fotos: newFotos }))
        setUploadingVistoria(false)
    }

    const removeVistoriaPhoto = (index: number) => {
        setVistoriaForm(prev => ({
            ...prev,
            fotos: prev.fotos.filter((_, i) => i !== index)
        }))
    }

    const saveVistoria = async () => {
        if (!vistoriaForm.status) return

        try {
            setStatusLoading(true)
            const novaVistoria = {
                id: crypto.randomUUID(),
                data: new Date(vistoriaForm.data).toISOString(),
                status: vistoriaForm.status,
                observacoes: vistoriaForm.observacoes,
                fotos: vistoriaForm.fotos,
                usuario: vistoriaForm.responsavel || user.nome,
                timestamp: new Date().toISOString() // Para controlar o tempo de exclusão (1 hora)
            }

            const updatedVistorias = [novaVistoria, ...(reforma.vistorias || [])]

            // Também atualiza o status principal da reforma se for uma aprovação/reprovação
            let newReformaStatus = reforma.status
            if (vistoriaForm.status === 'Vistoria Aprovada') newReformaStatus = 'Vistoria Aprovada'
            if (vistoriaForm.status === 'Vistoria Reprovada') newReformaStatus = 'Vistoria Reprovada'

            await api.updateReforma(reforma.id, {
                vistorias: updatedVistorias,
                status: newReformaStatus
            })

            setVistoriaForm({
                data: new Date().toISOString().split('T')[0],
                responsavel: user?.nome || '',
                status: 'Aguardando Vistoria',
                observacoes: '',
                fotos: []
            })

            onUpdate()
            setShowVistoriaModal(false)
            showNotification('success', 'Vistoria registrada com sucesso!')
        } catch (error) {
            console.error('Erro ao salvar vistoria:', error)
            showNotification('error', 'Erro ao salvar vistoria')
        } finally {
            setStatusLoading(false)
        }
    }

    const deleteVistoria = async (vistoriaIndex: number) => {
        if (!isAdmin) {
            showNotification('error', 'Apenas administradores podem excluir vistorias')
            return
        }

        const vistoria = reforma.vistorias?.[vistoriaIndex]
        if (!vistoria) return

        // Verificar se a vistoria foi criada há menos de 1 hora
        const vistoriaTimestamp = vistoria.timestamp || vistoria.data
        const vistoriaDate = new Date(vistoriaTimestamp)
        const now = new Date()
        const diffInHours = (now.getTime() - vistoriaDate.getTime()) / (1000 * 60 * 60)

        if (diffInHours > 1) {
            showNotification('error', 'Vistorias só podem ser excluídas em até 1 hora após a criação')
            return
        }

        // Abrir modal de confirmação
        setDeleteVistoriaIndex(vistoriaIndex)
    }

    const confirmDeleteVistoria = async () => {
        if (deleteVistoriaIndex === null) return

        try {
            setStatusLoading(true)

            const updatedVistorias = reforma.vistorias.filter((_: any, idx: number) => idx !== deleteVistoriaIndex)

            await api.updateReforma(reforma.id, {
                vistorias: updatedVistorias
            })

            onUpdate()
            setDeleteVistoriaIndex(null)
            showNotification('success', 'Vistoria excluída com sucesso!')
        } catch (error) {
            console.error('Erro ao excluir vistoria:', error)
            showNotification('error', 'Erro ao excluir vistoria')
        } finally {
            setStatusLoading(false)
        }
    }

    const handleDownloadImages = async (vistoria: any, index: number) => {
        if (!vistoria.fotos || vistoria.fotos.length === 0) return

        try {
            const zip = new JSZip()
            const folder = zip.folder(`vistoria_${new Date(vistoria.data).toISOString().split('T')[0]}_${index + 1}`)

            const downloadPromises = vistoria.fotos.map(async (fotoUrl: string, idx: number) => {
                const response = await fetch(getImageUrl(fotoUrl))
                const blob = await response.blob()
                const extension = blob.type.split('/')[1] || 'jpg'
                folder?.file(`foto_${idx + 1}.${extension}`, blob)
            })

            await Promise.all(downloadPromises)

            const content = await zip.generateAsync({ type: 'blob' })
            saveAs(content, `vistoria_${reforma.apartamento}_${reforma.torre}_${new Date(vistoria.data).toISOString().split('T')[0]}.zip`)
            showNotification('success', 'Download iniciado!')
        } catch (error) {
            console.error('Erro ao baixar imagens:', error)
            showNotification('error', 'Erro ao preparar download das imagens')
        }
    }

    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Scroll to bottom of chat
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    useEffect(scrollToBottom, [messages])

    // Real-time subscription
    useEffect(() => {
        const unsubscribe = api.subscribeToReforma(reforma.id, (updatedReforma: Reforma) => {
            setMessages(updatedReforma.mensagens || [])
            setUsersTyping(updatedReforma.usersTyping || [])
        })
        return () => unsubscribe()
    }, [reforma.id])

    // Keyboard navigation for Lightbox
    useEffect(() => {
        if (!activeLightbox) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setActiveLightbox(null)
                return
            }

            if (e.key === 'ArrowLeft') {
                if (activeLightbox.index > 0) {
                    setActiveLightbox(prev => prev ? { ...prev, index: prev.index - 1 } : null)
                }
            } else if (e.key === 'ArrowRight') {
                if (activeLightbox.index < activeLightbox.photos.length - 1) {
                    setActiveLightbox(prev => prev ? { ...prev, index: prev.index + 1 } : null)
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [activeLightbox])

    const handleTyping = () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        } else {
            // Start typing
            api.setTypingStatus(reforma.id, user.nome, true)
        }

        typingTimeoutRef.current = setTimeout(() => {
            api.setTypingStatus(reforma.id, user.nome, false)
            typingTimeoutRef.current = null
        }, 3000)
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        try {
            setSendingMsg(true)
            const msg = {
                id: crypto.randomUUID(),
                data: new Date().toISOString(),
                autor: user.nome,
                texto: newMessage,
                isAdmin: isAdmin
            }
            const updatedMessages = [...messages, msg]
            setMessages(updatedMessages)
            setNewMessage('')

            await api.updateReforma(reforma.id, { mensagens: updatedMessages })

            // Enviar notificação
            try {
                // Se admin enviou, notifica o morador
                if (isAdmin) {
                    if (reforma.moradorCpf && reforma.moradorCpf !== user.cpf) {
                        await notifyNewReformaMessage(
                            reforma.moradorCpf,
                            reforma.id,
                            user.nome,
                            `Apt ${reforma.apartamento} - Torre ${reforma.torre}`
                        )
                    }
                }
                // Se morador enviou, notificar todos os admins
                else {
                    await notifyAdminsNewMessage(
                        reforma.id,
                        user.nome,
                        `Apt ${reforma.apartamento} - Torre ${reforma.torre}`
                    )
                }
            } catch (notifError) {
                console.error('Erro ao enviar notificação:', notifError)
                // Não bloqueia o envio da mensagem se a notificação falhar
            }

            onUpdate()
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error)
            showNotification('error', 'Erro ao enviar mensagem')
        } finally {
            setSendingMsg(false)
        }
    }

    const handleStatusChange = async (newStatus: string) => {
        setConfirmStatus(newStatus)
    }

    const confirmStatusChange = async () => {
        if (!confirmStatus) return
        try {
            setStatusLoading(true)
            await api.updateReforma(reforma.id, { status: confirmStatus as any })
            onUpdate() // Reload list
            onClose() // Close modal
        } catch (error) {
            console.error('Erro ao atualizar status:', error)
            showNotification('error', 'Erro ao atualizar status')
        } finally {
            setStatusLoading(false)
            setConfirmStatus(null)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-2 md:p-4 font-sans">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl h-[90vh] max-h-[750px] shadow-2xl border border-slate-200 dark:border-slate-800 flex overflow-hidden relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-[110] p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full transition-colors shadow-sm"
                    title="Fechar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                {/* Left Side: Details */}
                <div className="w-1/2 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800 flex flex-col">
                    <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                    Unidade {reforma.apartamento} <span className="text-slate-400 font-normal text-lg">- Torre {reforma.torre}</span>
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{reforma.moradorNome}</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider 
                                ${reforma.status === 'Aprovado' || reforma.status === 'Vistoria Aprovada' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                    reforma.status === 'Reprovado' || reforma.status === 'Vistoria Reprovada' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                                        reforma.status === 'Concluído' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                                            reforma.status === 'Aguardando Vistoria' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' :
                                                'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                                {reforma.status}
                            </span>
                        </div>

                        {!isAdmin && (reforma.status === 'Reprovado' || reforma.status === 'Vistoria Reprovada') && (
                            <button
                                onClick={() => onEdit(reforma)}
                                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-500/20"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                Editar e Reenviar Solicitação
                            </button>
                        )}

                        {/* Tab Selector */}
                        <div className="mt-6 flex gap-6 border-b border-slate-100 dark:border-slate-800/50 px-1">
                            <button
                                onClick={() => setActiveTab('solicitacao')}
                                className={`pb-2 text-xs font-bold flex items-center gap-2 transition-all border-b-2 ${activeTab === 'solicitacao'
                                    ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                Solicitação
                            </button>
                            <button
                                onClick={() => setActiveTab('vistoria')}
                                className={`pb-2 text-xs font-bold flex items-center gap-2 transition-all border-b-2 ${activeTab === 'vistoria'
                                    ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                                <Camera className="w-3.5 h-3.5" />
                                Vistoria
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5 custom-scrollbar">
                        {activeTab === 'solicitacao' ? (
                            <>
                                {/* Seção: Detalhes da Obra */}
                                <div className="space-y-3">
                                    <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                        Cronograma e Serviços
                                    </h4>
                                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-slate-400 font-semibold mb-1">DATA DE INÍCIO</span>
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                    {new Date(reforma.dataInicio).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-slate-400 font-semibold mb-1">PREVISÃO DE TÉRMINO</span>
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
                                                    {new Date(reforma.dataFim).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-semibold mb-2 block">ESCOPO DOS SERVIÇOS</span>
                                            <div className="flex flex-wrap gap-2">
                                                {reforma.servicos.map((servico: string) => {
                                                    let colors = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                                                    if (servico.includes('Elétrica')) colors = 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30'
                                                    else if (servico.includes('Pintura')) colors = 'bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-500/30'
                                                    else if (servico.includes('Hidráulica')) colors = 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30'
                                                    else if (servico.includes('Piso')) colors = 'bg-stone-100 dark:bg-stone-500/20 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-500/30'
                                                    else if (servico.includes('Gesso')) colors = 'bg-zinc-100 dark:bg-zinc-500/20 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-500/30'
                                                    else if (servico.includes('Ar')) colors = 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/30'

                                                    return (
                                                        <span key={servico} className={`px-2.5 py-1 text-[10px] font-medium rounded-md border ${colors}`}>
                                                            {servico}
                                                        </span>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Seção: Prestador */}
                                <div className="space-y-3">
                                    <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                        Responsável Técnico
                                    </h4>
                                    <div className="bg-white dark:bg-slate-800 rounded-xl p-0 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                        <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400 font-medium">Empresa / Profissional</p>
                                                <p className="text-sm font-bold text-slate-800 dark:text-white">{reforma.empresa}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-700/50">
                                            <div className="p-3 bg-slate-50/50 dark:bg-slate-800/50">
                                                <p className="text-[10px] text-slate-400 font-semibold mb-0.5">DOCUMENTO (CNPJ/CPF)</p>
                                                <p className="text-xs font-mono text-slate-600 dark:text-slate-300">{reforma.cnpjPrestador}</p>
                                            </div>
                                            <div className="p-3 bg-slate-50/50 dark:bg-slate-800/50">
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <p className="text-[10px] text-slate-400 font-semibold">REGISTRO (ART/RRT)</p>
                                                    <a
                                                        href="https://creanet1.creasp.org.br/ServicosOnLine/PesquisaPublicaART/PesquisaPublicaArt.aspx"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-[9px] text-teal-500 hover:text-teal-600 underline"
                                                        title="Consultar ART/RRT no site do CREA"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="11" cy="11" r="8"></circle>
                                                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                                        </svg>
                                                        Consultar
                                                    </a>
                                                </div>
                                                <p className="text-xs font-mono text-slate-600 dark:text-slate-300">{reforma.artRrt}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Seção: Documentos */}
                                {reforma.anexos && reforma.anexos.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                            Documentação Anexada
                                        </h4>
                                        <div className="space-y-2 pb-4">
                                            {reforma.anexos.map((url: string, idx: number) => {
                                                const fileName = url.split('/').pop()?.substring(14) || 'Arquivo'
                                                return (
                                                    <a
                                                        key={idx}
                                                        href={url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-teal-500/30 transition-all group shadow-sm"
                                                    >
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="bg-teal-100 dark:bg-teal-500/20 p-2 rounded-lg text-teal-600 dark:text-teal-400">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                            </div>
                                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate" title={fileName}>
                                                                {fileName}
                                                            </span>
                                                        </div>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 group-hover:text-teal-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M7 10l5 5 5-5M12 15V3" />
                                                        </svg>
                                                    </a>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="space-y-6">
                                {isAdmin && (
                                    <div className="mb-4">
                                        <button
                                            onClick={() => {
                                                setVistoriaForm({
                                                    data: new Date().toISOString().split('T')[0],
                                                    responsavel: user?.nome || '',
                                                    status: 'Aguardando Vistoria',
                                                    observacoes: '',
                                                    fotos: []
                                                })
                                                setShowVistoriaModal(true)
                                            }}
                                            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Registrar Nova Vistoria
                                        </button>
                                    </div>
                                )}

                                {/* DELETAR TUDO ATÉ A LINHA 1577 */}


                                {/* Histórico de Vistorias */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5" />
                                        Histórico
                                    </h4>

                                    {!reforma.vistorias || reforma.vistorias.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400">
                                            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                            <p className="text-xs">Nenhuma vistoria registrada.</p>
                                        </div>
                                    ) : (
                                        reforma.vistorias.map((vistoria: any, idx: number) => {
                                            // Calcular se pode deletar (menos de 1 hora)
                                            const vistoriaTimestamp = vistoria.timestamp || vistoria.data
                                            const vistoriaDate = new Date(vistoriaTimestamp)
                                            const now = new Date()
                                            const diffInHours = (now.getTime() - vistoriaDate.getTime()) / (1000 * 60 * 60)
                                            const canDelete = isAdmin && diffInHours <= 1

                                            return (
                                                <div key={idx} className="bg-white dark:bg-slate-800 border-l-4 border-slate-200 dark:border-slate-700 rounded-r-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs font-bold text-slate-700 dark:text-white flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3 text-slate-400" />
                                                                    {new Date(vistoria.data).toLocaleDateString()}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400">•</span>
                                                                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                                    <User className="w-3 h-3" />
                                                                    {vistoria.usuario}
                                                                </span>
                                                            </div>
                                                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider
                                                            ${vistoria.status.includes('Aprovada') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                                                    vistoria.status.includes('Reprovada') ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                                                                        vistoria.status.includes('Cancelada') ? 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400' :
                                                                            'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                                                                {vistoria.status}
                                                            </span>

                                                            {/* Data e hora de registro */}
                                                            {vistoria.timestamp && (
                                                                <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
                                                                    <Clock className="w-3 h-3" />
                                                                    <span>Registrado em {new Date(vistoria.timestamp).toLocaleString('pt-BR', {
                                                                        day: '2-digit',
                                                                        month: '2-digit',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}</span>
                                                                </div>
                                                            )}

                                                            {vistoria.observacoes && (
                                                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                                                                    {vistoria.observacoes}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {canDelete && (
                                                            <button
                                                                onClick={() => deleteVistoria(idx)}
                                                                className="ml-2 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                                title="Excluir vistoria (disponível por 1 hora)"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {vistoria.fotos && vistoria.fotos.length > 0 && (
                                                        <div className="mt-3">
                                                            <div className="flex justify-between items-end mb-2 px-1">
                                                                <span className="text-[10px] uppercase font-bold text-slate-400">
                                                                    {vistoria.fotos.length} {vistoria.fotos.length === 1 ? 'Foto' : 'Fotos'}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleDownloadImages(vistoria, idx)}
                                                                    className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-bold"
                                                                >
                                                                    <Download className="w-3 h-3" />
                                                                    Baixar Todas
                                                                </button>
                                                            </div>
                                                            <div className="relative group/carousel">
                                                                <button
                                                                    onClick={(e) => {
                                                                        const container = e.currentTarget.nextElementSibling
                                                                        if (container) container.scrollBy({ left: -200, behavior: 'smooth' })
                                                                    }}
                                                                    className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 z-10 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-black/70 disabled:opacity-0"
                                                                >
                                                                    <ChevronLeft className="w-4 h-4" />
                                                                </button>

                                                                <div className="flex gap-2 overflow-x-auto pb-3 pt-1 custom-scrollbar px-1 snap-x">
                                                                    {vistoria.fotos.map((foto: string, fIdx: number) => (
                                                                        <button
                                                                            key={fIdx}
                                                                            onClick={() => setActiveLightbox({ photos: vistoria.fotos, index: fIdx })}
                                                                            className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700 hover:ring-2 hover:ring-teal-500/50 transition-all snap-center relative group"
                                                                        >
                                                                            <img src={getImageUrl(foto)} alt="" className="w-full h-full object-cover" />
                                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                                                        </button>
                                                                    ))}
                                                                </div>

                                                                <button
                                                                    onClick={(e) => {
                                                                        const container = e.currentTarget.previousElementSibling
                                                                        if (container) container.scrollBy({ left: 200, behavior: 'smooth' })
                                                                    }}
                                                                    className="absolute right-0 top-1/2 -translate-y-1/2 -mr-2 z-10 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-black/70"
                                                                >
                                                                    <ChevronRight className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>




                {/* Right Side: Chat & History */}
                <div className="w-1/2 flex flex-col bg-white dark:bg-slate-900">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <h4 className="font-bold text-slate-700 dark:text-white flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-500" viewBox="0 0 24 24" fill="currentColor">
                                <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 0 0 6 21.75a6.721 6.721 0 0 0 3.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.701 6.162.245.236.489.467.63.784.098.217.164.453.2.693l.354 2.279a.75.75 0 0 1-.376.812Z" clipRule="evenodd" />
                            </svg>
                            Comentários e Atualizações
                        </h4>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-transparent custom-scrollbar">
                        {messages.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-sm">
                                <p>Nenhuma mensagem ainda.</p>
                                <p>Use este espaço para tirar dúvidas ou atualizar o status.</p>
                            </div>
                        ) : (
                            messages.map((msg: any) => (
                                <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${msg.isAdmin
                                        ? 'bg-teal-600 text-white rounded-tr-none'
                                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-tl-none'
                                        }`}>
                                        <p className="mb-1 whitespace-pre-wrap">{msg.texto}</p>
                                        <div className={`text-[10px] flex justify-between gap-4 ${msg.isAdmin ? 'text-teal-200' : 'text-slate-400'}`}>
                                            <span className="font-bold">{msg.autor}</span>
                                            <span>{new Date(msg.data).toLocaleDateString()} {new Date(msg.data).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                        {/* Typing Indicator */}
                        {usersTyping.filter(u => u !== user.nome).length > 0 && (
                            <div className="text-[10px] text-slate-400 italic mt-2 animate-pulse flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                                {usersTyping.filter(u => u !== user.nome).join(', ')} está digitando...
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative">
                        {/* Admin Actions Menu */}
                        {showAdminActions && isAdmin && (
                            <div className="absolute bottom-full left-0 right-0 p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-xl z-10 animate-in slide-in-from-bottom-2 fade-in duration-200">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ações Administrativas</h4>
                                    <button onClick={() => setShowAdminActions(false)} className="text-slate-400 hover:text-slate-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                    <button onClick={() => handleStatusChange('Aprovado')} disabled={statusLoading} className="px-2 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl text-[10px] font-bold transition-all">Aprovar</button>
                                    <button onClick={() => handleStatusChange('Reprovado')} disabled={statusLoading} className="px-2 py-2 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-xl text-[10px] font-bold transition-all">Reprovar</button>
                                    <button onClick={() => handleStatusChange('Em Análise')} disabled={statusLoading} className="px-2 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 rounded-xl text-[10px] font-bold transition-all">Em Análise</button>
                                    <button onClick={() => handleStatusChange('Aguardando Vistoria')} disabled={statusLoading} className="px-2 py-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 rounded-xl text-[10px] font-bold transition-all">Aguard. Vistoria</button>
                                    <button onClick={() => handleStatusChange('Vistoria Aprovada')} disabled={statusLoading} className="px-2 py-2 bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 rounded-xl text-[10px] font-bold transition-all">Vistoria Aprovada</button>
                                    <button onClick={() => handleStatusChange('Vistoria Reprovada')} disabled={statusLoading} className="px-2 py-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 rounded-xl text-[10px] font-bold transition-all">Vistoria Reprovada</button>
                                    <button onClick={() => handleStatusChange('Concluído')} disabled={statusLoading} className="col-span-2 lg:col-span-3 px-2 py-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 rounded-xl text-[10px] font-bold transition-all mt-1">Concluído</button>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            {isAdmin && (
                                <button
                                    type="button"
                                    onClick={() => setShowAdminActions(!showAdminActions)}
                                    className={`px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${showAdminActions ? 'bg-slate-100 dark:bg-slate-800 text-teal-500 dark:text-teal-500 border-teal-500/30' : ''}`}
                                    title="Ações Administrativas"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="7" height="7"></rect>
                                        <rect x="14" y="3" width="7" height="7"></rect>
                                        <rect x="14" y="14" width="7" height="7"></rect>
                                        <rect x="3" y="14" width="7" height="7"></rect>
                                    </svg>
                                </button>
                            )}
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value)
                                    handleTyping()
                                }}
                                placeholder="Digite uma mensagem..."
                                className="flex-1 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={sendingMsg || !newMessage.trim()}
                                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                                </svg>
                            </button>
                        </form>
                        <div className="flex justify-end mt-2">
                            {/* Removed text button */}
                        </div>
                    </div>
                </div>

                {/* Modal de Confirmação de Status */}
                {confirmStatus && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-fadeIn">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transform animate-scaleIn">
                            <div className="w-16 h-16 bg-teal-100 dark:bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-teal-600 dark:text-teal-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 dark:text-white text-center mb-2">Alterar Status</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6 leading-relaxed">
                                Tem certeza que deseja alterar o status desta reforma para <span className="font-bold text-teal-600 dark:text-teal-400">"{confirmStatus}"</span>?
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setConfirmStatus(null)}
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmStatusChange}
                                    disabled={statusLoading}
                                    className="px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-teal-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {statusLoading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                )
                }

                {/* Lightbox para fotos */}
                {
                    activeLightbox && (
                        <div
                            className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-4 animate-fadeIn"
                            onClick={() => setActiveLightbox(null)}
                        >
                            <button
                                onClick={() => setActiveLightbox(null)}
                                className="absolute top-4 right-4 text-white hover:text-teal-500 transition-colors z-[310]"
                            >
                                <X className="w-8 h-8" />
                            </button>

                            {/* Navigation Buttons */}
                            {activeLightbox.index > 0 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setActiveLightbox(prev => prev ? { ...prev, index: prev.index - 1 } : null)
                                    }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-2 z-[310]"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                </button>
                            )}
                            {activeLightbox.index < activeLightbox.photos.length - 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setActiveLightbox(prev => prev ? { ...prev, index: prev.index + 1 } : null)
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-2 z-[310]"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </button>
                            )}

                            <img
                                src={getImageUrl(activeLightbox.photos[activeLightbox.index])}
                                className="max-w-full max-h-[90vh] rounded-lg shadow-2xl animate-scaleIn object-contain"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    )
                }

                {/* Modal de Vistoria */}
                <VistoriaModal
                    isOpen={showVistoriaModal}
                    onClose={() => {
                        setShowVistoriaModal(false)
                        setVistoriaForm(prev => ({ ...prev, fotos: [], observacoes: '', status: 'Aguardando Vistoria' }))
                    }}
                    vistoriaForm={vistoriaForm}
                    setVistoriaForm={setVistoriaForm}
                    uploadingVistoria={uploadingVistoria}
                    statusLoading={statusLoading}
                    handleVistoriaPhotoUpload={handleVistoriaPhotoUpload}
                    removeVistoriaPhoto={removeVistoriaPhoto}
                    saveVistoria={saveVistoria}
                    getImageUrl={getImageUrl}
                />

                {/* Modal de Confirmação de Exclusão */}
                {
                    deleteVistoriaIndex !== null && (
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[250] p-4 animate-fadeIn">
                            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transform animate-scaleIn">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400">
                                        <Trash2 className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                        Excluir Vistoria
                                    </h3>
                                </div>

                                <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                                    Tem certeza que deseja excluir esta vistoria? Esta ação não pode ser desfeita.
                                </p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setDeleteVistoriaIndex(null)}
                                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmDeleteVistoria}
                                        disabled={statusLoading}
                                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {statusLoading ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4" />
                                                Excluir
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    )
}
