'use client'

import { useEffect, useState, useMemo } from 'react'
import { api, Morador } from '@/lib/api-config'
import * as XLSX from 'xlsx'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useAuth } from '@/lib/auth'

export function GerenciarMoradoresTab() {
  const { user } = useAuth()
  const [moradores, setMoradores] = useState<Morador[]>([])

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    cpf: '',
    nome: '',
    apartamento: '',
    torre: '',
    acesso: 'Morador' as 'Administrador' | 'Morador' | 'Engenharia' | 'Desenvolvedor',
    email: '',
    isMaster: false
  })
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [apartamentoFilter, setApartamentoFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [editingMorador, setEditingMorador] = useState<Morador | null>(null)
  const [editFormData, setEditFormData] = useState({
    cpf: '',
    nome: '',
    apartamento: '',
    torre: '',
    acesso: 'Morador' as 'Administrador' | 'Morador' | 'Engenharia' | 'Desenvolvedor',
    email: ''
  })
  const [showDuplicateWarning, setShowDuplicateWarning] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [sortBy, setSortBy] = useState('Mais Recentes')
  const [accessFilter, setAccessFilter] = useState('Todos')

  // Função para formatar data do Firebase
  const formatDate = (date: any) => {
    if (!date) return '-'

    // Se for Timestamp do Firebase
    if (date && typeof date === 'object' && 'seconds' in date) {
      return new Date(date.seconds * 1000).toLocaleDateString('pt-BR')
    }

    // Se for string ou objeto Date
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return '-'
      return d.toLocaleDateString('pt-BR')
    } catch {
      return '-'
    }
  }

  // Bloquear scroll do body quando modais estiverem abertos
  useBodyScrollLock(showModal || showUploadModal || editingMorador !== null)

  useEffect(() => {
    loadMoradores()
  }, [])

  const loadMoradores = async () => {
    try {
      setLoading(true)
      const data = await api.getAllMoradores()
      setMoradores(data)

      setCurrentPage(1) // Resetar para primeira página ao carregar
    } catch (err: any) {
      setMessage({ text: 'Erro ao carregar moradores: ' + err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar moradores baseado no termo de busca e filtro de apartamento
  const filteredMoradores = useMemo(() => {
    let filtered = [...moradores] // Criar cópia para não mutar o estado original

    // Aplicar filtro de apartamento
    if (apartamentoFilter.trim()) {
      const apartamentoTerm = apartamentoFilter.toLowerCase().trim()
      filtered = filtered.filter(morador => {
        const apartamento = (morador.apartamento || '').toLowerCase()
        return apartamento.includes(apartamentoTerm)
      })
    }

    // Aplicar busca geral
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(morador => {
        const nome = (morador.nome || '').toLowerCase()
        const cpf = (morador.cpf || '').toLowerCase()
        const apartamento = (morador.apartamento || '').toLowerCase()
        const torre = (morador.torre || '').toLowerCase()

        return nome.includes(term) ||
          cpf.includes(term) ||
          apartamento.includes(term) ||
          torre.includes(term)
      })
    }

    // Aplicar filtro de acesso
    if (accessFilter !== 'Todos') {
      filtered = filtered.filter(morador => {
        if (accessFilter === 'Administrador') {
          return morador.acesso === 'Administrador' || (morador as any).isMaster === true
        }
        if (accessFilter === 'Engenharia' || accessFilter === 'Desenvolvedor') {
          return morador.acesso === accessFilter
        }
        // Para 'Morador', mostramos apenas os que são comuns (sem isMaster)
        return morador.acesso === 'Morador' && !(morador as any).isMaster
      })
    }

    // Aplicar ordenação
    if (sortBy === 'A-Z (Nome)') {
      filtered.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
    } else if (sortBy === 'Apartamento') {
      filtered.sort((a, b) => {
        const aptA = parseInt(a.apartamento || '0')
        const aptB = parseInt(b.apartamento || '0')
        if (!isNaN(aptA) && !isNaN(aptB) && aptA !== aptB) {
          return aptA - aptB
        }
        return (a.apartamento || '').localeCompare(b.apartamento || '')
      })
    }
    // "Mais Recentes" mantém a ordem original do array (que assumimos ser a ordem de carregamento/criação)

    return filtered
  }, [moradores, searchTerm, apartamentoFilter, sortBy, accessFilter])

  // Resetar para primeira página ao filtrar
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, apartamentoFilter, sortBy, accessFilter])

  // Resetar para primeira página quando mudar itemsPerPage
  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage])

  // Calcular paginação
  const totalPages = Math.ceil(filteredMoradores.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedMoradores = filteredMoradores.slice(startIndex, endIndex)

  const downloadModeloPlanilha = () => {
    // Criar dados de exemplo
    const dadosExemplo = [
      { CPF: '12345678900', Nome: 'João Silva', Apartamento: '101', Torre: '1' },
      { CPF: '98765432100', Nome: 'Maria Santos', Apartamento: '202', Torre: '2' },
      { CPF: '11122233344', Nome: 'Pedro Oliveira', Apartamento: '303', Torre: '1' },
      { CPF: '55566677788', Nome: 'Ana Costa', Apartamento: '404', Torre: '2' }
    ]

    // Criar workbook e worksheet
    const ws = XLSX.utils.json_to_sheet(dadosExemplo)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Moradores')

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 15 }, // CPF
      { wch: 30 }, // Nome
      { wch: 15 }, // Apartamento
      { wch: 10 }  // Torre
    ]
    ws['!cols'] = colWidths

    // Gerar arquivo e fazer download
    XLSX.writeFile(wb, 'modelo_moradores.xlsx')
  }

  const exportMoradoresToExcel = () => {
    try {
      // Preparar dados para exportação
      const dadosExportacao = filteredMoradores.map(morador => ({
        CPF: morador.cpf || '',
        Nome: morador.nome || '',
        Apartamento: morador.apartamento || '',
        Torre: morador.torre || '',
        Acesso: (morador as any).acesso || 'Morador',
        'Usuário Mestre': (morador as any).isMaster ? 'Sim' : 'Não',
        Email: (morador as any).email || ''
      }))

      // Criar workbook e worksheet
      const ws = XLSX.utils.json_to_sheet(dadosExportacao)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Moradores')

      // Ajustar largura das colunas
      const colWidths = [
        { wch: 15 }, // CPF
        { wch: 35 }, // Nome
        { wch: 15 }, // Apartamento
        { wch: 10 }, // Torre
        { wch: 15 }, // Acesso
        { wch: 15 }, // Usuário Mestre
        { wch: 30 }  // Email
      ]
      ws['!cols'] = colWidths

      // Gerar nome do arquivo com data
      const dataAtual = new Date().toISOString().split('T')[0]
      const fileName = `Relatorio_Moradores_${dataAtual}.xlsx`

      // Gerar arquivo e fazer download
      XLSX.writeFile(wb, fileName)

      setMessage({
        text: `Relatório exportado com sucesso! ${filteredMoradores.length} registro(s) exportado(s).`,
        type: 'success'
      })
    } catch (err: any) {
      setMessage({ text: 'Erro ao exportar relatório: ' + err.message, type: 'error' })
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      setMessage(null)
      setUploadProgress(0)

      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          setUploadProgress(10) // Progresso após ler o arquivo

          const arrayBuffer = event.target?.result as ArrayBuffer
          const base64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(arrayBuffer))))

          setUploadProgress(20) // Progresso após converter para base64

          // Parse do Excel no frontend para contar linhas e estimar progresso
          const workbook = XLSX.read(arrayBuffer, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const rows = XLSX.utils.sheet_to_json(worksheet)
          const totalRows = rows.length

          // Calcular tempo estimado: 50 registros por lote, 5 segundos por lote
          const BATCH_SIZE = 50
          const BATCH_DELAY_MS = 5000
          const estimatedBatches = Math.ceil(totalRows / BATCH_SIZE)
          const estimatedTimeMs = estimatedBatches * BATCH_DELAY_MS

          // Mostrar mensagem de processamento em lotes
          setMessage({
            text: `Processando ${totalRows} registros em lotes (50 registros a cada 5 segundos). Tempo estimado: ~${Math.ceil(estimatedTimeMs / 1000)} segundos...`,
            type: 'success'
          })

          // Simular progresso gradualmente enquanto processa
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
              // Aumentar progresso gradualmente até 90%
              // 20% inicial + até 70% durante processamento = 90% máximo
              if (prev < 90) {
                // Calcular incremento baseado no tempo estimado
                const increment = 70 / (estimatedTimeMs / 1000) // 70% dividido pelo tempo em segundos
                return Math.min(90, prev + increment)
              }
              return prev
            })
          }, 1000) // Atualizar a cada segundo

          try {
            const result = await api.processExcelUpload(base64, file.name)

            // Limpar intervalo e ir para 100%
            clearInterval(progressInterval)
            setUploadProgress(100) // Progresso completo

            let messageText = `Upload realizado com sucesso! ${result.inserted} registros inseridos, ${result.updated} registros atualizados.`
            if (result.errors && result.errors.length > 0) {
              messageText += `\n\nAvisos: ${result.errors.length} linha(s) com problemas.`
            }
            setMessage({
              text: messageText,
              type: 'success'
            })

            // Aguardar um pouco para mostrar 100% antes de resetar e fechar modal
            setTimeout(() => {
              setUploadProgress(0)
              setFileInputKey(prev => prev + 1) // Resetar input de arquivo
              loadMoradores()
              // Fechar modal após 2 segundos se sucesso
              setTimeout(() => {
                setShowUploadModal(false)
              }, 2000)
            }, 500)
          } catch (err: any) {
            clearInterval(progressInterval)
            throw err
          }
        } catch (err: any) {
          setMessage({ text: 'Erro ao processar arquivo: ' + err.message, type: 'error' })
          setUploadProgress(0)
        } finally {
          setUploading(false)
        }
      }

      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentLoaded = Math.round((e.loaded / e.total) * 30) // Primeiros 30% para leitura
          setUploadProgress(percentLoaded)
        }
      }

      reader.readAsArrayBuffer(file)
    } catch (err: any) {
      setMessage({ text: 'Erro ao ler arquivo: ' + err.message, type: 'error' })
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async (morador: Morador) => {
    if (!morador.id) {
      setMessage({ text: 'ID do morador não encontrado', type: 'error' })
      return
    }

    if (!confirm(`Tem certeza que deseja excluir o morador ${morador.nome}?`)) return

    try {
      setLoading(true)
      await api.deleteMorador(morador.id)
      setMessage({ text: 'Morador excluído com sucesso!', type: 'success' })
      loadMoradores()
    } catch (err: any) {
      setMessage({ text: 'Erro ao excluir morador: ' + err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMorador = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)
      setMessage(null)

      // Validar restrição de Desenvolvedor
      if (formData.acesso === 'Desenvolvedor' && user?.acesso !== 'Desenvolvedor') {
        throw new Error('Somente desenvolvedores podem cadastrar outros desenvolvedores.')
      }

      // Verificar se api.createMorador existe
      if (!api.createMorador) {
        throw new Error('Função createMorador não disponível. Verifique se está usando Firebase.')
      }

      await api.createMorador({
        cpf: formData.cpf,
        nome: formData.nome,
        apartamento: formData.apartamento,
        torre: formData.torre,
        acesso: formData.acesso,
        email: formData.email || null,
        isMaster: formData.isMaster
      })
      setMessage({ text: 'Morador cadastrado com sucesso!', type: 'success' })
      setShowModal(false)
      setFormData({ cpf: '', nome: '', apartamento: '', torre: '', acesso: 'Morador', email: '', isMaster: false })
      loadMoradores()
    } catch (err: any) {
      if (err.message.includes('já existe') || err.message.includes('já possui um cadastro')) {
        setShowDuplicateWarning(err.message)
      } else {
        setMessage({ text: 'Erro ao cadastrar morador: ' + err.message, type: 'error' })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEditMorador = (morador: Morador) => {
    setEditingMorador(morador)
    setEditFormData({
      cpf: morador.cpf || '',
      nome: morador.nome || '',
      apartamento: morador.apartamento || '',
      torre: morador.torre || '',
      acesso: (morador as any).acesso || 'Morador',
      email: (morador as any).email || ''
    })
  }

  const handleUpdateMorador = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingMorador?.id) {
      setMessage({ text: 'ID do morador não encontrado', type: 'error' })
      return
    }

    try {
      setSaving(true)
      setMessage(null)

      // Validar restrição de Desenvolvedor
      const baseMorador = moradores.find(m => m.id === editingMorador.id)
      const isCurrentlyDev = (baseMorador as any)?.acesso === 'Desenvolvedor'
      const isBecomingDev = editFormData.acesso === 'Desenvolvedor'

      if ((isCurrentlyDev || isBecomingDev) && user?.acesso !== 'Desenvolvedor') {
        throw new Error('Somente desenvolvedores podem gerenciar cadastros de desenvolvedores.')
      }

      if (!api.updateMorador) {
        throw new Error('Função updateMorador não disponível. Verifique se está usando Firebase.')
      }

      await api.updateMorador(editingMorador.id, {
        ...editFormData,
        email: editFormData.email || null,
        isMaster: editFormData.acesso !== 'Morador'
      })
      setMessage({ text: 'Morador atualizado com sucesso!', type: 'success' })
      setEditingMorador(null)
      setEditFormData({ cpf: '', nome: '', apartamento: '', torre: '', acesso: 'Morador', email: '' })
      loadMoradores()
    } catch (err: any) {
      setMessage({ text: 'Erro ao atualizar morador: ' + err.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar de Filtros */}
      <div className="w-full lg:w-64 flex-shrink-0">
        <div className="bg-slate-900/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-4">
          {/* Ação Principal: Novo Morador */}
          <div className="bg-gradient-to-br from-cyan-600 to-blue-800 rounded-xl p-3.5 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-20 h-20 rounded-full bg-white/10 blur-xl"></div>
            <div className="relative z-10">
              <h3 className="font-bold text-sm mb-0.5">Novo Morador?</h3>
              <p className="text-cyan-100 text-[10px] mb-2.5 leading-tight">Cadastre novos moradores para gerenciar seus acessos.</p>
              <button
                onClick={() => {
                  setFormData({
                    cpf: '',
                    nome: '',
                    apartamento: '',
                    torre: '',
                    acesso: 'Morador',
                    email: '',
                    isMaster: false
                  })
                  setEditingMorador(null)
                  setShowModal(true)
                }}
                className="w-full flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 text-white rounded-lg py-1.5 text-[11px] font-semibold transition-all"
              >
                Cadastrar Agora
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 1 1-1.06-1.06l6.22-6.22H3a.75.75 0 0 1 0-1.5h16.19l-6.22-6.22a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="pt-1 border-t border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-800 dark:text-white mt-3 mb-2 text-xs flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-cyan-500" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M3.792 2.938A49.069 49.069 0 0 1 12 2.25c2.797 0 5.462.24 7.962.688.58.104 1.05.513 1.173 1.077 1.343 6.175.28 9.507-.372 10.957-.611 1.36-1.782 2.263-3.235 2.508-2.316.39-5.118.52-8.056.52-2.932 0-5.733-.13-8.046-.52-1.453-.245-2.624-1.148-3.235-2.508-.653-1.45.41-4.782-.932-10.957-.123-.564.347-.973.927-1.077ZM5.75 7.5a.75.75 0 0 1 .75.75v1.5c0 .414.336.75.75.75h1.5a.75.75 0 0 1 0 1.5h-1.5A2.25 2.25 0 0 1 5 9.75v-1.5a.75.75 0 0 1 .75-.75Zm3 0h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1 0-1.5ZM5 14.25a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H5.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
              </svg>
              Ferramentas
            </h4>

            <div className="space-y-1">
              <button
                onClick={() => setShowUploadModal(true)}
                className="w-full flex items-center justify-between p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-[10px] text-slate-700 dark:text-slate-300 font-medium group"
              >
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-400 group-hover:text-cyan-500 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06l-3.22-3.22V16.5a.75.75 0 0 1-1.5 0V4.81L8.03 8.03a.75.75 0 0 1-1.06-1.06l4.5-4.5ZM3 15.75a.75.75 0 0 1 .75.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                  </svg>
                  Importar Planilha
                </span>
              </button>

              <button
                onClick={exportMoradoresToExcel}
                disabled={filteredMoradores.length === 0}
                className="w-full flex items-center justify-between p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-[10px] text-slate-700 dark:text-slate-300 font-medium group disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-400 group-hover:text-green-500 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75ZM6.75 15a.75.75 0 0 1 .75.75v12.25a3 3 0 0 0 3 3h2.25a3 3 0 0 0 3-3V15.75a.75.75 0 0 1 1.5 0v2.25A4.5 4.5 0 0 1 13.5 22.5h-2.25a4.5 4.5 0 0 1-4.5-4.5V15.75a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                  </svg>
                  Exportar CSV/Excel
                </span>
              </button>
            </div>
          </div>

          {/* Ordenação */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-800 dark:text-white mb-2 text-xs flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-cyan-500" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M2.25 4.5A.75.75 0 0 1 3 4.5h18a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1-.75-.75Zm0 15a.75.75 0 0 1 .75-.75h18a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1-.75-.75Zm4.5-7.5a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
              </svg>
              Ordenação
            </h4>
            <div className="flex flex-col gap-0.5">
              {['Mais Recentes', 'A-Z (Nome)', 'Apartamento'].map((option) => (
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

          {/* Filtro de Acesso */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-800 dark:text-white mb-2 text-xs flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-cyan-500" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
              </svg>
              Tipo de Acesso
            </h4>
            <div className="flex flex-col gap-0.5">
              {['Todos', 'Morador', 'Administrador', 'Engenharia', 'Desenvolvedor'].map((option) => (
                <label
                  key={option}
                  className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-all ${accessFilter === option
                    ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-500/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                >
                  <div className={`w-3 h-3 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${accessFilter === option ? 'border-cyan-500' : 'border-slate-400 dark:border-slate-600'
                    }`}>
                    {accessFilter === option && <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />}
                  </div>
                  <span className="text-[10px] font-medium">
                    {option === 'Administrador' ? 'Admin / Master' : option}
                  </span>
                  <input
                    type="radio"
                    name="accessFilter"
                    value={option}
                    checked={accessFilter === option}
                    onChange={(e) => setAccessFilter(e.target.value)}
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
          {/* Barra de Busca (Full Width) */}
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
              placeholder="Buscar por nome, apartamento, torre ou CPF..."
              className="block w-full pl-10 pr-24 py-2.5 bg-white dark:bg-slate-800 border-none rounded-xl shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/50 text-sm transition-all"
            />
            {/* Filtro Apartamento embutido na direita */}
            <div className="absolute inset-y-1.5 right-1.5 flex items-center">
              <input
                type="text"
                value={apartamentoFilter}
                onChange={(e) => setApartamentoFilter(e.target.value)}
                placeholder="Apt. Filter"
                className="w-20 h-full bg-slate-100 dark:bg-slate-700/50 border-none rounded-lg text-xs px-3 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>
          </div>
        </div>

        {/* LIST OF CARDS */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center shadow-sm">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-cyan-600 border-t-transparent"></div>
              <p className="mt-2 text-slate-500">Carregando moradores...</p>
            </div>
          ) : filteredMoradores.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Nenhum resultado encontrado</h3>
              <p className="text-slate-500 dark:text-slate-400">Tente ajustar seus filtros de busca.</p>
            </div>
          ) : (
            paginatedMoradores.map((morador, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-transparent dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 hover:shadow-lg hover:translat-y-[-2px] transition-all group flex flex-col sm:flex-row gap-3 sm:items-center justify-between"
              >
                <div className="flex items-start sm:items-center gap-3">
                  {/* Avatar Placeholder */}
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center flex-shrink-0 text-slate-600 dark:text-slate-300 font-bold text-xs shadow-inner">
                    {morador.nome ? morador.nome.charAt(0).toUpperCase() : '?'}
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight group-hover:text-cyan-500 transition-colors">
                      {morador.nome}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-70" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M3 2.25a.75.75 0 0 0 0 1.5v16.5h-.75a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H18v-1.125a.75.75 0 0 0 .584-1.285l-7.5-7.5a.75.75 0 0 0-1.168 0l-7.5 7.5A.75.75 0 0 0 3 17.625V2.25Zm9 1.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V4.5a.75.75 0 0 1 .75-.75Zm0 4.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                        </svg>
                        Apt: {morador.apartamento}
                      </span>
                      <span className="w-0.5 h-0.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                      <span>Torre: {morador.torre || '-'}</span>
                      <span className="w-0.5 h-0.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                      <span className="font-mono opacity-70">CPF: {morador.cpf}</span>
                      <span className="w-0.5 h-0.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                      <span className="flex items-center gap-1 opacity-70">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9H3.75v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd" />
                        </svg>
                        {formatDate((morador as any).data_cadastro)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pl-12 sm:pl-0">
                  {/* Status Badge */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${(morador as any).acesso === 'Administrador'
                    ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-300'
                    : (morador as any).acesso === 'Engenharia'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300'
                      : (morador as any).acesso === 'Desenvolvedor'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300'
                        : (morador as any).isMaster
                          ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-300'
                          : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300'
                    }`}>
                    {(morador as any).acesso && (morador as any).acesso !== 'Morador'
                      ? (morador as any).acesso
                      : (morador as any).isMaster ? 'Master' : 'Morador'}
                  </span>

                  {/* Actions */}
                  {((morador as any).acesso !== 'Desenvolvedor' || user?.acesso === 'Desenvolvedor') && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditMorador(morador)}
                        className="p-1.5 text-amber-500 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                          <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(morador)}
                        className="p-1.5 text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48 0a.75.75 0 1 0-1.499-.058l-.347 9a.75.75 0 0 0 1.5.058l.346-9Z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Paginação */}
        {(totalPages > 1 || filteredMoradores.length > 0) && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <div>
              Mostrando <strong>{startIndex + 1}-{Math.min(endIndex, filteredMoradores.length)}</strong> de <strong>{filteredMoradores.length}</strong>
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clipRule="evenodd" />
                </svg>
              </button>
              <span className="px-2 font-medium">Página {currentPage}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {
        editingMorador && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-all duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 custom-scrollbar">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                        <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">Editar Morador</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Atualize as informações do morador</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingMorador(null)
                      setEditFormData({ cpf: '', nome: '', apartamento: '', torre: '', acesso: 'Morador', email: '' })
                      setMessage(null)
                    }}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-400 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleUpdateMorador} className="space-y-4">
                  {/* Acesso Toggle na Edição */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Tipo de Acesso <span className="text-red-500">*</span>
                    </label>
                    <div className="flex bg-slate-50 dark:bg-slate-900/50 p-1 rounded-xl h-10 border border-slate-200 dark:border-slate-700/50">
                      {[
                        { id: 'Morador', label: 'Comum' },
                        { id: 'Administrador', label: 'Admin' },
                        { id: 'Engenharia', label: 'Engenharia' },
                        ...(user?.acesso === 'Desenvolvedor' ? [{ id: 'Desenvolvedor', label: 'Dev' }] : [])
                      ].map((role) => (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setEditFormData({ ...editFormData, acesso: role.id as any })}
                          className={`flex-1 flex items-center justify-center rounded-lg text-[11px] font-bold transition-all ${editFormData.acesso === role.id
                            ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                            : 'text-slate-400 hover:text-slate-500 dark:hover:text-slate-300'
                            }`}
                        >
                          {role.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                      CPF <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V3.375c0-1.036-.84-1.875-1.875-1.875H5.625ZM12 7.031a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75Zm-3.75.75a.75.75 0 1 0-1.5 0v1.5a.75.75 0 1 0 1.5 0v-1.5ZM5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V3.375c0-1.036-.84-1.875-1.875-1.875H5.625ZM11.25 7.781a.75.75 0 0 1 1.5 0v1.5a.75.75 0 0 1-1.5 0v-1.5Zm-3.75 0a.75.75 0 1 0-1.5 0v1.5a.75.75 0 1 0 1.5 0v-1.5Zm11.25 0a.75.75 0 1 1 1.5 0v1.5a.75.75 0 1 1-1.5 0v-1.5ZM7.5 13.5h9a.75.75 0 0 0 0-1.5h-9a.75.75 0 0 0 0 1.5Zm0 3h9a.75.75 0 0 0 0-1.5h-9a.75.75 0 0 0 0 1.5Z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={editFormData.cpf}
                        onChange={(e) => setEditFormData({ ...editFormData, cpf: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl h-10 text-xs pl-10 focus:ring-2 focus:ring-cyan-500/30 transition-all text-slate-700 dark:text-slate-200"
                        placeholder="00000000000"
                        required
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Nome Completo <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={editFormData.nome}
                        onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl h-10 text-xs pl-10 focus:ring-2 focus:ring-cyan-500/30 transition-all text-slate-700 dark:text-slate-200"
                        placeholder="Nome completo do morador"
                        required
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 opacity-75">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                        Apartamento
                      </label>
                      <input
                        type="text"
                        value={editFormData.apartamento}
                        onChange={(e) => setEditFormData({ ...editFormData, apartamento: e.target.value })}
                        className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl h-10 text-xs px-4 focus:ring-2 focus:ring-cyan-500/30 transition-all text-slate-500 dark:text-slate-400 cursor-not-allowed"
                        placeholder="34"
                        required={editFormData.acesso === 'Morador'}
                        disabled={true}
                        readOnly
                      />
                    </div>

                    <div className="space-y-1.5 opacity-75">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                        Torre
                      </label>
                      <input
                        type="text"
                        value={editFormData.torre}
                        onChange={(e) => setEditFormData({ ...editFormData, torre: e.target.value })}
                        className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl h-10 text-xs px-4 focus:ring-2 focus:ring-cyan-500/30 transition-all text-slate-500 dark:text-slate-400 cursor-not-allowed"
                        placeholder="2"
                        required={editFormData.acesso === 'Morador'}
                        disabled={true}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Email
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
                          <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl h-10 text-xs pl-10 focus:ring-2 focus:ring-cyan-500/30 transition-all text-slate-700 dark:text-slate-200"
                        placeholder="morador@email.com"
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 rounded-xl">
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 text-center font-medium">
                      ⚠️ Para alterar Unidade/Torre, remova e cadastre novamente.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMorador(null)
                        setEditFormData({ cpf: '', nome: '', apartamento: '', torre: '', acesso: 'Morador', email: '' })
                        setMessage(null)
                      }}
                      disabled={saving}
                      className="flex-1 h-10 rounded-xl border-none bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 font-bold text-xs transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-2 px-6 h-10 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                          </svg>
                          Salvar Alterações
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }

      {/* Modal de Upload de Planilha */}
      {
        showUploadModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Upload de Planilha Excel</h3>
                  <button
                    onClick={() => {
                      if (!uploading) {
                        setShowUploadModal(false)
                        setUploadProgress(0)
                        setMessage(null)
                        setFileInputKey(prev => prev + 1)
                      }
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={uploading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                      <strong>📋 Formato da Planilha:</strong>
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      A planilha deve conter as colunas: <strong>CPF</strong>, <strong>Nome</strong>, <strong>Apartamento</strong>, <strong>Torre</strong>.
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                      Os registros serão atualizados ou inseridos com base nas colunas chave (<strong>Apartamento</strong> e <strong>Torre</strong>).
                    </p>
                  </div>

                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={downloadModeloPlanilha}
                      className="inline-flex items-center gap-2 rounded-lg bg-green-600 text-white px-4 py-2 hover:bg-green-700 text-sm font-medium transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75ZM6.75 15a.75.75 0 0 1 .75.75v2.25a3 3 0 0 0 3 3h2.25a3 3 0 0 0 3-3V15.75a.75.75 0 0 1 1.5 0v2.25A4.5 4.5 0 0 1 13.5 22.5h-2.25a4.5 4.5 0 0 1-4.5-4.5V15.75a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                      </svg>
                      Baixar Modelo de Planilha
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Selecione o arquivo Excel (.xlsx, .xls)
                    </label>
                    <input
                      key={fileInputKey}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {uploading && (
                      <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                        ⏳ Processando arquivo em lotes (50 registros a cada 5 segundos). Isso pode levar alguns minutos para arquivos grandes. Por favor, aguarde...
                      </p>
                    )}
                  </div>

                  {uploadProgress > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Progresso do upload</span>
                        <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-cyan-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {message && (
                    <div className={`p-3 rounded-lg ${message.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                      }`}>
                      <p className="text-sm whitespace-pre-line">{message.text}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (!uploading) {
                          setShowUploadModal(false)
                          setUploadProgress(0)
                          setMessage(null)
                          setFileInputKey(prev => prev + 1)
                        }
                      }}
                      disabled={uploading}
                      className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {uploading ? 'Processando...' : 'Fechar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Modal de Cadastro */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-all duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 custom-scrollbar">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5.25 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM2.25 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM18.75 7.5a.75.75 0 0 0-1.5 0v2.25H15a.75.75 0 0 0 0 1.5h2.25V13.5a.75.75 0 0 0 1.5 0V11.25H21a.75.75 0 0 0 0-1.5h-2.25V7.5Z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Novo Morador</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Preencha os dados de acesso do morador</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setFormData({ cpf: '', nome: '', apartamento: '', torre: '', acesso: 'Morador', email: '', isMaster: false })
                    setMessage(null)
                  }}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-400 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateMorador} className="space-y-4">
                {/* Acesso Toggle */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Tipo de Acesso <span className="text-red-500">*</span>
                  </label>
                  <div className="flex bg-slate-50 dark:bg-slate-900/50 p-1 rounded-xl h-10 border border-slate-200 dark:border-slate-700/50">
                    {[
                      { id: 'Morador', label: 'Comum' },
                      { id: 'Administrador', label: 'Admin' },
                      { id: 'Engenharia', label: 'Engenharia' },
                      ...(user?.acesso === 'Desenvolvedor' ? [{ id: 'Desenvolvedor', label: 'Dev' }] : [])
                    ].map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => {
                          const isTechnical = role.id !== 'Morador'
                          setFormData({
                            ...formData,
                            acesso: role.id as any,
                            isMaster: isTechnical
                          })
                        }}
                        className={`flex-1 flex items-center justify-center rounded-lg text-[11px] font-bold transition-all ${formData.acesso === role.id
                          ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                          : 'text-slate-400 hover:text-slate-500 dark:hover:text-slate-300'
                          }`}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CPF */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                      CPF <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V3.375c0-1.036-.84-1.875-1.875-1.875H5.625ZM12 7.031a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75Zm-3.75.75a.75.75 0 1 0-1.5 0v1.5a.75.75 0 1 0 1.5 0v-1.5ZM5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V3.375c0-1.036-.84-1.875-1.875-1.875H5.625ZM11.25 7.781a.75.75 0 0 1 1.5 0v1.5a.75.75 0 0 1-1.5 0v-1.5Zm-3.75 0a.75.75 0 1 0-1.5 0v1.5a.75.75 0 1 0 1.5 0v-1.5Zm11.25 0a.75.75 0 1 1 1.5 0v1.5a.75.75 0 1 1-1.5 0v-1.5ZM7.5 13.5h9a.75.75 0 0 0 0-1.5h-9a.75.75 0 0 0 0 1.5Zm0 3h9a.75.75 0 0 0 0-1.5h-9a.75.75 0 0 0 0 1.5Z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={formData.cpf}
                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl h-10 text-xs pl-10 focus:ring-2 focus:ring-cyan-500/30 transition-all text-slate-700 dark:text-slate-200"
                        placeholder="000.000.000-00"
                        required
                        disabled={saving}
                      />
                    </div>
                  </div>

                  {/* Nome Completo */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Nome Completo <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl h-10 text-xs pl-10 focus:ring-2 focus:ring-cyan-500/30 transition-all text-slate-700 dark:text-slate-200"
                        placeholder="Nome do morador"
                        required
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Apartamento */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Apartamento {formData.acesso === 'Morador' && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.apartamento}
                      onChange={(e) => setFormData({ ...formData, apartamento: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl h-10 text-xs px-4 focus:ring-2 focus:ring-cyan-500/30 transition-all text-slate-700 dark:text-slate-200"
                      placeholder="Ex: 34"
                      required={formData.acesso === 'Morador'}
                      disabled={saving}
                    />
                  </div>

                  {/* Torre */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Torre {formData.acesso === 'Morador' && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.torre}
                      onChange={(e) => setFormData({ ...formData, torre: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl h-10 text-xs px-4 focus:ring-2 focus:ring-cyan-500/30 transition-all text-slate-700 dark:text-slate-200"
                      placeholder="Ex: 2"
                      required={formData.acesso === 'Morador'}
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
                        <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl h-10 text-xs pl-10 focus:ring-2 focus:ring-cyan-500/30 transition-all text-slate-700 dark:text-slate-200"
                      placeholder="morador@email.com"
                      disabled={saving}
                    />
                  </div>
                </div>


                {/* Info Box */}
                <div className="p-3 bg-cyan-500/5 dark:bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center gap-3">
                  <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 min-w-fit">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-wide">Senha Provisória</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Gerada como: <code className="font-mono bg-cyan-500/20 px-1 py-0.5 rounded text-cyan-700 dark:text-cyan-300 font-bold">
                      {formData.acesso === 'Morador'
                        ? `${formData.apartamento || 'AP'}${formData.torre || 'Torre'}`
                        : 'Senha123456'
                      }
                    </code>
                  </p>
                </div>

                {message && (
                  <div className={`p-3 rounded-xl flex items-start gap-3 mb-4 ${message.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                    }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      {message.type === 'success' ? (
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                      )}
                    </svg>
                    <p className="text-xs font-medium">{message.text}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setFormData({ cpf: '', nome: '', apartamento: '', torre: '', acesso: 'Morador', email: '', isMaster: false })
                    }}
                    className="flex-1 h-10 rounded-xl border-none bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 font-bold text-xs transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-2 px-6 h-10 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" />
                        </svg>
                        Salvar Morador
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Advertência (Duplicidade) */}
      {showDuplicateWarning && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-700/50 p-8 text-center overflow-hidden relative">
            {/* Background Decor */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full -mt-16"></div>

            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto mb-6 shadow-sm border border-amber-100 dark:border-amber-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.401 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                </svg>
              </div>

              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">Registro já existe!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed px-2 font-medium">
                {showDuplicateWarning}
              </p>

              <button
                onClick={() => setShowDuplicateWarning(null)}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 h-12 rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/10 dark:shadow-white/5 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
