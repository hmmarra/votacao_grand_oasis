import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getAuth, Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Verificar se todas as variáveis estão configuradas
const isConfigValid = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  )
}

// Inicializar Firebase apenas se as variáveis estiverem configuradas
let app: FirebaseApp | null = null
let db: Firestore | null = null
let auth: Auth | null = null


// Importar Messaging apenas no client-side
import { getMessaging, Messaging } from 'firebase/messaging'

let messaging: Messaging | null = null

if (isConfigValid()) {
  try {
    // Evitar múltiplas inicializações
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }
    db = getFirestore(app)
    auth = getAuth(app)

    // Inicializar Messaging apenas no browser
    if (typeof window !== 'undefined') {
      try {
        messaging = getMessaging(app)
      } catch (e) {
        console.warn('Firebase Messaging não suportado neste navegador', e)
      }
    }

  } catch (error) {
    console.error('Erro ao inicializar Firebase:', error)
  }
} else {
  console.warn('⚠️ Firebase não configurado. Verifique as variáveis de ambiente NEXT_PUBLIC_FIREBASE_*')
}

// Forçar tipagem para evitar erros de "null" no TypeScript, assumindo que a config existe
const firestoreDb = db as Firestore;
const firestoreAuth = auth as Auth;

export { firestoreDb as db, firestoreAuth as auth, messaging }
export default app

