'use client'

import { useEffect, useState, useRef } from 'react'
import { api, Pauta, Placar } from '@/lib/api-config'

export function VisualizarPautaTab() {
  // Função para formatar timestamp do Firestore
  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return '-'
    
    // Se for um objeto Timestamp do Firestore
    if (timestamp.seconds !== undefined) {
      const date = new Date(timestamp.seconds * 1000)
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
    
    // Se já for uma string ou Date
    if (typeof timestamp === 'string') {
      return timestamp
    }
    
    if (timestamp instanceof Date) {
      return timestamp.toLocaleString('pt-BR')
    }
    
    return '-'
  }
  const [pautas, setPautas] = useState<Pauta[]>([])
  const [selectedPauta, setSelectedPauta] = useState<string>('')
  const [pautaData, setPautaData] = useState<Pauta | null>(null)
  const [placar, setPlacar] = useState<Placar | null>(null)
  const [votes, setVotes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [showClearModal, setShowClearModal] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [confirmAba, setConfirmAba] = useState('')
  const [showPautaDropdown, setShowPautaDropdown] = useState(false)
  const [pautaSearchTerm, setPautaSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

  useEffect(() => {
    loadPautas()
  }, [])

  useEffect(() => {
    if (selectedPauta) {
      loadPautaData()
    }
  }, [selectedPauta])

  const loadPautas = async () => {
    try {
      const data = await api.getAllPautas()
      setPautas(data)
    } catch (err: any) {
      setMessage({ text: 'Erro ao carregar pautas: ' + err.message, type: 'error' })
    }
  }

  const loadPautaData = async () => {
    try {
      setLoading(true)
      setSearchTerm('') // Limpar busca ao carregar nova pauta
      setCurrentPage(1) // Resetar página
      const [pauta, scores, votesData] = await Promise.all([
        api.getPautaByAba(selectedPauta),
        api.getScores(selectedPauta),
        api.getAllVotesByAba(selectedPauta)
      ])
      setPautaData(pauta)
      setPlacar(scores)
      // Garantir que todos os campos sejam strings para busca
      setVotes(votesData.map((vote: any) => ({
        ...vote,
        cpf: String(vote.cpf || ''),
        nome: String(vote.nome || ''),
        apartamento: String(vote.apartamento || ''),
        torre: String(vote.torre || ''),
        voto: String(vote.voto || '')
      })))
    } catch (err: any) {
      setMessage({ text: 'Erro ao carregar dados: ' + err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar votos baseado no termo de busca
  const filteredVotes = votes.filter(vote => {
    if (!searchTerm || searchTerm.trim() === '') return true
    const search = searchTerm.toLowerCase().trim()
    const cpf = String(vote.cpf || '').toLowerCase()
    const nome = String(vote.nome || '').toLowerCase()
    const voto = String(vote.voto || '').toLowerCase()
    const apartamento = String(vote.apartamento || '').toLowerCase()
    const torre = String(vote.torre || '').toLowerCase()
    
    return (
      cpf.includes(search) ||
      nome.includes(search) ||
      voto.includes(search) ||
      apartamento.includes(search) ||
      torre.includes(search)
    )
  })

  // Calcular paginação
  const totalPages = Math.ceil(filteredVotes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedVotes = filteredVotes.slice(startIndex, endIndex)

  // Resetar página quando busca mudar
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Calcular posição do dropdown quando abrir
  useEffect(() => {
    if (showPautaDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }, [showPautaDropdown])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setShowPautaDropdown(false)
      }
    }

    if (showPautaDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPautaDropdown])

  const handleExport = async () => {
    if (!selectedPauta || !pautaData) return
    
    try {
      setLoading(true)
      
      // Importar xlsx dinamicamente
      const XLSX = await import('xlsx')
      
      // Preparar array completo de dados na ordem correta
      const allData: any[][] = []
      
      // 1. Título (linha 1) - mesclar A1:F1
      allData.push([`Relatório de Votação: ${pautaData.nomePauta}`, '', '', '', '', ''])
      
      // 2. Linha vazia (linha 2)
      allData.push(['', '', '', '', '', ''])
      
      // 3. Informações da pauta (linhas 3-6)
      allData.push(['Descrição:', pautaData.descricao || '-', '', '', '', ''])
      allData.push(['Status:', pautaData.status || '-', '', '', '', ''])
      allData.push(['Total de Votos:', placar?.total || 0, '', '', '', ''])
      allData.push(['Data de Exportação:', new Date().toLocaleString('pt-BR'), '', '', '', ''])
      
      // 4. Linha vazia (linha 7)
      allData.push(['', '', '', '', '', ''])
      
      // 5. Cabeçalhos da tabela (linha 8)
      allData.push(['CPF', 'Nome', 'Apartamento', 'Torre', 'Voto', 'Data/Hora'])
      
      // 6. Dados dos votos (linhas 9+)
      filteredVotes.forEach(vote => {
        allData.push([
          vote.cpf || '-',
          vote.nome || '-',
          vote.apartamento || '-',
          vote.torre || '-',
          vote.voto || '-',
          formatTimestamp(vote.timestamp)
        ])
      })
      
      // Criar worksheet a partir do array completo
      const ws = XLSX.utils.aoa_to_sheet(allData)
      
      // Mesclar células do título (A1:F1)
      if (!ws['!merges']) ws['!merges'] = []
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } })
      
      // Ajustar largura das colunas
      ws['!cols'] = [
        { wch: 18 }, // CPF
        { wch: 45 }, // Nome
        { wch: 12 }, // Apartamento
        { wch: 8 },  // Torre
        { wch: 20 }, // Voto
        { wch: 20 }  // Data/Hora
      ]
      
      // Criar workbook
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Votos')
      
      // Gerar nome do arquivo
      const fileName = `Relatorio_Votacao_${pautaData.nomePauta.replace(/\s+/g, '_')}_${Date.now()}.xlsx`
      
      // Fazer download
      XLSX.writeFile(wb, fileName)
      
      setMessage({ text: 'Exportação concluída com sucesso!', type: 'success' })
    } catch (err: any) {
      setMessage({ text: 'Erro ao exportar: ' + err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleClearVotes = async () => {
    if (!selectedPauta || !pautaData) return
    
    // Validar se o nome da aba foi digitado corretamente
    if (confirmAba !== pautaData.aba) {
      setMessage({ text: 'O nome da aba não confere. Digite exatamente: ' + pautaData.aba, type: 'error' })
      return
    }
    
    try {
      setClearing(true)
      setMessage(null)
      
      // Verificar se a função existe na API
      if (!api.clearVotesByAba) {
        throw new Error('Função de limpar votos não disponível. Verifique se está usando Firebase.')
      }
      
      await api.clearVotesByAba(selectedPauta)
      
      setMessage({ text: 'Votação limpa com sucesso!', type: 'success' })
      setShowClearModal(false)
      setConfirmAba('') // Limpar campo de confirmação
      
      // Recarregar dados
      await loadPautaData()
    } catch (err: any) {
      setMessage({ text: 'Erro ao limpar votação: ' + err.message, type: 'error' })
    } finally {
      setClearing(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Selecione uma Pauta
        </label>
        <div className="flex gap-3">
          <div className="flex-1 relative" style={{ zIndex: 1000 }}>
            <button
              ref={buttonRef}
              type="button"
              onClick={() => setShowPautaDropdown(!showPautaDropdown)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-violet-500 focus:ring-violet-500 h-12 px-4 text-left flex items-center justify-between"
            >
              <span className={selectedPauta ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                {selectedPauta 
                  ? pautas.find(p => p.aba === selectedPauta)?.nomePauta || 'Selecione...'
                  : 'Selecione...'}
              </span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 text-gray-400 transition-transform ${showPautaDropdown ? 'rotate-180' : ''}`} 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z" clipRule="evenodd"/>
              </svg>
            </button>
            
            {showPautaDropdown && (
              <div 
                ref={dropdownRef}
                className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-64 overflow-hidden flex flex-col"
                style={{ 
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                  width: `${dropdownPosition.width}px`
                }}
              >
                {/* Campo de busca */}
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <input
                      type="text"
                      value={pautaSearchTerm}
                      onChange={(e) => setPautaSearchTerm(e.target.value)}
                      placeholder="Buscar pauta..."
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-violet-500 focus:ring-violet-500 h-10 px-4 pl-10 text-sm"
                      autoFocus
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                
                {/* Lista de opções */}
                <div className="overflow-y-auto max-h-52">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPauta('')
                      setShowPautaDropdown(false)
                      setPautaSearchTerm('')
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      !selectedPauta ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Selecione...
                  </button>
                  {pautas
                    .filter(p => 
                      !pautaSearchTerm || 
                      p.nomePauta.toLowerCase().includes(pautaSearchTerm.toLowerCase()) ||
                      p.aba.toLowerCase().includes(pautaSearchTerm.toLowerCase())
                    )
                    .map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedPauta(p.aba)
                          setShowPautaDropdown(false)
                          setPautaSearchTerm('')
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          selectedPauta === p.aba 
                            ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 font-medium' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {p.nomePauta}
                      </button>
                    ))}
                  {pautas.filter(p => 
                    !pautaSearchTerm || 
                    p.nomePauta.toLowerCase().includes(pautaSearchTerm.toLowerCase()) ||
                    p.aba.toLowerCase().includes(pautaSearchTerm.toLowerCase())
                  ).length === 0 && (
                    <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                      Nenhuma pauta encontrada
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={loadPautaData}
            disabled={!selectedPauta || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 text-white px-5 py-3 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed h-12"
          >
            Carregar Dados
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
        }`}>
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {pautaData && (
        <div className="space-y-6">
          {/* Informações da Pauta */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Informações da Pauta</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nome</p>
                <p className="text-base font-medium text-gray-800 dark:text-gray-100">{pautaData.nomePauta}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <p className="text-base font-medium text-gray-800 dark:text-gray-100">{pautaData.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nome da Aba</p>
                <p className="text-base font-medium text-gray-800 dark:text-gray-100">{pautaData.aba}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total de Votos</p>
                <p className="text-base font-medium text-gray-800 dark:text-gray-100">{placar?.total || 0}</p>
              </div>
            </div>
            {pautaData.descricao && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Descrição</p>
              <p className="text-base text-gray-800 dark:text-gray-100">{pautaData.descricao}</p>
            </div>
            )}
            <div className="mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Opções</p>
              <div className="flex flex-wrap gap-2">
                {pautaData.opcoes.map((opcao, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full text-sm bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300"
                  >
                    {opcao}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setShowClearModal(true)}
                disabled={loading || !votes.length}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 text-white px-4 py-2 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48 0a.75.75 0 1 0-1.499-.058l-.347 9a.75.75 0 0 0 1.5.058l.346-9Z" clipRule="evenodd"/>
                </svg>
                Limpar Votação
              </button>
            </div>
          </div>

          {/* Placar */}
          {placar && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Placar</h3>
              <div className="space-y-3">
                {Object.entries(placar.counts || {}).map(([option, count]: [string, any]) => {
                  const pct = placar.total > 0 ? Math.round((count / placar.total) * 100) : 0
                  return (
                    <div key={option}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 dark:text-gray-300">{option}</span>
                        <span className="text-gray-600 dark:text-gray-400">{count} votos ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-violet-500 to-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Votos */}
          {votes.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Votos Registrados ({filteredVotes.length} de {votes.length})
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Campo de Busca */}
                  <div className="relative flex-1 sm:w-64">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por CPF, Nome, Voto..."
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-violet-500 focus:ring-violet-500 h-10 px-4 pl-10 text-sm"
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <button
                    onClick={handleExport}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 text-white px-4 py-2 hover:bg-green-700 disabled:opacity-50 text-sm h-10 whitespace-nowrap"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.25l-3-3a.75.75 0 1 0-1.06 1.06l4.5 4.5a.75.75 0 0 0 1.06 0l4.5-4.5a.75.75 0 1 0-1.06-1.06l-3 3V3a.75.75 0 0 1 .75-.75ZM6.75 15a.75.75 0 0 1 .75.75v2.25a3 3 0 0 0 3 3h2.25a3 3 0 0 0 3-3V15.75a.75.75 0 0 1 1.5 0v2.25a4.5 4.5 0 0 1-4.5 4.5h-2.25a4.5 4.5 0 0 1-4.5-4.5V15.75a.75.75 0 0 1 .75-.75Z" clipRule="evenodd"/>
                    </svg>
                    Exportar Excel
                  </button>
                </div>
              </div>
              
              {filteredVotes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">Nenhum voto encontrado com o termo de busca.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">CPF</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">Nome</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">Apartamento</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">Torre</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">Voto</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">Data/Hora</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedVotes.map((vote, idx) => (
                          <tr key={idx} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{vote.cpf || '-'}</td>
                            <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{vote.nome || '-'}</td>
                            <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{vote.apartamento || '-'}</td>
                            <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{vote.torre || '-'}</td>
                            <td className="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">{vote.voto || '-'}</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{formatTimestamp(vote.timestamp)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Mostrando {startIndex + 1} a {Math.min(endIndex, filteredVotes.length)} de {filteredVotes.length} votos
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          Anterior
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Página {currentPage} de {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          Próxima
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de Confirmação para Limpar Votação */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Confirmar Limpeza de Votação</h3>
                <button
                  onClick={() => {
                    setShowClearModal(false)
                    setConfirmAba('')
                  }}
                  disabled={clearing}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd"/>
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-red-800 dark:text-red-200">Atenção!</p>
                    <p className="text-xs text-red-700 dark:text-red-300">Esta ação não pode ser desfeita.</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Você está prestes a <strong>limpar todos os votos</strong> da pauta <strong>"{pautaData?.nomePauta}"</strong>.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Total de votos que serão removidos: <strong>{placar?.total || 0}</strong>
                </p>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Para confirmar, digite o nome da aba: <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{pautaData?.aba}</code>
                  </label>
                  <input
                    type="text"
                    value={confirmAba}
                    onChange={(e) => setConfirmAba(e.target.value)}
                    placeholder="Digite o nome da aba..."
                    disabled={clearing}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-red-500 focus:ring-red-500 h-11 text-base px-4 font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {confirmAba && confirmAba !== pautaData?.aba && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      O nome da aba não confere
                    </p>
                  )}
                  {confirmAba === pautaData?.aba && (
                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                      ✓ Nome da aba confirmado
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowClearModal(false)
                    setConfirmAba('')
                  }}
                  disabled={clearing}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleClearVotes}
                  disabled={clearing || confirmAba !== pautaData?.aba}
                  className="flex-1 rounded-lg bg-red-600 text-white px-4 py-2 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium inline-flex items-center justify-center gap-2"
                >
                  {clearing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Limpando...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48 0a.75.75 0 1 0-1.499-.058l-.347 9a.75.75 0 0 0 1.5.058l.346-9Z" clipRule="evenodd"/>
                      </svg>
                      Confirmar Limpeza
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

