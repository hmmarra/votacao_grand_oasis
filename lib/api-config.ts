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
export type Pauta = typesModule.Pauta
export type VotingConfig = typesModule.VotingConfig
export type VoterStatus = typesModule.VoterStatus
export type Placar = typesModule.Placar
export type AdminData = typesModule.AdminData
export type Morador = typesModule.Morador

