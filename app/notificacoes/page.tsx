'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Sidebar } from '@/components/Sidebar'
import { Footer } from '@/components/Footer'
import { useAuth } from '@/lib/auth'
import { Bell, Check, CheckCheck, Trash2, Filter, Calendar, MessageSquare, Hammer, Info } from 'lucide-react'
import {
    Notification,
    NotificationType,
    NotificationStatus,
    subscribeToUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification as deleteNotificationAPI
} from '@/lib/notifications-api'

const FilterButton = ({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${active
            ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20 scale-105'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
    >
        {label}
    </button>
)

export default function NotificacoesPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [filter, setFilter] = useState<'all' | NotificationType>('all')
    const [statusFilter, setStatusFilter] = useState<'all' | NotificationStatus>('all')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user?.cpf) return

        const unsubscribe = subscribeToUserNotifications(user.cpf, (notifs) => {
            setNotifications(notifs)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [user?.cpf])

    const getNotificationIcon = (type: NotificationType) => {
        switch (type) {
            case 'reforma': return <Hammer className="w-5 h-5" />
            case 'votacao': return <CheckCheck className="w-5 h-5" />
            case 'mensagem': return <MessageSquare className="w-5 h-5" />
            case 'sistema': return <Info className="w-5 h-5" />
        }
    }

    const getNotificationColor = (type: NotificationType) => {
        switch (type) {
            case 'reforma': return 'bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400'
            case 'votacao': return 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400'
            case 'mensagem': return 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
            case 'sistema': return 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
        }
    }

    const markAsRead = async (id: string) => {
        try { await markNotificationAsRead(id) } catch (error) { console.error('Erro ao marcar como lida:', error) }
    }

    const markAllAsRead = async () => {
        if (!user?.cpf) return
        try { await markAllNotificationsAsRead(user.cpf) } catch (error) { console.error('Erro ao marcar todas como lidas:', error) }
    }

    const deleteNotification = async (id: string) => {
        try { await deleteNotificationAPI(id) } catch (error) { console.error('Erro ao excluir notificação:', error) }
    }

    const filteredNotifications = notifications.filter(notif => {
        const typeMatch = filter === 'all' || notif.type === filter
        const statusMatch = statusFilter === 'all' || notif.status === statusFilter
        return typeMatch && statusMatch
    })

    const unreadCount = notifications.filter(n => n.status === 'unread').length

    return (
        <ProtectedRoute>
            <div className="min-h-screen flex bg-transparent">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex-1 w-full px-4 pt-24 lg:pt-10 pb-10">
                        <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-6">

                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-2.5">
                                        <Bell className="w-7 h-7 sm:w-8 sm:h-8" />
                                        Notificações
                                    </h1>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {unreadCount > 0 ? `Você tem ${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas as notificações foram lidas'}
                                    </p>
                                </div>

                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="w-full sm:w-auto px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCheck className="w-4 h-4" />
                                        Marcar como Lidas
                                    </button>
                                )}
                            </div>

                            {/* Filtros */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
                                <div className="flex flex-col xl:flex-row xl:items-center gap-4">
                                    {/* Linha: Tipo */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Filter className="w-4 h-4 text-teal-500" />
                                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Tipo</span>
                                        </div>
                                        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                                            <FilterButton active={filter === 'all'} label="Todas" onClick={() => setFilter('all')} />
                                            <FilterButton active={filter === 'reforma'} label="Reformas" onClick={() => setFilter('reforma')} />
                                            <FilterButton active={filter === 'votacao'} label="Votações" onClick={() => setFilter('votacao')} />
                                            <FilterButton active={filter === 'mensagem'} label="Mensagens" onClick={() => setFilter('mensagem')} />
                                            <FilterButton active={filter === 'sistema'} label="Sistema" onClick={() => setFilter('sistema')} />
                                        </div>
                                    </div>

                                    <div className="hidden xl:block w-[1px] h-8 bg-slate-200 dark:bg-slate-800 mx-2"></div>

                                    {/* Linha: Status */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Check className="w-4 h-4 text-teal-500" />
                                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Status</span>
                                        </div>
                                        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                                            <FilterButton active={statusFilter === 'all'} label="Todas" onClick={() => setStatusFilter('all')} />
                                            <FilterButton active={statusFilter === 'unread'} label="Não Lidas" onClick={() => setStatusFilter('unread')} />
                                            <FilterButton active={statusFilter === 'read'} label="Lidas" onClick={() => setStatusFilter('read')} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Lista de Notificações */}
                            <div className="space-y-3">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="w-8 h-8 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></div>
                                    </div>
                                ) : filteredNotifications.length === 0 ? (
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
                                        <Bell className="w-16 h-16 mx-auto mb-4 text-slate-200 dark:text-slate-800 opacity-20" />
                                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Nenhuma notificação encontrada</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Não há registros para os filtros selecionados.</p>
                                    </div>
                                ) : (
                                    filteredNotifications.map(notification => (
                                        <div
                                            key={notification.id}
                                            onClick={() => notification.link && router.push(notification.link)}
                                            className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 transition-all hover:shadow-md group ${notification.status === 'unread'
                                                ? 'border-teal-300 dark:border-teal-700 shadow-sm shadow-teal-500/10'
                                                : 'border-slate-200 dark:border-slate-800'
                                                } ${notification.link ? 'cursor-pointer' : ''}`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                                                    {getNotificationIcon(notification.type)}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-3 mb-1">
                                                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                                                            {notification.title}
                                                            {notification.status === 'unread' && (
                                                                <span className="ml-2 inline-block w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
                                                            )}
                                                        </h3>
                                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(notification.timestamp).toLocaleString('pt-BR', {
                                                                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 line-clamp-2 sm:line-clamp-none">
                                                        {notification.message}
                                                    </p>

                                                    <div className="flex items-center gap-2">
                                                        {notification.status === 'unread' && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); notification.id && markAsRead(notification.id); }}
                                                                className="px-3 py-1.5 bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 rounded-lg text-xs font-bold hover:bg-teal-200 transition-all flex items-center gap-1"
                                                            >
                                                                <Check className="w-3 h-3" /> Lida
                                                            </button>
                                                        )}
                                                        {notification.link && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); router.push(notification.link!); }}
                                                                className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 transition-all font-black shadow-lg shadow-teal-500/20"
                                                            >
                                                                Acessar
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); notification.id && deleteNotification(notification.id); }}
                                                            className="ml-auto p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="w-full">
                        <Footer />
                    </div>
                </div>
            </div>
            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </ProtectedRoute>
    )
}
