'use client'

import { useEffect, useState } from 'react'
import { api, Pauta } from '@/lib/api-config'

export function GerenciarPautasTab() {
  const [pautas, setPautas] = useState<Pauta[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    nomePauta: '',
    descricao: '',
    opcoes: '',
    status: 'Votação Bloqueada',
    aba: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    loadPautas()
  }, [])

  const loadPautas = async () => {
    try {
      const data = await api.getAllPautas()
      setPautas(data)
    } catch (err: any) {
      setMessage({ text: 'Erro ao carregar pautas: ' + err.message, type: 'error' })
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
      const pauta = pautas[index]
      setFormData({
        nomePauta: pauta.nomePauta,
        descricao: pauta.descricao || '',
        opcoes: pauta.opcoes.join(', '),
        status: pauta.status,
        aba: pauta.aba
      })
      setEditingIndex(index)
    } else {
      setFormData({
        nomePauta: '',
        descricao: '',
        opcoes: '',
        status: 'Votação Bloqueada',
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
      
      // Se está editando, usar updatePauta. Se não, usar savePauta
      if (editingIndex !== null && pautas[editingIndex]?.id) {
        // Edição: usar updatePauta com o ID
        await api.updatePauta(pautas[editingIndex].id, {
          nomePauta: formData.nomePauta,
          descricao: formData.descricao,
          opcoes: opcoesArray,
          status: formData.status,
          aba: formData.aba
        })
        setMessage({ text: 'Pauta atualizada com sucesso!', type: 'success' })
      } else {
        // Criação: usar savePauta
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

  const handleDelete = async (index: number) => {
    if (!confirm('Tem certeza que deseja excluir esta pauta?')) return

    try {
      setLoading(true)
      const pauta = pautas[index]
      if (!pauta.id) {
        throw new Error('ID da pauta não encontrado')
      }
      await api.deletePauta(pauta.id)
      setMessage({ text: 'Pauta excluída com sucesso!', type: 'success' })
      loadPautas()
    } catch (err: any) {
      setMessage({ text: 'Erro ao excluir pauta: ' + err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Gerenciar Pautas</h3>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 text-white px-5 py-3 hover:bg-violet-700 text-base h-12"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.06l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 0 0 1.061 1.06l8.69-8.69Z"/>
            <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z"/>
          </svg>
          Nova Pauta
        </button>
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

      {/* Cards para telas menores */}
      <div className="block md:hidden space-y-4">
        {pautas.map((pauta, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
          >
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nome</p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{pauta.nomePauta}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    pauta.status === 'Votação Liberada'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : pauta.status === 'Votação Planejada'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                  }`}>
                    {pauta.status}
                  </span>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Opções</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{pauta.opcoes.length} opções</p>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Aba</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate break-all" title={pauta.aba}>
                  {pauta.aba}
                </p>
              </div>
              
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
                <button
                  onClick={() => openModal(index)}
                  className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z"/>
                    <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(index)}
                  className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48 0a.75.75 0 1 0-1.499-.058l-.347 9a.75.75 0 0 0 1.5.058l.346-9Z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
        {pautas.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Nenhuma pauta cadastrada
          </div>
        )}
      </div>

      {/* Tabela para telas maiores */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-600">
              <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Nome</th>
              <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Status</th>
              <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Aba</th>
              <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Opções</th>
              <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pautas.map((pauta, index) => (
              <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="py-3 px-4 text-gray-800 dark:text-gray-100">{pauta.nomePauta}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    pauta.status === 'Votação Liberada'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : pauta.status === 'Votação Planejada'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                  }`}>
                    {pauta.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400 truncate max-w-xs" title={pauta.aba}>
                  {pauta.aba}
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{pauta.opcoes.length} opções</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openModal(index)}
                      className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z"/>
                        <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48 0a.75.75 0 1 0-1.499-.058l-.347 9a.75.75 0 0 0 1.5.058l.346-9Z" clipRule="evenodd"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pautas.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                  Nenhuma pauta cadastrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
                {editingIndex !== null ? 'Editar Pauta' : 'Nova Pauta'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome da Pauta *
                  </label>
                  <input
                    type="text"
                    value={formData.nomePauta}
                    onChange={(e) => handleNomePautaChange(e.target.value)}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-violet-500 focus:ring-violet-500 h-12"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome da Aba
                  </label>
                  <input
                    type="text"
                    value={formData.aba}
                    readOnly
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-white h-12"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Gerado automaticamente em camelCase</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-violet-500 focus:ring-violet-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Opções (separadas por vírgula) *
                  </label>
                  <input
                    type="text"
                    value={formData.opcoes}
                    onChange={(e) => setFormData({ ...formData, opcoes: e.target.value })}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-violet-500 focus:ring-violet-500 h-12"
                    placeholder="Ex: Sim, Não, Abstenção"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-violet-500 focus:ring-violet-500 h-12"
                  >
                    <option value="Votação Bloqueada">Votação Bloqueada</option>
                    <option value="Votação Planejada">Votação Planejada</option>
                    <option value="Votação Liberada">Votação Liberada</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-5 py-3 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-violet-600 text-white px-5 py-3 hover:bg-violet-700 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

