'use client'

import { useState } from 'react'
import { X, Calendar, User, Camera, Zap, Plus } from 'lucide-react'

interface VistoriaModalProps {
    isOpen: boolean
    onClose: () => void
    vistoriaForm: {
        data: string
        responsavel: string
        status: string
        observacoes: string
        fotos: string[]
    }
    setVistoriaForm: (form: any) => void
    uploadingVistoria: boolean
    statusLoading: boolean
    handleVistoriaPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
    removeVistoriaPhoto: (idx: number) => void
    saveVistoria: () => void
    getImageUrl: (urlOrKey: string) => string
}

export default function VistoriaModal({
    isOpen,
    onClose,
    vistoriaForm,
    setVistoriaForm,
    uploadingVistoria,
    statusLoading,
    handleVistoriaPhotoUpload,
    removeVistoriaPhoto,
    saveVistoria,
    getImageUrl
}: VistoriaModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transform animate-scaleIn relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <div className="w-10 h-10 bg-teal-100 dark:bg-teal-500/20 rounded-xl flex items-center justify-center text-teal-600 dark:text-teal-400">
                        <Plus className="w-6 h-6" />
                    </div>
                    Nova Vistoria
                </h3>

                <div className="space-y-4">
                    {/* 1. Responsável da Vistoria (primeiro, bloqueado) */}
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Responsável da Vistoria</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={vistoriaForm.responsavel}
                                readOnly
                                disabled
                                className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none"
                            />
                            <User className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
                        </div>
                    </div>

                    {/* 2. Status da Vistoria (segundo) */}
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Status da Vistoria</label>
                        <select
                            value={vistoriaForm.status}
                            onChange={e => setVistoriaForm({ ...vistoriaForm, status: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-teal-500/20 outline-none appearance-none"
                        >
                            <option value="Vistoria Agendada">Vistoria Agendada</option>
                            <option value="Vistoria Aprovada">Vistoria Aprovada</option>
                            <option value="Vistoria Reprovada">Vistoria Reprovada</option>
                            <option value="Cancelada">Cancelada</option>
                        </select>
                    </div>

                    {/* 3. Data da Vistoria (terceiro, com validação para não retroativa se agendada) */}
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Data da Vistoria</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={vistoriaForm.data}
                                min={vistoriaForm.status === 'Vistoria Agendada' ? new Date().toISOString().split('T')[0] : undefined}
                                onChange={e => setVistoriaForm({ ...vistoriaForm, data: e.target.value })}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-teal-500/20 outline-none"
                            />
                            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
                        </div>
                        {vistoriaForm.status === 'Vistoria Agendada' && (
                            <p className="text-[9px] text-teal-600 dark:text-teal-400 mt-1 ml-1">
                                * Vistorias agendadas não podem ter data retroativa
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Observações</label>
                        <textarea
                            value={vistoriaForm.observacoes}
                            onChange={e => setVistoriaForm({ ...vistoriaForm, observacoes: e.target.value })}
                            placeholder="Observações da vistoria..."
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-teal-500/20 outline-none min-h-[100px]"
                        />
                    </div>

                    {/* Fotos - ocultar quando o status não for de conclusão (Aprovada/Reprovada) */}
                    {vistoriaForm.status !== 'Vistoria Agendada' && vistoriaForm.status !== 'Aguardando Vistoria' && vistoriaForm.status !== 'Cancelada' && (
                        <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Fotos da Vistoria</label>
                            <div className="grid grid-cols-4 gap-2">
                                {vistoriaForm.fotos.map((foto, idx) => (
                                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                        <img src={getImageUrl(foto)} className="w-full h-full object-cover" alt="" />
                                        <button
                                            onClick={() => removeVistoriaPhoto(idx)}
                                            className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                <label className="aspect-square rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group">
                                    {uploadingVistoria ? (
                                        <div className="w-5 h-5 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Camera className="w-5 h-5 text-slate-400 group-hover:text-teal-500" />
                                            <span className="text-[9px] text-slate-400 mt-1 font-bold group-hover:text-teal-500">Adicionar</span>
                                        </>
                                    )}
                                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleVistoriaPhotoUpload} disabled={uploadingVistoria} />
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            onClick={saveVistoria}
                            disabled={statusLoading || uploadingVistoria}
                            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {statusLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Zap className="w-4 h-4" />}
                            Salvar Vistoria
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
