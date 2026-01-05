'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Sidebar } from '@/components/Sidebar'
import { Footer } from '@/components/Footer'
import { useAuth } from '@/lib/auth'
import { Bell, Check, CheckCheck, Trash2, Filter, Calendar, User, MessageSquare, Hammer, AlertCircle, Info } from 'lucide-react'
import {
    Notification,
    NotificationType,
    NotificationStatus,
    subscribeToUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification as deleteNotificationAPI
} from '@/lib/notifications-api'

export default function NotificacoesPage() {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [filter, setFilter] = useState<'all' | NotificationType>('all')
    const [statusFilter, setStatusFilter] = useState<'all' | NotificationStatus>('all')
    const [loading, setLoading] = useState(true)

    // Buscar notificações em tempo real
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
            case 'reforma':
                return <Hammer className="w-5 h-5" />
            case 'votacao':
                return <CheckCheck className="w-5 h-5" />
            case 'mensagem':
                return <MessageSquare className="w-5 h-5" />
            case 'sistema':
                return <Info className="w-5 h-5" />
        }
    }

    const getNotificationColor = (type: NotificationType) => {
        switch (type) {
            case 'reforma':
                return 'bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400'
            case 'votacao':
                return 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400'
            case 'mensagem':
                return 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
            case 'sistema':
                return 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
        }
    }

    const markAsRead = async (id: string) => {
        if (!id) return
        try {
            await markNotificationAsRead(id)
        } catch (error) {
            console.error('Erro ao marcar como lida:', error)
        }
    }

    const markAllAsRead = async () => {
        if (!user?.cpf) return
        try {
            await markAllNotificationsAsRead(user.cpf)
        } catch (error) {
            console.error('Erro ao marcar todas como lidas:', error)
        }
    }

    const deleteNotification = async (id: string) => {
        if (!id) return
        try {
            await deleteNotificationAPI(id)
        } catch (error) {
            console.error('Erro ao excluir notificação:', error)
        }
    }

    const filteredNotifications = notifications.filter(notif => {
        const typeMatch = filter === 'all' || notif.type === filter
        const statusMatch = statusFilter === 'all' || notif.status === statusFilter
        return typeMatch && statusMatch
    })

    const unreadCount = notifications.filter(n => n.status === 'unread').length

    return (
        <ProtectedRoute>
            <div className="min-h-screen flex w-full bg-transparent">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex-1 w-full px-4 pt-10">
                        <div className="w-full flex flex-col gap-6">

                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                                        <Bell className="w-8 h-8" />
                                        Notificações
                                    </h1>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        {unreadCount > 0 ? `Você tem ${unreadCount} notificação${unreadCount > 1 ? 'ões' : ''} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas as notificações foram lidas'}
                                    </p>
                                </div>

                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2"
                                    >
                                        <CheckCheck className="w-4 h-4" />
                                        Marcar Todas como Lidas
                                    </button>
                                )}
                            </div>

                            {/* Filtros */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Tipo:</span>
                                    </div>

                                    <button
                                        onClick={() => setFilter('all')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'all'
                                            ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        Todas
                                    </button>
                                    <button
                                        onClick={() => setFilter('reforma')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'reforma'
                                            ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        Reformas
                                    </button>
                                    <button
                                        onClick={() => setFilter('votacao')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'votacao'
                                            ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        Votações
                                    </button>
                                    <button
                                        onClick={() => setFilter('mensagem')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'mensagem'
                                            ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        Mensagens
                                    </button>
                                    <button
                                        onClick={() => setFilter('sistema')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'sistema'
                                            ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        Sistema
                                    </button>

                                    <div className="ml-auto flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Status:</span>
                                        <button
                                            onClick={() => setStatusFilter('all')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'all'
                                                ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            Todas
                                        </button>
                                        <button
                                            onClick={() => setStatusFilter('unread')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'unread'
                                                ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            Não Lidas
                                        </button>
                                        <button
                                            onClick={() => setStatusFilter('read')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'read'
                                                ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            Lidas
                                        </button>
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
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
                                        <Bell className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
                                            Nenhuma notificação encontrada
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Não há notificações com os filtros selecionados.
                                        </p>
                                    </div>
                                ) : (
                                    filteredNotifications.map(notification => (
                                        <div
                                            key={notification.id}
                                            className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 transition-all hover:shadow-md ${notification.status === 'unread'
                                                ? 'border-teal-300 dark:border-teal-700 shadow-sm shadow-teal-500/10'
                                                : 'border-slate-200 dark:border-slate-800'
                                                }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* Ícone */}
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                                                    {getNotificationIcon(notification.type)}
                                                </div>

                                                {/* Conteúdo */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-3 mb-1">
                                                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                                                            {notification.title}
                                                            {notification.status === 'unread' && (
                                                                <span className="ml-2 inline-block w-2 h-2 bg-teal-500 rounded-full"></span>
                                                            )}
                                                        </h3>
                                                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(notification.timestamp).toLocaleString('pt-BR', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                                                        {notification.message}
                                                    </p>

                                                    {/* Ações */}
                                                    <div className="flex items-center gap-2">
                                                        {notification.status === 'unread' && (
                                                            <button
                                                                onClick={() => notification.id && markAsRead(notification.id)}
                                                                className="px-3 py-1.5 bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 rounded-lg text-xs font-bold hover:bg-teal-200 dark:hover:bg-teal-500/30 transition-all flex items-center gap-1"
                                                            >
                                                                <Check className="w-3 h-3" />
                                                                Marcar como Lida
                                                            </button>
                                                        )}
                                                        {notification.link && (
                                                            <a
                                                                href={notification.link}
                                                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                                            >
                                                                Ver Detalhes
                                                            </a>
                                                        )}
                                                        <button
                                                            onClick={() => notification.id && deleteNotification(notification.id)}
                                                            className="ml-auto p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                                            title="Excluir notificação"
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
                    <Footer />
                </div>
            </div>
        </ProtectedRoute>
    )
}
