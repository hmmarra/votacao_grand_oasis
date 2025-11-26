'use client'

import { useEffect, useState } from 'react'
import { api, Morador } from '@/lib/api-config'
import * as XLSX from 'xlsx'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'

export function GerenciarMoradoresTab() {
  const [moradores, setMoradores] = useState<Morador[]>([])
  const [filteredMoradores, setFilteredMoradores] = useState<Morador[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    cpf: '',
    nome: '',
    apartamento: '',
    torre: '',
    acesso: 'Morador' as 'Administrador' | 'Morador',
    email: '',
    isMaster: false
  })
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [uploadProgress, setUploadProgress] = useState(0)
  const [editingMorador, setEditingMorador] = useState<Morador | null>(null)
  const [editFormData, setEditFormData] = useState({
    cpf: '',
    nome: '',
    apartamento: '',
    torre: ''
  })
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)
  
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
      setFilteredMoradores(data)
      setCurrentPage(1) // Resetar para primeira página ao carregar
    } catch (err: any) {
      setMessage({ text: 'Erro ao carregar moradores: ' + err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar moradores baseado no termo de busca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMoradores(moradores)
      setCurrentPage(1)
      return
    }

    const term = searchTerm.toLowerCase().trim()
    const filtered = moradores.filter(morador => {
      const nome = (morador.nome || '').toLowerCase()
      const cpf = (morador.cpf || '').toLowerCase()
      const apartamento = (morador.apartamento || '').toLowerCase()
      const torre = (morador.torre || '').toLowerCase()
      
      return nome.includes(term) || 
             cpf.includes(term) || 
             apartamento.includes(term) || 
             torre.includes(term)
    })
    
    setFilteredMoradores(filtered)
    setCurrentPage(1) // Resetar para primeira página ao filtrar
  }, [searchTerm, moradores])

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
          setUploadProgress(30) // Progresso após ler o arquivo
          
          const arrayBuffer = event.target?.result as ArrayBuffer
          const base64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(arrayBuffer))))
          
          setUploadProgress(50) // Progresso após converter para base64
          
          const result = await api.processExcelUpload(base64, file.name)
          
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
      setMessage({ text: 'Erro ao cadastrar morador: ' + err.message, type: 'error' })
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
      torre: morador.torre || ''
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
      
      if (!api.updateMorador) {
        throw new Error('Função updateMorador não disponível. Verifique se está usando Firebase.')
      }
      
      await api.updateMorador(editingMorador.id, editFormData)
      setMessage({ text: 'Morador atualizado com sucesso!', type: 'success' })
      setEditingMorador(null)
      setEditFormData({ cpf: '', nome: '', apartamento: '', torre: '' })
      loadMoradores()
    } catch (err: any) {
      setMessage({ text: 'Erro ao atualizar morador: ' + err.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Gerenciar Moradores</h3>
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white px-4 py-2.5 hover:bg-indigo-700 text-sm font-medium transition-colors h-10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06l-3.22-3.22V16.5a.75.75 0 0 1-1.5 0V4.81L8.03 8.03a.75.75 0 0 1-1.06-1.06l4.5-4.5ZM3 15.75a.75.75 0 0 1 .75.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd"/>
            </svg>
            Upload Planilha
          </button>
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
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 text-white px-4 py-2.5 hover:bg-violet-700 text-sm font-medium transition-colors h-10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd"/>
            </svg>
            Novo Usuário
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
        }`}>
          <p className="text-sm whitespace-pre-line">{message.text}</p>
        </div>
      )}

      {/* Busca e Controles */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:max-w-md">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar Morador
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, CPF, apartamento ou torre..."
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-violet-500 focus:ring-violet-500 h-11 text-base px-4 pl-10"
              />
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 absolute left-3 top-3 text-gray-400" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd"/>
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredMoradores.length === moradores.length ? (
              <span>Total: <strong>{moradores.length}</strong> morador(es)</span>
            ) : (
              <span>Mostrando <strong>{filteredMoradores.length}</strong> de <strong>{moradores.length}</strong> morador(es)</span>
            )}
          </div>
        </div>
      </div>

      {/* Moradores Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">CPF</th>
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Nome</th>
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Apartamento</th>
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Torre</th>
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Acesso</th>
                <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-violet-600 border-t-transparent"></div>
                    <p className="mt-2">Carregando...</p>
                  </td>
                </tr>
              ) : filteredMoradores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'Nenhum morador encontrado com o termo de busca' : 'Nenhum morador cadastrado'}
                  </td>
                </tr>
              ) : (
                paginatedMoradores.map((morador, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4 text-gray-800 dark:text-gray-100">{morador.cpf || '-'}</td>
                    <td className="py-3 px-4 text-gray-800 dark:text-gray-100">{morador.nome || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{morador.apartamento || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{morador.torre || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (morador as any).isMaster 
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                          : (morador as any).acesso === 'Administrador'
                          ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                      }`}>
                        {(morador as any).isMaster 
                          ? 'Administrador (Mestre)'
                          : (morador as any).acesso || 'Morador'
                        }
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditMorador(morador)}
                          className="p-2 rounded-lg text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                          title="Editar morador"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z"/>
                            <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(morador)}
                          className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Excluir morador"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48 0a.75.75 0 1 0-1.499-.058l-.347 9a.75.75 0 0 0 1.5.058l.346-9Z" clipRule="evenodd"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando <strong>{startIndex + 1}</strong> a <strong>{Math.min(endIndex, filteredMoradores.length)}</strong> de <strong>{filteredMoradores.length}</strong> resultado(s)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 0 1 0 1.06l-6.22 6.22H21a.75.75 0 0 1 0 1.5H4.81l6.22 6.22a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd"/>
                </svg>
                Anterior
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  // Mostrar apenas algumas páginas ao redor da atual
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-violet-600 text-white'
                            : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-2 text-gray-400">...</span>
                  }
                  return null
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                Próxima
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 1 1-1.06-1.06l6.22-6.22H3a.75.75 0 0 1 0-1.5h16.19l-6.22-6.22a.75.75 0 0 1 0-1.06Z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {editingMorador && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Editar Morador</h3>
                <button
                  onClick={() => {
                    setEditingMorador(null)
                    setEditFormData({ cpf: '', nome: '', apartamento: '', torre: '' })
                    setMessage(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpdateMorador} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CPF <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.cpf}
                    onChange={(e) => setEditFormData({ ...editFormData, cpf: e.target.value })}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-violet-500 focus:ring-violet-500 h-11 text-base px-4"
                    placeholder="00000000000"
                    required
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.nome}
                    onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-violet-500 focus:ring-violet-500 h-11 text-base px-4"
                    placeholder="Nome completo do morador"
                    required
                    disabled={saving}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Apartamento <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editFormData.apartamento}
                      onChange={(e) => setEditFormData({ ...editFormData, apartamento: e.target.value })}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white bg-gray-100 dark:bg-gray-600 cursor-not-allowed h-11 text-base px-4"
                      placeholder="34"
                      required
                      disabled={true}
                      readOnly
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Não é possível alterar o apartamento
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Torre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editFormData.torre}
                      onChange={(e) => setEditFormData({ ...editFormData, torre: e.target.value })}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white bg-gray-100 dark:bg-gray-600 cursor-not-allowed h-11 text-base px-4"
                      placeholder="2"
                      required
                      disabled={true}
                      readOnly
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Não é possível alterar a torre
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMorador(null)
                      setEditFormData({ cpf: '', nome: '', apartamento: '', torre: '' })
                      setMessage(null)
                    }}
                    disabled={saving}
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-lg bg-violet-600 text-white px-4 py-2 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium inline-flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd"/>
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
      )}

      {/* Modal de Upload de Planilha */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
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
                    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd"/>
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
                      <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75ZM6.75 15a.75.75 0 0 1 .75.75v2.25a3 3 0 0 0 3 3h2.25a3 3 0 0 0 3-3V15.75a.75.75 0 0 1 1.5 0v2.25A4.5 4.5 0 0 1 13.5 22.5h-2.25a4.5 4.5 0 0 1-4.5-4.5V15.75a.75.75 0 0 1 .75-.75Z" clipRule="evenodd"/>
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
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {uploading && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Processando arquivo...
                    </p>
                  )}
                </div>

                {uploadProgress > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Progresso do upload</span>
                      <span className="text-sm font-medium text-violet-600 dark:text-violet-400">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-violet-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {message && (
                  <div className={`p-3 rounded-lg ${
                    message.type === 'success' 
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
      )}

      {/* Modal de Cadastro */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Cadastrar Novo Morador</h3>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setFormData({ cpf: '', nome: '', apartamento: '', torre: '', acesso: 'Morador', email: '', isMaster: false })
                    setMessage(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateMorador} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CPF <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-violet-500 focus:ring-violet-500 h-11 text-base px-4"
                    placeholder="00000000000"
                    required
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-violet-500 focus:ring-violet-500 h-11 text-base px-4"
                    placeholder="Nome completo do morador"
                    required
                    disabled={saving}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Apartamento <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.apartamento}
                      onChange={(e) => setFormData({ ...formData, apartamento: e.target.value })}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-violet-500 focus:ring-violet-500 h-11 text-base px-4"
                      placeholder="34"
                      required
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Torre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.torre}
                      onChange={(e) => setFormData({ ...formData, torre: e.target.value })}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-violet-500 focus:ring-violet-500 h-11 text-base px-4"
                      placeholder="2"
                      required
                      disabled={saving}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-violet-500 focus:ring-violet-500 h-11 text-base px-4"
                    placeholder="usuario@exemplo.com"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Acesso <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.acesso}
                    onChange={(e) => setFormData({ ...formData, acesso: e.target.value as 'Administrador' | 'Morador' })}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-violet-500 focus:ring-violet-500 h-11 text-base px-4"
                    required
                    disabled={saving}
                  >
                    <option value="Morador">Morador</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isMaster"
                    checked={formData.isMaster}
                    onChange={(e) => setFormData({ ...formData, isMaster: e.target.checked })}
                    disabled={saving || formData.acesso !== 'Administrador'}
                    className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="isMaster" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Usuário Mestre
                  </label>
                </div>
                {formData.acesso !== 'Administrador' && formData.isMaster && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    ⚠️ Apenas Administradores podem ser marcados como Mestre
                  </p>
                )}

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>ℹ️ Informação:</strong> A senha será gerada automaticamente como: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{formData.apartamento || 'AP'}{formData.torre || 'Torre'}</code>
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setFormData({ cpf: '', nome: '', apartamento: '', torre: '', acesso: 'Morador', email: '', isMaster: false })
                      setMessage(null)
                    }}
                    disabled={saving}
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-lg bg-violet-600 text-white px-4 py-2 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium inline-flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd"/>
                        </svg>
                        Salvar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

