import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import * as XLSX from 'xlsx'

// Configurar timeout maior para esta rota (60 segundos)
export const maxDuration = 60

// Função auxiliar para normalizar CPF
function normalizeCPF(value: string): string {
  return String(value || '').replace(/\D/g, '')
}

// Função para ler Excel
async function parseExcelFile(fileData: number[]): Promise<any[]> {
  const arrayBuffer = new Uint8Array(fileData).buffer
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  return XLSX.utils.sheet_to_json(worksheet)
}

export async function POST(request: NextRequest) {
  try {
    const { fileData, fileName } = await request.json()

    if (!fileData || !Array.isArray(fileData)) {
      return NextResponse.json(
        { message: 'Dados do arquivo inválidos' },
        { status: 400 }
      )
    }

    // Parse do Excel
    const rows = await parseExcelFile(fileData)

    if (rows.length === 0) {
      return NextResponse.json(
        { message: 'Planilha vazia ou formato inválido' },
        { status: 400 }
      )
    }

    // Validar colunas esperadas
    const firstRow = rows[0]
    const requiredColumns = ['CPF', 'Nome', 'Apartamento', 'Torre']
    const missingColumns = requiredColumns.filter(col => !(col in firstRow))
    
    if (missingColumns.length > 0) {
      return NextResponse.json(
        { message: `Colunas faltando: ${missingColumns.join(', ')}` },
        { status: 400 }
      )
    }

    let inserted = 0
    let updated = 0
    const errors: string[] = []

    if (!db) {
      return NextResponse.json({ error: 'Firebase não inicializado' }, { status: 500 })
    }
    
    const administradoresRef = collection(db, 'administradores')
    const uploadDate = serverTimestamp()

    // Buscar todos os moradores existentes de uma vez (otimização)
    const allMoradoresSnapshot = await getDocs(administradoresRef)
    
    // Criar mapa em memória: chave = "apartamento_torre", valor = { docId, data }
    const moradoresMap = new Map<string, { docId: string; data: any }>()
    allMoradoresSnapshot.forEach((doc) => {
      const data = doc.data()
      const key = `${data.apartamento || ''}_${data.torre || ''}`
      if (key && key !== '_') {
        moradoresMap.set(key, { docId: doc.id, data })
      }
    })

    // Preparar operações em batch (máximo 500 por batch)
    const BATCH_SIZE = 500
    const operations: Array<{ type: 'insert' | 'update'; data: any; docId?: string }> = []

    // Processar cada linha do Excel
    for (const row of rows) {
      try {
        const cpf = normalizeCPF(String(row.CPF || ''))
        const nome = String(row.Nome || '').trim()
        const apartamento = String(row.Apartamento || '').trim()
        const torre = String(row.Torre || '').trim()

        // Validar dados obrigatórios
        if (!cpf || !nome || !apartamento || !torre) {
          errors.push(`Linha ignorada: dados incompletos (CPF: ${cpf}, Nome: ${nome})`)
          continue
        }

        // Gerar senha: apartamento + torre
        const senha = `${apartamento}${torre}`
        const key = `${apartamento}_${torre}`

        // Verificar se existe no mapa
        const existing = moradoresMap.get(key)

        if (existing) {
          // Não atualizar se for usuário mestre
          if (existing.data.isMaster) {
            errors.push(`Usuário mestre ignorado: ${nome} (AP: ${apartamento}, Torre: ${torre})`)
            continue
          }
          
          operations.push({
            type: 'update',
            docId: existing.docId,
            data: {
              cpf,
              nome,
              senha,
              data_cadastro: uploadDate,
              acesso: existing.data.acesso || 'Morador',
              email: existing.data.email || null
            }
          })
          updated++
        } else {
          // Criar novo
          operations.push({
            type: 'insert',
            data: {
              cpf,
              nome,
              apartamento,
              torre,
              senha,
              acesso: 'Morador',
              email: null,
              isMaster: false,
              data_cadastro: uploadDate
            }
          })
          inserted++
        }
      } catch (error: any) {
        errors.push(`Erro ao processar linha: ${error.message}`)
      }
    }

    // Executar operações em batches
    for (let i = 0; i < operations.length; i += BATCH_SIZE) {
      const batch = writeBatch(db)
      const batchOps = operations.slice(i, i + BATCH_SIZE)
      
      for (const op of batchOps) {
        if (op.type === 'update' && op.docId) {
          const docRef = doc(administradoresRef, op.docId)
          batch.update(docRef, op.data)
        } else if (op.type === 'insert') {
          const docRef = doc(administradoresRef)
          batch.set(docRef, op.data)
        }
      }
      
      await batch.commit()
    }

    return NextResponse.json({
      inserted,
      updated,
      total: inserted + updated,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error('Erro ao processar Excel:', error)
    return NextResponse.json(
      { message: error.message || 'Erro ao processar arquivo Excel' },
      { status: 500 }
    )
  }
}

