'use client'

import { useEffect, useState, useMemo } from 'react'
import { api, Pauta, Placar } from '@/lib/api-config'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useRouter } from 'next/navigation'

export function GerenciarPautasTab() {
  const router = useRouter()
  const [pautas, setPautas] = useState<Pauta[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [infoPlacar, setInfoPlacar] = useState<Placar | null>(null)
  const [infoPauta, setInfoPauta] = useState<Pauta | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(false)

  // Bloquear scroll do body quando modal estiver aberto
  useBodyScrollLock(showModal || showInfoModal)

  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    nomePauta: '',
    descricao: '',
    opcoes: '',
    status: 'Votação Bloqueada' as 'Votação Bloqueada' | 'Votação Planejada' | 'Votação Liberada',
    aba: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Filtros e Pesquisa
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [sortBy, setSortBy] = useState('Mais Recentes')

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)

  useEffect(() => {
    loadPautas()
  }, [])

  const loadPautas = async () => {
    try {
      setLoading(true)
      const data = await api.getAllPautas()
      setPautas(data)
      setCurrentPage(1)
    } catch (err: any) {
      setMessage({ text: 'Erro ao carregar pautas: ' + err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const toCamelCase = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .split(' ')
      .map((word, index) => {
        if (index === 0) return word
        return word.charAt(0).toUpperCase() + word.slice(1)
      })
      .join('')
  }

  const handleNomePautaChange = (value: string) => {
    setFormData({
      ...formData,
      nomePauta: value,
      aba: toCamelCase(value)
    })
  }

  const openModal = (index?: number) => {
    if (index !== undefined) {
      const pauta = filteredPautas[index]
      setFormData({
        nomePauta: pauta.nomePauta,
        descricao: pauta.descricao || '',
        opcoes: pauta.opcoes.join(', '),
        status: pauta.status as 'Votação Bloqueada' | 'Votação Planejada' | 'Votação Liberada',
        aba: pauta.aba
      })
      setEditingIndex(index)
    } else {
      setFormData({
        nomePauta: '',
        descricao: '',
        opcoes: '',
        status: 'Votação Bloqueada' as const,
        aba: ''
      })
      setEditingIndex(null)
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.nomePauta || !formData.opcoes) {
      setMessage({ text: 'Por favor, preencha todos os campos obrigatórios.', type: 'error' })
      return
    }

    try {
      setLoading(true)
      const opcoesArray = formData.opcoes.split(',').map(o => o.trim()).filter(o => o)

      const targetPauta = editingIndex !== null ? filteredPautas[editingIndex] : null

      if (targetPauta && targetPauta.id) {
        await api.updatePauta(targetPauta.id, {
          nomePauta: formData.nomePauta,
          descricao: formData.descricao,
          opcoes: opcoesArray,
          status: formData.status,
          aba: formData.aba
        })
        setMessage({ text: 'Pauta atualizada com sucesso!', type: 'success' })
      } else {
        await api.savePauta({
          nomePauta: formData.nomePauta,
          descricao: formData.descricao,
          opcoes: opcoesArray,
          status: formData.status,
          aba: formData.aba
        })
        setMessage({ text: 'Pauta criada com sucesso!', type: 'success' })
      }

      setShowModal(false)
      loadPautas()
    } catch (err: any) {
      setMessage({ text: 'Erro ao salvar pauta: ' + err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (pauta: Pauta) => {
    if (!pauta.id) return
    if (!confirm(`Tem certeza que deseja excluir a pauta "${pauta.nomePauta}"?`)) return

    try {
      setLoading(true)
      await api.deletePauta(pauta.id)
      setMessage({ text: 'Pauta excluída com sucesso!', type: 'success' })
      loadPautas()
    } catch (err: any) {
      setMessage({ text: 'Erro ao excluir pauta: ' + err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const openInfoModal = async (pauta: Pauta) => {
    try {
      setLoadingInfo(true)
      setInfoPauta(pauta)
      const data = await api.getScores(pauta.aba)
      setInfoPlacar(data)
      setShowInfoModal(true)
    } catch (err: any) {
      setMessage({ text: 'Erro ao carregar dados da votação: ' + err.message, type: 'error' })
    } finally {
      setLoadingInfo(false)
    }
  }

  // Filtragem e Ordenação
  const filteredPautas = useMemo(() => {
    let filtered = [...pautas]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p =>
        p.nomePauta.toLowerCase().includes(term) ||
        p.aba.toLowerCase().includes(term) ||
        (p.descricao || '').toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'Todos') {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    if (sortBy === 'A-Z (Nome)') {
      filtered.sort((a, b) => a.nomePauta.localeCompare(b.nomePauta))
    } else if (sortBy === 'Aba') {
      filtered.sort((a, b) => a.aba.localeCompare(b.aba))
    } else if (sortBy === 'Mais Recentes') {
      // Ordenação padrão por ID (Firebase costuma vir em ordem cronológica)
      filtered.reverse()
    }

    return filtered
  }, [pautas, searchTerm, statusFilter, sortBy])

  // Resetar página ao filtrar
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, sortBy])

  // Paginação
  const totalPages = Math.ceil(filteredPautas.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPautas = filteredPautas.slice(startIndex, endIndex)

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar de Filtros */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-slate-900/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-4">
            {/* Ação Principal: Nova Pauta */}
            <div className="bg-gradient-to-br from-cyan-600 to-blue-800 rounded-xl p-3.5 text-white shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-20 h-20 rounded-full bg-white/10 blur-xl"></div>
              <div className="relative z-10">
                <h3 className="font-bold text-sm mb-0.5">Nova Pauta?</h3>
                <p className="text-cyan-100 text-[10px] mb-2.5 leading-tight">Crie novas pautas para votação no condomínio.</p>
                <button
                  onClick={() => openModal()}
                  className="w-full flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 text-white rounded-lg py-1.5 text-[11px] font-semibold transition-all"
                >
                  Criar Agora
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 1 1-1.06-1.06l6.22-6.22H3a.75.75 0 0 1 0-1.5h16.19l-6.22-6.22a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Ordenação */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-slate-800 dark:text-white mb-2 text-xs flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-500" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M2.25 4.5A.75.75 0 0 1 3 4.5h18a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1-.75-.75Zm0 15a.75.75 0 0 1 .75-.75h18a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1-.75-.75Zm4.5-7.5a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                </svg>
                Ordenação
              </h4>
              <div className="flex flex-col gap-0.5">
                {['Mais Recentes', 'A-Z (Nome)', 'Aba'].map((option) => (
                  <label
                    key={option}
                    className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-all ${sortBy === option
                      ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-500/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    <div className={`w-3 h-3 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${sortBy === option ? 'border-cyan-500' : 'border-slate-400 dark:border-slate-600'
                      }`}>
                      {sortBy === option && <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />}
                    </div>
                    <span className="text-[10px] font-medium">
                      {option}
                    </span>
                    <input
                      type="radio"
                      name="sort"
                      value={option}
                      checked={sortBy === option}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="hidden"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Filtro de Status */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-slate-800 dark:text-white mb-2 text-xs flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-500" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clipRule="evenodd" />
                </svg>
                Status da Votação
              </h4>
              <div className="flex flex-col gap-0.5">
                {['Todos', 'Votação Liberada', 'Votação Planejada', 'Votação Bloqueada'].map((option) => (
                  <label
                    key={option}
                    className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-all ${statusFilter === option
                      ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-500/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    <div className={`w-3 h-3 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${statusFilter === option ? 'border-cyan-500' : 'border-slate-400 dark:border-slate-600'
                      }`}>
                      {statusFilter === option && <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />}
                    </div>
                    <span className="text-[10px] font-medium">
                      {option}
                    </span>
                    <input
                      type="radio"
                      name="statusFilter"
                      value={option}
                      checked={statusFilter === option}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="hidden"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Lista Principal */}
        <div className="flex-1 min-w-0">
          {/* Header da Lista */}
          <div className="flex flex-col mb-4">
            <div className="relative group w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 group-focus-within:text-cyan-500 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome da pauta, aba ou descrição..."
                className="block w-full pl-10 pr-6 py-2.5 bg-white dark:bg-slate-800 border-none rounded-xl shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/50 text-sm transition-all"
              />
            </div>
          </div>

          {/* Cards de Pautas */}
          <div className="grid grid-cols-1 gap-3">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-cyan-500/20 border-t-cyan-600 rounded-full animate-spin"></div>
              </div>
            )}

            {!loading && paginatedPautas.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-slate-500 font-medium">Nenhuma pauta encontrada</p>
              </div>
            )}

            {!loading && paginatedPautas.map((pauta, localIndex) => {
              const globalIndex = startIndex + localIndex;
              return (
                <div
                  key={pauta.id || globalIndex}
                  onClick={() => router.push('/admin/visualizar?aba=' + pauta.aba)}
                  className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-transparent dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 hover:shadow-lg transition-all group flex flex-col sm:flex-row gap-3 sm:items-center justify-between cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    {/* Icon Placeholder */}
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center flex-shrink-0 text-slate-600 dark:text-slate-300 font-bold text-xs shadow-inner transition-transform group-hover:scale-110">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-70" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875V1.5H5.625Z" />
                        <path d="M16.125 1.5v7.5h7.5V1.5h-7.5Z" />
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight group-hover:text-cyan-500 transition-colors truncate">
                        {pauta.nomePauta}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-70" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm3 3V6h12v3H6Zm0 1.5v3h12v-3H6ZM6 18v-3h12v3H6Z" clipRule="evenodd" />
                          </svg>
                          Aba: {pauta.aba}
                        </span>
                        <span className="w-0.5 h-0.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-70" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                            <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clipRule="evenodd" />
                          </svg>
                          {pauta.opcoes.length} opções
                        </span>
                        {pauta.descricao && (
                          <>
                            <span className="w-0.5 h-0.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                            <span className="italic opacity-70 truncate max-w-[150px]">{pauta.descricao}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pl-12 sm:pl-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${pauta.status === 'Votação Liberada'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300'
                      : pauta.status === 'Votação Planejada'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300'
                      }`}>
                      {pauta.status}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(globalIndex);
                        }}
                        className="p-1.5 text-amber-500 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                          <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(pauta);
                        }}
                        className="p-1.5 text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48 0a.75.75 0 1 0-1.499-.058l-.347 9a.75.75 0 0 0 1.5.058l.346-9Z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginação */}
          {!loading && paginatedPautas.length > 0 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
              <div className="font-medium">
                Mostrando <span className="text-slate-900 dark:text-white font-bold">{startIndex + 1}-{Math.min(endIndex, filteredPautas.length)}</span> de <span className="text-slate-900 dark:text-white font-bold">{filteredPautas.length}</span>
              </div>

              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="px-3 py-1 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300">
                  Página {currentPage}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Reutilizando o Estilo Premium */}
      {
        showModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-cyan-600/10 to-transparent"></div>

              <div className="p-8 relative">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-cyan-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-cyan-600/30">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                        <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {editingIndex !== null ? 'Editar Pauta' : 'Nova Pauta'}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Informe os dados da votação</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="h-9 w-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-all active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Título da Pauta</label>
                    <input
                      type="text"
                      value={formData.nomePauta}
                      onChange={(e) => handleNomePautaChange(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Identificador de Aba</label>
                    <input
                      type="text"
                      value={formData.aba}
                      readOnly
                      className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-xl px-4 py-3 text-sm font-mono text-slate-500 dark:text-slate-400 opacity-60 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/20 transition-all appearance-none cursor-pointer"
                    >
                      <option value="Votação Bloqueada">Votação Bloqueada</option>
                      <option value="Votação Planejada">Votação Planejada</option>
                      <option value="Votação Liberada">Votação Liberada</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Descrição</label>
                    <textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      rows={3}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Opções (Separadas por vírgula)</label>
                    <input
                      type="text"
                      value={formData.opcoes}
                      onChange={(e) => setFormData({ ...formData, opcoes: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-10">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-3.5 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-800 text-white py-3.5 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-cyan-600/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Salvando...' : 'Salvar Pauta'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Modal de Informações Rápidas (Placar) */}
      {
        showInfoModal && infoPauta && infoPlacar && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-white/10 relative">
              <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-cyan-600/10 to-transparent"></div>

              <div className="p-8 relative">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-cyan-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-cyan-600/30">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875s1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875s1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875s-1.875-.84-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875s1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875S3 21 3 19.875v-6.75Z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                        {infoPauta.nomePauta}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Resumo da Votação</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowInfoModal(false)}
                    className="h-9 w-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-all active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Status Atual</p>
                      <span className={`text-[11px] font-bold uppercase ${infoPauta.status === 'Votação Liberada' ? 'text-emerald-500' : infoPauta.status === 'Votação Planejada' ? 'text-blue-500' : 'text-amber-500'}`}>
                        {infoPauta.status}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total de Votos</p>
                      <span className="text-xl font-black text-slate-900 dark:text-white">
                        {infoPlacar.total}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Resultados por Opção</p>
                    <div className="space-y-5">
                      {Object.entries(infoPlacar.counts).map(([option, count]) => {
                        const percentage = infoPlacar.total > 0 ? Math.round((count / infoPlacar.total) * 100) : 0;
                        return (
                          <div key={option} className="space-y-2">
                            <div className="flex justify-between items-end">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{option}</span>
                              <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 px-2 py-0.5 rounded-full">
                                {count} votos ({percentage}%)
                              </span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-1000"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setShowInfoModal(false);
                        router.push('/admin/visualizar?aba=' + infoPauta.aba);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Ver Relatório Completo
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 1 1-1.06-1.06l6.22-6.22H3a.75.75 0 0 1 0-1.5h16.19l-6.22-6.22a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Alerta de Mensagem */}
      {
        message && (
          <div className={`fixed top-6 right-6 z-[60] flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl backdrop-blur-md animate-in slide-in-from-right duration-500 ${message.type === 'success'
            ? 'bg-emerald-50/90 dark:bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-50/90 dark:bg-red-500/10 border-red-200/50 dark:border-red-500/20 text-red-600 dark:text-red-400'
            }`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
              }`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                {message.type === 'success' ? (
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.74-5.24Z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                )}
              </svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-2 hover:opacity-70 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
    </>
  )
}
