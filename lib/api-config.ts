// Configuração: escolha entre Firebase ou Google Sheets
// Para usar Firebase, defina NEXT_PUBLIC_USE_FIREBASE=true no .env.local

// Verificar variável de ambiente - funciona tanto no cliente quanto no servidor
const USE_FIREBASE = process.env.NEXT_PUBLIC_USE_FIREBASE === 'true'

// Exporta a API apropriada
let apiModule: any
let typesModule: any

if (USE_FIREBASE) {
  // Usar Firebase
  const firebaseModule = require('./firebase-api')
  apiModule = firebaseModule.firebaseApi
  typesModule = firebaseModule
} else {
  // Usar Google Sheets (padrão)
  const sheetsModule = require('./api')
  apiModule = sheetsModule.api
  typesModule = sheetsModule
}

export const api = apiModule

// Exportar tipos - usar uma abordagem que funciona em tempo de compilação
// Como os tipos são compatíveis entre Firebase e Sheets, podemos usar qualquer um
import type { Pauta, VotingConfig, VoterStatus, Placar, AdminData, Morador, Reforma } from './firebase-api'

// Re-exportar os tipos (Firebase tem mais campos, então é mais completo)
export type { Pauta, VotingConfig, VoterStatus, Placar, AdminData, Morador, Reforma }

