'use client'

import { useState, useRef, useEffect } from 'react'
import { FileText, Camera, MessageSquare, Trash2, Download, ChevronLeft, ChevronRight, X, Clock, Calendar, User, Hammer, Paintbrush, Grid, Droplets, Wind, AppWindow, Layers, Zap, CheckCircle, XCircle, AlertCircle, ClipboardList, CheckSquare, Plus, Link } from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { api, Reforma } from '@/lib/api-config'
import { notifyNewReformaMessage, notifyAdminsNewMessage, notifyReformaApproved, notifyReformaRejected, notifyEngenhariaVistoriaRequested } from '@/lib/notifications-api'
import VistoriaModal from './VistoriaModal'
import { compressImage } from '@/lib/image-utils'

interface ReformaDetailsModalProps {
    reforma: Reforma
    onClose: () => void
    onUpdate: () => void
    onEdit: (reforma: Reforma) => void
    user: any
    showNotification: (type: 'success' | 'error' | 'info', message: string) => void
}

export default function ReformaDetailsModal({ reforma, onClose, onUpdate, onEdit, user, showNotification }: ReformaDetailsModalProps) {
    const isAdmin = user?.acesso === 'Administrador' || user?.acesso === 'Engenharia' || user?.acesso === 'Desenvolvedor' || user?.isMaster
    const [activeTab, setActiveTab] = useState<'solicitacao' | 'vistorias' | 'chat'>('solicitacao')

    // Chat States
    const [newMessage, setNewMessage] = useState('')
    const [sendingMsg, setSendingMsg] = useState(false)
    const [messages, setMessages] = useState<any[]>(reforma.mensagens || [])
    const [usersTyping, setUsersTyping] = useState<string[]>(reforma.usersTyping || [])

    // Status & Admin Actions
    const [statusLoading, setStatusLoading] = useState(false)
    const [confirmStatus, setConfirmStatus] = useState<string | null>(null)

    // Vistoria States
    const [activeLightbox, setActiveLightbox] = useState<{ photos: string[], index: number } | null>(null)
    const [showVistoriaModal, setShowVistoriaModal] = useState(false)
    const [uploadingVistoria, setUploadingVistoria] = useState(false)
    const [vistoriaForm, setVistoriaForm] = useState({
        data: new Date().toISOString().split('T')[0],
        responsavel: user?.nome || '',
        status: 'Vistoria Agendada',
        observacoes: '',
        fotos: [] as string[]
    })

    // --- Helpers & Effects ---
    const getImageUrl = (urlOrKey: string) => {
        if (!urlOrKey) return ''
        if (urlOrKey.startsWith('http') || urlOrKey.startsWith('/api')) return urlOrKey
        return `/api/image/${encodeURIComponent(urlOrKey)}`
    }

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })

    useEffect(() => {
        if (activeTab === 'chat') scrollToBottom()
    }, [messages, activeTab])

    // Lightbox Navigation
    const getStatusStyles = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('reprovad')) return { text: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400' };
        if (s.includes('aprovad')) return { text: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' };
        if (s.includes('concluíd')) return { text: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' };
        if (s.includes('vistoria') || s.includes('agendada')) return { text: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400' };
        if (s.includes('análise')) return { text: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' };
        return { text: 'text-teal-500', bg: 'bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400' };
    }

    const currentStatusStyles = getStatusStyles(reforma.status);

    useEffect(() => {
        if (!activeLightbox) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setActiveLightbox(null)
            if (e.key === 'ArrowLeft' && activeLightbox.index > 0) {
                setActiveLightbox(prev => prev ? { ...prev, index: prev.index - 1 } : null)
            } else if (e.key === 'ArrowRight' && activeLightbox.index < activeLightbox.photos.length - 1) {
                setActiveLightbox(prev => prev ? { ...prev, index: prev.index + 1 } : null)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [activeLightbox])

    useEffect(() => {
        const unsubscribe = api.subscribeToReforma(reforma.id, (updatedReforma: Reforma) => {
            setMessages(updatedReforma.mensagens || [])
            setUsersTyping(updatedReforma.usersTyping || [])
            if (updatedReforma.status !== reforma.status) onUpdate()
        })
        return () => unsubscribe()
    }, [reforma.id])

    // --- Actions ---
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
            try {
                if (isAdmin) {
                    if (reforma.moradorCpf && reforma.moradorCpf !== user.cpf) {
                        await notifyNewReformaMessage(reforma.moradorCpf, reforma.id || '', user.nome, `Apt ${reforma.apartamento}`, reforma.artRrt || '')
                    }
                } else {
                    await notifyAdminsNewMessage(reforma.id || '', user.nome, `Apt ${reforma.apartamento}`, reforma.artRrt || '')
                }
            } catch (ignore) { }
            onUpdate()
        } catch (error) {
            showNotification('error', 'Erro ao enviar mensagem')
        } finally {
            setSendingMsg(false)
        }
    }

    const confirmStatusChange = async () => {
        if (!confirmStatus) return
        try {
            setStatusLoading(true)
            await api.updateReforma(reforma.id, { status: confirmStatus as any })
            try {
                if (confirmStatus === 'Aprovado') await notifyReformaApproved(reforma.moradorCpf || '', reforma.id || '', reforma.apartamento, reforma.artRrt || '')
                else if (confirmStatus === 'Reprovado') await notifyReformaRejected(reforma.moradorCpf || '', reforma.id || '', reforma.apartamento, reforma.artRrt || '', 'Não atende aos requisitos.')
                else if (confirmStatus === 'Aguardando Vistoria') await notifyEngenhariaVistoriaRequested(reforma.id || '', reforma.apartamento, reforma.artRrt || '')
            } catch (ignore) { }
            onUpdate()
        } catch (error) {
            showNotification('error', 'Erro ao atualizar status')
        } finally {
            setStatusLoading(false)
            setConfirmStatus(null)
        }
    }

    const saveVistoria = async () => {
        try {
            setStatusLoading(true)
            const novaVistoria = {
                id: crypto.randomUUID(),
                data: new Date(vistoriaForm.data).toISOString(),
                status: vistoriaForm.status,
                observacoes: vistoriaForm.observacoes,
                fotos: vistoriaForm.fotos,
                usuario: vistoriaForm.responsavel || user.nome,
                timestamp: new Date().toISOString()
            }
            const updatedVistorias = [novaVistoria, ...(reforma.vistorias || [])]
            let newStatus = reforma.status
            if (vistoriaForm.status.includes('Aprovada')) newStatus = 'Vistoria Aprovada'
            if (vistoriaForm.status.includes('Reprovada')) newStatus = 'Vistoria Reprovada'
            await api.updateReforma(reforma.id, { vistorias: updatedVistorias, status: newStatus })
            setShowVistoriaModal(false)
            onUpdate()
            showNotification('success', 'Vistoria registrada!')
        } catch (error) {
            showNotification('error', 'Erro ao salvar')
        } finally {
            setStatusLoading(false)
        }
    }

    const navItems = [
        { id: 'solicitacao', label: 'Solicitação', icon: FileText },
        { id: 'vistorias', label: 'Vistorias', icon: Camera },
        { id: 'chat', label: 'Mensagens', icon: MessageSquare }
    ]

    // Thumbnail Carousel Component
    const ThumbnailCarousel = ({ fotos, onPhotoClick }: { fotos: string[], onPhotoClick: (index: number) => void }) => {
        const scrollRef = useRef<HTMLDivElement>(null)
        const [showLeft, setShowLeft] = useState(false)
        const [showRight, setShowRight] = useState(fotos.length > 4)

        const handleScroll = () => {
            if (scrollRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
                setShowLeft(scrollLeft > 10)
                setShowRight(scrollLeft + clientWidth < scrollWidth - 10)
            }
        }

        const scroll = (direction: 'left' | 'right') => {
            if (scrollRef.current) {
                const amount = direction === 'left' ? -300 : 300
                scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
            }
        }

        return (
            <div className="relative group/carousel">
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex gap-4 overflow-x-auto py-2 no-scrollbar scroll-smooth"
                >
                    {fotos.map((f, fi) => (
                        <button
                            key={fi}
                            onClick={() => onPhotoClick(fi)}
                            className="w-24 h-24 md:w-32 md:h-32 shrink-0 rounded-2xl overflow-hidden border-2 border-white/5 shadow-2xl hover:scale-105 hover:border-teal-500/50 transition-all duration-300"
                        >
                            <img src={getImageUrl(f)} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
                {showLeft && (
                    <button
                        onClick={() => scroll('left')}
                        className="absolute -left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-900/80 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-2xl transition-all hover:bg-teal-600 z-10"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}
                {showRight && (
                    <button
                        onClick={() => scroll('right')}
                        className="absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-900/80 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-2xl transition-all hover:bg-teal-600 z-10"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                )}
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[100] md:p-6 font-sans">
            <div className="bg-white dark:bg-slate-900 w-full md:max-w-6xl h-full md:h-[85vh] md:rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row overflow-hidden relative">

                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-500 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-teal-500/20">
                            {reforma.apartamento}
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-800 dark:text-white leading-none">Apt {reforma.apartamento}</h2>
                            <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${currentStatusStyles.text}`}>
                                Torre {reforma.torre} • {reforma.status}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                const url = `${window.location.origin}/reformas?art=${reforma.artRrt}`
                                navigator.clipboard.writeText(url)
                                showNotification('success', 'Link copiado!')
                            }}
                            className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500"
                        >
                            <Link className="w-4 h-4" />
                        </button>
                        <button onClick={onClose} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Sidebar (Desktop) / Bottom Nav (Mobile) */}
                <div className="w-full md:w-72 bg-slate-50 dark:bg-slate-950/50 border-t md:border-t-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-row md:flex-col order-last md:order-first shrink-0">
                    <div className="hidden md:block p-8">
                        <div className="w-16 h-16 bg-teal-500/10 dark:bg-teal-500/20 rounded-3xl flex items-center justify-center text-teal-600 dark:text-teal-400 font-black text-2xl mb-4">
                            {reforma.apartamento}
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">Unidade {reforma.apartamento}</h2>
                        <p className="text-slate-500 font-medium">Torre {reforma.torre}</p>
                        <div className={`mt-4 px-3 py-1 border rounded-lg inline-block ${currentStatusStyles.bg}`}>
                            <span className="text-[10px] font-black uppercase tracking-wider">{reforma.status}</span>
                        </div>

                        {/* Botão de Editar para Morador quando Reprovado */}
                        {reforma.status === 'Reprovado' && onEdit && (
                            <button
                                onClick={() => onEdit(reforma)}
                                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-600/20 transition-all active:scale-95"
                            >
                                <Hammer className="w-4 h-4" />
                                Editar Solicitação
                            </button>
                        )}
                    </div>

                    <nav className="flex-1 flex md:flex-col p-2 md:p-4 gap-1 md:gap-2">
                        {navItems.map(item => {
                            const isPulsing = item.id === 'vistorias' && reforma.status === 'Aguardando Vistoria'
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id as any)}
                                    className={`flex-1 md:flex-none flex flex-col md:flex-row items-center gap-1 md:gap-4 px-2 md:px-5 py-3 md:py-4 rounded-2xl transition-all duration-300 ${activeTab === item.id
                                        ? 'bg-teal-600 md:bg-teal-500/10 text-white md:text-teal-600 dark:text-teal-400 shadow-xl shadow-teal-600/20 md:shadow-none'
                                        : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        } ${isPulsing ? 'animate-pulse ring-2 ring-teal-500/50' : ''}`}
                                >
                                    <item.icon className="w-5 h-5 md:w-6 md:h-6" />
                                    <span className="text-[10px] md:text-sm font-bold uppercase md:capitalize tracking-wider md:tracking-normal">{item.label}</span>
                                </button>
                            )
                        })}
                    </nav>

                    <div className="hidden md:block p-8 border-t border-slate-200 dark:border-slate-800/50 opacity-50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{reforma.moradorNome}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{reforma.email || 'Condomínio Grand Oasis'}</p>
                    </div>
                </div>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col min-w-0 bg-transparent relative overflow-hidden">
                    <div className="hidden md:flex absolute top-8 right-8 z-10 gap-3">
                        <button
                            onClick={() => {
                                const url = `${window.location.origin}/reformas?art=${reforma.artRrt}`
                                navigator.clipboard.writeText(url)
                                showNotification('success', 'Link copiado!')
                            }}
                            className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl transition-all"
                        >
                            <Link className="w-5 h-5" />
                        </button>
                        <button onClick={onClose} className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-10 lg:p-14">
                        {activeTab === 'solicitacao' && (
                            <div className="space-y-10 md:space-y-14 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {isAdmin && (
                                    <section className="bg-slate-900 dark:bg-slate-950 rounded-3xl p-6 md:p-8 border border-white/5">
                                        <div className="flex items-center gap-3 mb-6">
                                            <Zap className="w-5 h-5 text-teal-400" />
                                            <h3 className="text-xs font-black text-white uppercase tracking-widest leading-none">Ações Administrativas</h3>
                                        </div>
                                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 md:gap-3">
                                            {[
                                                { value: 'Aprovado', label: 'Aprovar', icon: CheckCircle, color: 'bg-emerald-500' },
                                                { value: 'Reprovado', label: 'Reprovar', icon: XCircle, color: 'bg-red-500' },
                                                { value: 'Em Análise', label: 'Analisar', icon: Clock, color: 'bg-amber-500' },
                                                { value: 'Aguardando Vistoria', label: 'Vistoria', icon: ClipboardList, color: 'bg-purple-500' },
                                                { value: 'Concluído', label: 'Concluir', icon: CheckSquare, color: 'bg-blue-500' }
                                            ].map(item => (
                                                <button
                                                    key={item.value}
                                                    onClick={() => setConfirmStatus(item.value)}
                                                    className={`px-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-wider flex flex-col items-center gap-2 transition-all border-2 ${reforma.status === item.value
                                                        ? `${item.color} text-white border-transparent shadow-lg`
                                                        : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                                                        }`}
                                                >
                                                    <item.icon className="w-5 h-5" />
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                                    <div className="space-y-10">
                                        <section>
                                            <div className="flex items-center gap-3 mb-6">
                                                <Calendar className="w-5 h-5 text-teal-500" />
                                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Cronograma do Projeto</h3>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200/50 dark:border-white/5">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Data de Início</p>
                                                    <p className="text-xl font-black text-slate-800 dark:text-white">{new Date(reforma.dataInicio).toLocaleDateString()}</p>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200/50 dark:border-white/5">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Término Previsto</p>
                                                    <p className="text-xl font-black text-slate-800 dark:text-white">{new Date(reforma.dataFim).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </section>

                                        <section>
                                            <div className="flex items-center gap-3 mb-6">
                                                <Grid className="w-5 h-5 text-teal-500" />
                                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Escopo dos Serviços</h3>
                                            </div>
                                            <div className="flex flex-wrap gap-2 md:gap-3">
                                                {reforma.servicos.map(s => (
                                                    <span key={s} className="px-5 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 rounded-2xl text-[11px] md:text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm">
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </section>
                                    </div>

                                    <div className="space-y-10">
                                        <section>
                                            <div className="flex items-center gap-3 mb-6">
                                                <User className="w-5 h-5 text-teal-500" />
                                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Responsável Técnico</h3>
                                            </div>
                                            <div className="bg-slate-950 p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                    <Hammer className="w-24 h-24" />
                                                </div>
                                                <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-2">Empresa / Profissional</p>
                                                <p className="text-2xl font-black text-white leading-tight uppercase mb-6">{reforma.empresa || 'Não informado'}</p>
                                                <div className="flex flex-col gap-4 text-slate-400">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="w-4 h-4" />
                                                        <span className="text-xs font-bold tracking-tight">{reforma.cnpjPrestador || 'CNPJ não informado'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Zap className="w-4 h-4" />
                                                        <span className="text-xs font-bold tracking-tight">ART/RRT: {reforma.artRrt || 'Não informado'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        {reforma.anexos && reforma.anexos.length > 0 && (
                                            <section>
                                                <div className="flex items-center gap-3 mb-6">
                                                    <FileText className="w-5 h-5 text-teal-500" />
                                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Documentos Anexados</h3>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {reforma.anexos.map((a, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={getImageUrl(a)}
                                                            target="_blank"
                                                            className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl transition-all group"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500 font-bold text-xs uppercase">
                                                                    {a.split('.').pop()}
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate max-w-[180px] md:max-w-xs">{a.split('/').pop()?.substring(14) || 'Arquivo'}</span>
                                                            </div>
                                                            <Download className="w-4 h-4 text-slate-400 group-hover:text-teal-500" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </section>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'vistorias' && (
                            <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2 border-b border-slate-200 dark:border-slate-800">
                                    <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Histórico de Vistorias</h2>
                                    {isAdmin && (
                                        <button
                                            onClick={() => setShowVistoriaModal(true)}
                                            className="w-full sm:w-auto px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                                        >
                                            <Plus className="w-5 h-5" /> Nova Vistoria
                                        </button>
                                    )}
                                </div>

                                {reforma.status === 'Aguardando Vistoria' && (
                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-[32px] p-6 flex items-start gap-4">
                                        <div className="p-3 bg-amber-500/20 rounded-2xl shrink-0">
                                            <AlertCircle className="w-6 h-6 text-amber-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-amber-500 mb-1">Vistoria Pendente</h4>
                                            <p className="text-sm text-amber-600/80 dark:text-amber-500/80 leading-relaxed">
                                                Foi solicitada uma vistoria para esta reforma. Por favor, <strong>agende e realize a vistoria</strong> o mais breve possível para dar continuidade ao processo.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {!reforma.vistorias || reforma.vistorias.length === 0 ? (
                                    <div className="py-24 flex flex-col items-center text-center bg-slate-50 dark:bg-slate-800/20 rounded-[48px] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                        <Camera className="w-20 h-20 text-slate-300 dark:text-slate-700 mb-6" />
                                        <p className="text-slate-500 font-black uppercase text-xs tracking-[0.2em]">Nenhum registro encontrado</p>
                                    </div>
                                ) : (
                                    <div className="space-y-10">
                                        {reforma.vistorias.map((v, idx) => (
                                            <div key={idx} className="bg-slate-50/50 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200 dark:border-white/5 rounded-[40px] overflow-hidden shadow-2xl transition-all">
                                                <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8 lg:gap-12">
                                                    <div className="md:w-56 shrink-0">
                                                        <p className="text-[11px] font-black text-teal-500 uppercase tracking-[0.15em] mb-2">{v.status}</p>
                                                        <h4 className="text-3xl font-black text-slate-800 dark:text-white leading-none mb-2">{v.data && new Date(v.data).toLocaleDateString()}</h4>
                                                        <p className="text-sm font-bold text-slate-400 dark:text-slate-500">{v.usuario}</p>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="bg-white/50 dark:bg-slate-900/60 p-8 rounded-[32px] border border-slate-200 dark:border-white/5 min-h-[120px] flex items-center">
                                                            <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed italic">"{v.observacoes}"</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {v.fotos && v.fotos.length > 0 && (
                                                    <div className="px-8 md:px-10 pb-10">
                                                        <ThumbnailCarousel fotos={v.fotos} onPhotoClick={(fi) => setActiveLightbox({ photos: v.fotos!, index: fi })} />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'chat' && (
                            <div className="h-full flex flex-col max-w-4xl mx-auto animate-in zoom-in-95 duration-500">
                                <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar pb-10">
                                    {messages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
                                            <MessageSquare className="w-16 h-16 mb-4" />
                                            <p className="font-bold uppercase text-[10px] tracking-widest">Nenhuma mensagem registrada</p>
                                        </div>
                                    ) : (
                                        messages.map((m: any) => {
                                            const isMe = m.autor === user.nome
                                            return (
                                                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[90%] md:max-w-[70%] ${isMe ? 'bg-teal-600 text-white rounded-3xl rounded-tr-sm shadow-xl shadow-teal-600/20' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-3xl rounded-tl-sm border border-slate-200 dark:border-slate-700 shadow-md'} p-5 md:p-6`}>
                                                        <p className="text-xs md:text-sm leading-relaxed font-medium">{m.texto}</p>
                                                        <div className={`mt-4 flex items-center justify-between gap-8 text-[9px] font-black uppercase tracking-widest ${isMe ? 'text-teal-200' : 'text-slate-400'}`}>
                                                            <span>{m.autor}</span>
                                                            <span>{new Date(m.data).toLocaleDateString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form onSubmit={handleSendMessage} className="mt-6 flex gap-2 md:gap-4 items-center bg-white dark:bg-slate-900 p-2 md:p-4 rounded-[32px] border-2 border-slate-100 dark:border-slate-800 shadow-2xl">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => {
                                            setNewMessage(e.target.value)
                                            api.setTypingStatus(reforma.id, user.nome, true)
                                        }}
                                        placeholder="Digite uma mensagem..."
                                        className="flex-1 bg-transparent border-none focus:ring-0 outline-none px-4 text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || sendingMsg}
                                        className="w-12 h-12 md:w-14 md:h-14 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-[20px] flex items-center justify-center transition-all shadow-lg shadow-teal-600/30"
                                    >
                                        {sendingMsg ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Lightbox */}
            {activeLightbox && (
                <div className="fixed inset-0 bg-black/95 z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setActiveLightbox(null)}>
                    <button className="absolute top-6 right-6 text-white/50 hover:text-white p-2 z-50 transition-all hover:scale-110" onClick={() => setActiveLightbox(null)}><X className="w-10 h-10" /></button>

                    {activeLightbox.index > 0 && (
                        <button
                            className="absolute left-6 top-1/2 -translate-y-1/2 p-6 text-white/40 hover:text-white transition-all hover:scale-125 z-50"
                            onClick={(e) => { e.stopPropagation(); setActiveLightbox({ ...activeLightbox, index: activeLightbox.index - 1 }) }}
                        >
                            <ChevronLeft className="w-16 h-16" />
                        </button>
                    )}

                    {activeLightbox.index < activeLightbox.photos.length - 1 && (
                        <button
                            className="absolute right-6 top-1/2 -translate-y-1/2 p-6 text-white/40 hover:text-white transition-all hover:scale-125 z-50"
                            onClick={(e) => { e.stopPropagation(); setActiveLightbox({ ...activeLightbox, index: activeLightbox.index + 1 }) }}
                        >
                            <ChevronRight className="w-16 h-16" />
                        </button>
                    )}

                    <img
                        src={getImageUrl(activeLightbox.photos[activeLightbox.index])}
                        className="max-w-full max-h-[90vh] rounded-3xl shadow-2xl object-contain animate-in zoom-in-95 duration-500 border border-white/10"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}

            {confirmStatus && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[300] p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[40px] w-full max-w-sm p-8 text-center border border-white/5 shadow-2xl">
                        <div className="w-20 h-20 bg-teal-500/10 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-teal-500 shadow-inner">
                            <Clock className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2 leading-tight">Alterar Status</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8 italic">"{confirmStatus}"</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setConfirmStatus(null)} className="h-14 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest">Sair</button>
                            <button onClick={confirmStatusChange} className="h-14 bg-teal-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-teal-600/30">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            <VistoriaModal
                isOpen={showVistoriaModal}
                onClose={() => setShowVistoriaModal(false)}
                vistoriaForm={vistoriaForm}
                setVistoriaForm={setVistoriaForm}
                uploadingVistoria={uploadingVistoria}
                statusLoading={statusLoading}
                handleVistoriaPhotoUpload={async (e) => {
                    if (!e.target.files) return
                    setUploadingVistoria(true)
                    const files = Array.from(e.target.files)
                    const urls = [...vistoriaForm.fotos]
                    for (const f of files) {
                        try {
                            const compressedFile = await compressImage(f, 120) // Compress to max 120KB
                            const data = new FormData()
                            data.append('file', compressedFile)
                            const res = await fetch('/api/upload', { method: 'POST', body: data }).then(r => r.json())
                            if (res.success) urls.push(res.url || res.key)
                        } catch (err) {
                            console.error('Erro ao comprimir imagem', err)
                            showNotification('error', `Erro ao processar imagem ${f.name}`)
                        }
                    }
                    setVistoriaForm({ ...vistoriaForm, fotos: urls })
                    setUploadingVistoria(false)
                }}
                removeVistoriaPhoto={(idx) => setVistoriaForm({ ...vistoriaForm, fotos: vistoriaForm.fotos.filter((_, i) => i !== idx) })}
                saveVistoria={saveVistoria}
                getImageUrl={getImageUrl}
            />

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    )
}
