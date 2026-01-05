'use client'

import React, { useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { useAuth } from '@/lib/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Footer } from '@/components/Footer'

// --- Notification Modal Component ---
interface NotificationModalProps {
    type: 'success' | 'error'
    message: string
    isOpen: boolean
    onClose: () => void
}

function NotificationModal({ type, message, isOpen, onClose }: NotificationModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl transform transition-all scale-100 animate-scaleIn">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                        {type === 'success' ? (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">
                            {type === 'success' ? 'Sucesso!' : 'Atenção'}
                        </h3>
                        <p className="text-slate-400 text-sm">
                            {message}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-xl transition-colors border border-slate-700"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function ConfiguracoesPage() {
    const { user } = useAuth()
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Modal State
    const [modalOpen, setModalOpen] = useState(false)
    const [modalType, setModalType] = useState<'success' | 'error'>('success')
    const [modalMessage, setModalMessage] = useState('')

    const showModal = (type: 'success' | 'error', message: string) => {
        setModalType(type)
        setModalMessage(message)
        setModalOpen(true)
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!newPassword || !confirmPassword) {
            showModal('error', 'Por favor, preencha todos os campos.')
            return
        }

        if (newPassword.length < 6) {
            showModal('error', 'A nova senha deve ter pelo menos 6 caracteres.')
            return
        }

        if (newPassword !== confirmPassword) {
            showModal('error', 'As senhas não coincidem.')
            return
        }

        if (!user || !user.id) {
            showModal('error', 'Usuário não identificado.')
            return
        }

        if (!db) {
            showModal('error', 'Erro de conexão com o banco de dados.')
            return
        }

        try {
            setIsLoading(true)

            // Update password in Firestore
            // Assuming 'administradores' collection based on existing auth logic
            const userRef = doc(db, 'administradores', user.id)
            await updateDoc(userRef, {
                senha: newPassword
            })

            showModal('success', 'Senha atualizada com sucesso!')
            setNewPassword('')
            setConfirmPassword('')

        } catch (error) {
            console.error('Erro ao atualizar senha:', error)
            showModal('error', 'Erro ao atualizar senha. Tente novamente.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex bg-transparent">
            {/* Modal */}
            <NotificationModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                type={modalType}
                message={modalMessage}
            />

            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 w-full px-4 py-10">
                    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-6">

                        <div className="mb-2">
                            <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
                            <p className="text-slate-400">Gerencie suas informações pessoais e segurança da conta.</p>
                        </div>

                        {/* Grid Container */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                            {/* Card 1: Account Information */}
                            <div className="xl:col-span-1 h-full">
                                <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-700/50 rounded-3xl p-8 shadow-2xl h-full flex flex-col">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-white">Informações da Conta</h2>
                                            <p className="text-slate-400 text-sm">Seus dados cadastrais</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6 flex-1">
                                        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                                            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Nome Completo</p>
                                            <p className="text-white text-lg font-medium">{user?.nome || 'Não informado'}</p>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                                            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Email</p>
                                            <p className="text-white text-lg font-medium">{user?.email || 'Não informado'}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                                                <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Perfil</p>
                                                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 mt-1">
                                                    {user?.acesso || 'N/A'}
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                                                <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Unidade</p>
                                                <p className="text-white text-lg font-medium">{user ? `${user.apartamento} - ${user.torre}` : '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Password Management */}
                            <div className="xl:col-span-1 h-full">
                                <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-700/50 rounded-3xl p-8 shadow-2xl h-full flex flex-col">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-white">Segurança</h2>
                                            <p className="text-slate-400 text-sm">Criar ou alterar sua senha</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handlePasswordChange} className="space-y-6 flex-1 flex flex-col">
                                        <div className="space-y-4 flex-1">
                                            <div>
                                                <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="newPassword">
                                                    Nova Senha
                                                </label>
                                                <input
                                                    id="newPassword"
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                                    placeholder="Digite sua nova senha"
                                                    disabled={isLoading}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="confirmPassword">
                                                    Confirmar Senha
                                                </label>
                                                <input
                                                    id="confirmPassword"
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                                    placeholder="Confirme sua nova senha"
                                                    disabled={isLoading}
                                                />
                                            </div>

                                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                                                <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                <p className="text-amber-200/80 text-sm">
                                                    Use uma senha forte com pelo menos 8 caracteres, incluindo letras, números e símbolos.
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className={`w-full font-bold py-4 rounded-xl shadow-lg shadow-cyan-500/20 transition-all transform mt-4
                                                ${isLoading
                                                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white hover:scale-[1.02] active:scale-[0.98]'
                                                }
                                            `}
                                        >
                                            {isLoading ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Processando...
                                                </span>
                                            ) : 'Atualizar Senha'}
                                        </button>
                                    </form>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
                <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-4">
                    <Footer />
                </div>
            </div>
        </div>
    )
}
