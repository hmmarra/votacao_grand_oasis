'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/lib/auth'
import { subscribeToUnreadCount } from '@/lib/notifications-api'
import { requestNotificationPermission } from '@/lib/fcm-helper'
import { messaging } from '@/lib/firebase'
import { onMessage } from 'firebase/messaging'
import { Menu, X, Bell } from 'lucide-react'

interface SidebarProps {
    isAdmin?: boolean
}

export function Sidebar({ isAdmin = false }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const { user, logout } = useAuth()
    const pathname = usePathname()
    const router = useRouter()

    // Determina se é admin baseado na prop OU no usuário logado
    const isUserAdmin = isAdmin || user?.acesso === 'Administrador' || user?.acesso === 'Desenvolvedor' || user?.isMaster

    // Listener para notificações (Foreground e Background setup)
    useEffect(() => {
        if (!user?.cpf) return

        // 1. Solicitar permissão e salvar token
        requestNotificationPermission(user.cpf)

        // 2. Ouvir contador de não lidas
        const unsubscribeCount = subscribeToUnreadCount(user.cpf, (count) => {
            setUnreadCount(count)
        })

        return () => {
            unsubscribeCount()
        }
    }, [user?.cpf])

    // Listener separado para onMessage que reage quando 'messaging' estiver pronto
    useEffect(() => {
        let unsubscribeOnMessage: (() => void) | undefined

        if (messaging) {
            try {
                unsubscribeOnMessage = onMessage(messaging, (payload) => {
                    // Recebido em foreground - o contador de não lidas já deve atualizar via onSnapshot
                    console.log('Mensagem recebida em foreground:', payload)
                })
            } catch (err) {
                console.warn('Erro ao registrar listener de mensagens:', err)
            }
        }

        return () => {
            if (unsubscribeOnMessage) unsubscribeOnMessage()
        }
    }, [messaging]) // Re-roda quando messaging for inicializado

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [pathname])

    // Helper to check active state
    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

    // Get Page Title for Mobile Header
    const getPageTitle = () => {
        if (pathname.startsWith('/reformas')) return 'Reformas'
        if (pathname.startsWith('/pautas') || pathname.startsWith('/votacao')) return 'Votação'
        if (pathname.startsWith('/resultados')) return 'Resultados'
        if (pathname.startsWith('/notificacoes')) return 'Notificações'
        if (pathname.startsWith('/dashboard')) return 'Dashboard'
        if (pathname.startsWith('/admin')) return 'Admin'
        if (pathname.startsWith('/configuracoes')) return 'Configurações'
        if (pathname.startsWith('/sobre')) return 'Sobre'
        return 'Meu Condomínio'
    }

    return (
        <>
            {/* Mobile Top Bar */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#020617] border-b border-slate-800/50 flex items-center justify-between px-5 z-[45] shadow-lg">
                <div className="flex items-center">
                    <span className="text-slate-100 font-extrabold text-xl tracking-tight">
                        {getPageTitle()}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <Link href="/notificacoes" className="relative p-2.5 text-slate-400 hover:text-white transition-colors">
                        <Bell size={22} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#020617]">
                                {unreadCount}
                            </span>
                        )}
                    </Link>
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2.5 text-slate-400 hover:text-white transition-colors"
                    >
                        <Menu size={26} />
                    </button>
                </div>
            </header>

            {/* Backdrop / Overlay for Mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar Aside */}
            <aside
                className={`fixed lg:sticky top-0 h-full lg:h-screen bg-[#020617] text-slate-400 transition-all duration-300 z-[60] flex flex-col border-r border-slate-800/50 lg:rounded-r-[2.5rem] shadow-2xl 
                    ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
                    ${isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0 w-72 lg:w-auto'}
                `}
            >
                {/* Header / Logo */}
                <div className="flex items-center justify-between h-16 px-4 mb-4 bg-[#020617] lg:bg-transparent">
                    <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 flex-shrink-0">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                        </div>
                        {(!isCollapsed || isMobileMenuOpen) && (
                            <span className="text-slate-100 font-extrabold text-lg tracking-tight truncate">
                                Meu Condomínio
                            </span>
                        )}
                    </div>

                    {/* Close/Toggle Button */}
                    <button
                        onClick={() => isMobileMenuOpen ? setIsMobileMenuOpen(false) : setIsCollapsed(!isCollapsed)}
                        className="text-slate-500 hover:text-white p-2 rounded-xl hover:bg-slate-800/50 transition-all"
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-4 space-y-8 custom-scrollbar">

                    {/* Group: PAGES */}
                    <div>
                        {(!isCollapsed || isMobileMenuOpen) && (
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 pl-3">
                                Páginas
                            </h3>
                        )}
                        <div className="space-y-1">
                            <SidebarItem
                                icon={<DashboardIcon />}
                                label="Dashboard"
                                href="/dashboard"
                                active={isActive('/dashboard')}
                                collapsed={isCollapsed && !isMobileMenuOpen}
                            />
                            <SidebarItem
                                icon={<VoteIcon />}
                                label="Votação"
                                href="/pautas"
                                active={isActive('/pautas') || isActive('/votacao')}
                                collapsed={isCollapsed && !isMobileMenuOpen}
                            />
                            <SidebarItem
                                icon={<ChartIcon />}
                                label="Resultados"
                                href="/resultados"
                                active={isActive('/resultados')}
                                collapsed={isCollapsed && !isMobileMenuOpen}
                            />

                            <SidebarItem
                                icon={<NotificationsIcon />}
                                label="Notificações"
                                href="/notificacoes"
                                active={isActive('/notificacoes')}
                                collapsed={isCollapsed && !isMobileMenuOpen}
                                badge={unreadCount > 0 ? unreadCount : undefined}
                            />
                            <SidebarItem
                                icon={<ReformaIcon />}
                                label="Reforma"
                                href="/reformas"
                                active={isActive('/reformas')}
                                collapsed={isCollapsed && !isMobileMenuOpen}
                            />
                        </div>
                    </div>

                    {/* Group: MORE */}
                    <div>
                        {(!isCollapsed || isMobileMenuOpen) && (
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 pl-3">
                                Mais
                            </h3>
                        )}
                        <div className="space-y-1">
                            {isUserAdmin && (
                                <SidebarItem
                                    icon={<AdminIcon />}
                                    label="Administração"
                                    href="/admin"
                                    active={pathname.startsWith('/admin')}
                                    collapsed={isCollapsed && !isMobileMenuOpen}
                                    subItems={[
                                        { label: 'Gerenciar Pautas', href: '/admin/pautas' },
                                        { label: 'Gerenciar Moradores', href: '/admin/moradores' }
                                    ]}
                                />
                            )}
                            <SidebarItem
                                icon={<SettingsIcon />}
                                label="Configurações"
                                href="/configuracoes"
                                active={isActive('/configuracoes')}
                                collapsed={isCollapsed && !isMobileMenuOpen}
                            />
                            <SidebarItem
                                icon={<UtilityIcon />}
                                label="Sobre"
                                href="/sobre"
                                active={isActive('/sobre')}
                                collapsed={isCollapsed && !isMobileMenuOpen}
                            />
                        </div>
                    </div>

                </div>

                {/* Bottom Section */}
                <div className="mt-auto border-t border-slate-800/50">
                    {user && (!isCollapsed || isMobileMenuOpen) ? (
                        <div className="p-4 flex items-center gap-3">
                            <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-lg ring-2 ring-violet-500/20">
                                {user.nome.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-200 truncate leading-tight">
                                    {user.nome.split(' ')[0]}
                                </p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate">
                                    AP {user.apartamento} • {user.torre}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    logout()
                                    router.push('/login')
                                }}
                                className="p-2.5 rounded-xl transition-all duration-200 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                title="Sair da Conta"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                            </button>
                        </div>
                    ) : user && isCollapsed ? (
                        <div className="py-4 flex flex-col items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-violet-500/20">
                                {user.nome.charAt(0).toUpperCase()}
                            </div>
                            <button
                                onClick={() => {
                                    logout()
                                    router.push('/login')
                                }}
                                className="p-2 rounded-lg transition-all duration-200 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                title="Sair"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                            </button>
                        </div>
                    ) : null}
                </div>
            </aside>
        </>
    )
}

