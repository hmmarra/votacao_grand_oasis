'use client'

import { Sidebar } from '@/components/Sidebar'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Footer } from '@/components/Footer'
import { VisualizarPautaTab } from '@/components/admin/VisualizarPautaTab'

export default function AdminVisualizarPage() {
    return (
        <ProtectedRoute requiredAccess="Administrador">
            <div className="min-h-screen flex bg-transparent">
                <Sidebar isAdmin={true} />
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex-1 pt-24 lg:pt-10 pb-6 lg:pb-10 px-3 sm:px-4">
                        <div className="max-w-7xl mx-auto">
                            <div className="mb-6">
                                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Visualizar Pauta</h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Visualize como a pauta aparece para os moradores.
                                </p>
                            </div>

                            <VisualizarPautaTab />
                        </div>
                    </div>
                    <Footer />
                </div>
            </div>
        </ProtectedRoute>
    )
}
