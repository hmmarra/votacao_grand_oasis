'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/TopBar'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Footer } from '@/components/Footer'
import { useAuth } from '@/lib/auth'
import { VisualizarPautaTab } from '@/components/admin/VisualizarPautaTab'
import { GerenciarPautasTab } from '@/components/admin/GerenciarPautasTab'
import { GerenciarMoradoresTab } from '@/components/admin/GerenciarMoradoresTab'

export default function AdminPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'visualizar' | 'pautas' | 'moradores'>('visualizar')

  return (
    <ProtectedRoute requiredAccess="Administrador">
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
        <TopBar />
        <div className="flex-1 py-6 sm:py-10 px-3 sm:px-4">
          <div className="max-w-7xl mx-auto">
          {/* Título */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Área Administrativa</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Bem-vindo, <span className="font-semibold text-violet-600 dark:text-violet-400">{user?.nome || 'Administrador'}</span>
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 mb-6 overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('visualizar')}
                  className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'visualizar'
                      ? 'text-violet-600 dark:text-violet-400 border-violet-600 dark:border-violet-400 bg-white dark:bg-gray-800'
                      : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Visualizar Pauta
                </button>
                <button
                  onClick={() => setActiveTab('pautas')}
                  className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'pautas'
                      ? 'text-violet-600 dark:text-violet-400 border-violet-600 dark:border-violet-400 bg-white dark:bg-gray-800'
                      : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Gerenciar Pautas
                </button>
                <button
                  onClick={() => setActiveTab('moradores')}
                  className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'moradores'
                      ? 'text-violet-600 dark:text-violet-400 border-violet-600 dark:border-violet-400 bg-white dark:bg-gray-800'
                      : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Gerenciar Moradores
                </button>
              </nav>
            </div>

            <div className="p-6 relative">
              {activeTab === 'visualizar' && <VisualizarPautaTab />}
              {activeTab === 'pautas' && <GerenciarPautasTab />}
              {activeTab === 'moradores' && <GerenciarMoradoresTab />}
            </div>
          </div>
        </div>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}