// --- Helper Components ---

interface SubItem {
    label: string
    href: string
}

interface SidebarItemProps {
    icon: React.ReactNode
    label: string
    href: string
    active?: boolean
    collapsed?: boolean
    badge?: number
    subItems?: SubItem[]
}

function SidebarItem({ icon, label, href, active, collapsed, badge, subItems }: SidebarItemProps) {
    const [isOpen, setIsOpen] = useState(active || false)
    const pathname = usePathname()

    // O submenu deve abrir se algum filho estiver ativo
    useEffect(() => {
        if (subItems?.some(item => pathname + window.location.search === item.href || (window.location.search.includes(item.href.split('?')[1])))) {
            setIsOpen(true)
        }
    }, [pathname, subItems])

    const hasSubMenu = subItems && subItems.length > 0

    // Se tiver submenu, o link principal alterna a abertura
    // Caso contrário, age como um link normal
    const handleClick = (e: React.MouseEvent) => {
        if (hasSubMenu && !collapsed) {
            e.preventDefault()
            setIsOpen(!isOpen)
        }
    }

    return (
        <div className="mb-0.5">
            <Link
                href={href}
                onClick={handleClick}
                className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
                    ${active && !hasSubMenu
                        ? 'bg-gradient-to-r from-blue-600/90 to-transparent text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }
                    ${hasSubMenu && active ? 'text-blue-200' : ''}
                `}
                title={collapsed ? label : undefined}
            >
                <span className={`flex-shrink-0 ${active ? 'text-blue-200' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {icon}
                </span>

                {!collapsed && (
                    <>
                        <span className="flex-1 font-medium text-sm truncate transition-colors">{label}</span>
                        {hasSubMenu && (
                            <span className={`ml-auto transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </span>
                        )}
                    </>
                )}

                {!collapsed && badge && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold text-center min-w-[20px]">
                        {badge}
                    </span>
                )}
            </Link>

            {/* Submenu */}
            {!collapsed && hasSubMenu && isOpen && (
                <div className="mt-1 ml-4 pl-4 border-l border-slate-800 space-y-1">
                    {subItems.map((subItem) => {
                        const isSubActive = typeof window !== 'undefined' && window.location.href.includes(subItem.href)
                        return (
                            <Link
                                key={subItem.href}
                                href={subItem.href}
                                className={`block px-3 py-2 text-sm rounded-lg transition-colors truncate
                                    ${isSubActive
                                        ? 'text-blue-400 bg-blue-500/10'
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                                    }
                                `}
                            >
                                {subItem.label}
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// --- Icons (Mosaic Style) ---

const DashboardIcon = () => (
    <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
        <path className="fill-current opacity-50" d="M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12 12-5.383 12-12S18.617 0 12 0z" />
        <path className="fill-current" d="M12 3c-4.963 0-9 4.037-9 9s4.037 9 9 9 9-4.037 9-9-4.037-9-9-9z" />
        <path className="fill-current opacity-50" d="M12 15c-1.654 0-3-1.346-3-3 0-.462.113-.894.3-1.285L6 6l4.714 3.301A2.973 2.973 0 0112 9c1.654 0 3 1.346 3 3s-1.346 3-3 3z" />
    </svg>
)

const VoteIcon = () => (
    <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
        <path className="fill-current opacity-50" d="M18.974 8H22a2 2 0 012 2v6h-2v5a1 1 0 01-1 1h-2a1 1 0 01-1-1v-5h-2v-6a2 2 0 012-2h.974zM20 7a2 2 0 11-.001-3.999A2 2 0 0120 7zM2.974 8H6a2 2 0 012 2v6H6v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5H0v-6a2 2 0 012-2h.974zM4 7a2 2 0 11-.001-3.999A2 2 0 014 7z" />
        <path className="fill-current" d="M12 6a3 3 0 110-6 3 3 0 010 6zm2 18h-4a1 1 0 01-1-1v-6H6v-6a3 3 0 013-3h6a3 3 0 013 3v6h-3v6a1 1 0 01-1 1z" />
    </svg>
)

const ChartIcon = () => (
    <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
        <path className="fill-current opacity-50" d="M0 20h24v2H0z" />
        <path className="fill-current" d="M4 18h2a1 1 0 001-1V8a1 1 0 00-1-1H4a1 1 0 00-1 1v9a1 1 0 001 1zM11 18h2a1 1 0 001-1V3a1 1 0 00-1-1h-2a1 1 0 00-1 1v14a1 1 0 001 1zM17 12v5a1 1 0 001 1h2a1 1 0 001-1v-5a1 1 0 00-1-1h-2a1 1 0 00-1 1z" />
    </svg>
)

const UsersIcon = () => (
    <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
        <path className="fill-current opacity-50" d="M18.974 8H22a2 2 0 012 2v6h-2v5a1 1 0 01-1 1h-2a1 1 0 01-1-1v-5h-2v-6a2 2 0 012-2h.974zM20 7a2 2 0 11-.001-3.999A2 2 0 0120 7zM2.974 8H6a2 2 0 012 2v6H6v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5H0v-6a2 2 0 012-2h.974zM4 7a2 2 0 11-.001-3.999A2 2 0 014 7z" />
        <path className="fill-current" d="M12 6a3 3 0 110-6 3 3 0 010 6zm2 18h-4a1 1 0 01-1-1v-6H6v-6a3 3 0 013-3h6a3 3 0 013 3v6h-3v6a1 1 0 01-1 1z" />
    </svg>
)

const NotificationsIcon = () => (
    <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
        <path className="fill-current opacity-50" d="M12 22a2.01 2.01 0 01-2.01-2h4.02c0 1.1-.9 2-2.01 2z" />
        <path className="fill-current" d="M20 15.77V9c0-3.53-2.17-6.52-5.4-7.33v-.67C14.6 0 13.44 0 12 0s-2.6 0-2.6 1v.67C6.17 2.48 4 5.47 4 9v6.77l-2 2h18l-2-2z" />
    </svg>
)

const ReformaIcon = () => (
    <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
        <path className="fill-current opacity-50" d="M3 3h18v6H3z" />
        <path className="fill-current" d="M15 9V7H9v2H7v6h4v6h2v-6h4V9h-2zm-2 10h-2v-4h2v4z" />
    </svg>
)

const AdminIcon = () => (
    <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
        <path className="fill-current opacity-50" d="M6 5V21H18V5z" />
        <path className="fill-current" d="M2 0h20v4H2z" />
        <path className="fill-current" d="M8 8h8v10H8z" />
    </svg>
)

const SettingsIcon = () => (
    <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
        <path className="fill-current opacity-50" d="M24 10h-2.1a10.957 10.957 0 00-1.8-4.3l1.5-1.5-2.8-2.8-1.5 1.5A10.957 10.957 0 0014 2.1V0h-4v2.1a10.957 10.957 0 00-4.3 1.8l-1.5-1.5-2.8 2.8 1.5 1.5A10.957 10.957 0 002.1 10H0v4h2.1a10.957 10.957 0 001.8 4.3l-1.5 1.5 2.8 2.8 1.5-1.5a10.957 10.957 0 004.3 1.8v2.1h4v-2.1a10.957 10.957 0 004.3-1.8l1.5 1.5 2.8-2.8-1.5-1.5a10.957 10.957 0 001.8-4.3H24v-4zM12 17a5 5 0 110-10 5 5 0 010 10z" />
    </svg>
)

const UtilityIcon = () => (
    <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
        <path className="fill-current opacity-50" d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 18a6 6 0 110-12 6 6 0 010 12z" />
        <path className="fill-current" d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z" />
    </svg>
)

const MenuIcon = () => (
    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
        <rect x="4" y="5" width="16" height="2" />
        <rect x="4" y="11" width="16" height="2" />
        <rect x="4" y="17" width="16" height="2" />
    </svg>
)

const ChevronLeftIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24">
        <path className="fill-current" d="M14.7 15.3L11.4 12l3.3-3.3c.4-.4.4-1 0-1.4-.4-.4-1-.4-1.4 0l-4 4c-.4.4-.4 1 0 1.4l4 4c.4.4 1 .4 1.4 0 .4-.4.4-1 0-1.4z" />
    </svg>
)

const ChevronRightIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24">
        <path className="fill-current" d="M9.3 15.3L12.6 12 9.3 8.7c-.4-.4-.4-1 0-1.4.4-.4 1-.4 1.4 0l4 4c.4.4.4 1 0 1.4l-4 4c-.4.4-1 .4-1.4 0-.4-.4-.4-1 0-1.4z" />
    </svg>
)
