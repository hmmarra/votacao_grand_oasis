import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import * as XLSX from 'xlsx'

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

    const administradoresRef = collection(db, 'administradores')
    const uploadDate = serverTimestamp()

    // Processar cada linha
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

        // Buscar registro existente por Apartamento + Torre (campos chave)
        const qByApt = query(
          administradoresRef,
          where('apartamento', '==', apartamento),
          where('torre', '==', torre)
        )

        const snapshotApt = await getDocs(qByApt)

        // Se encontrou por Apartamento + Torre, atualizar
        if (!snapshotApt.empty) {
          const docRef = snapshotApt.docs[0]
          const existingData = docRef.data()
          
          // Não atualizar se for usuário mestre
          if (existingData.isMaster) {
            errors.push(`Usuário mestre ignorado: ${nome} (AP: ${apartamento}, Torre: ${torre})`)
            continue
          }
          
          await updateDoc(docRef.ref, {
            cpf,
            nome,
            senha,
            data_cadastro: uploadDate,
            acesso: existingData.acesso || 'Morador',
            email: existingData.email || null
          })
          updated++
        }
        // Se não encontrou, criar novo
        else {
          await addDoc(administradoresRef, {
            cpf,
            nome,
            apartamento,
            torre,
            senha,
            acesso: 'Morador',
            email: null,
            isMaster: false,
            data_cadastro: uploadDate
          })
          inserted++
        }
      } catch (error: any) {
        errors.push(`Erro ao processar linha: ${error.message}`)
      }
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

