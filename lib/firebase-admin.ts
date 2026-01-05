import * as admin from 'firebase-admin'
import path from 'path'
import fs from 'fs'

if (!admin.apps.length) {
    let credential;

    // Tentar carregar do arquivo JSON local (Desenvolvimento)
    try {
        const serviceAccountPath = path.join(process.cwd(), 'ignorar', 'votacao-sindico-firebase-adminsdk-fbsvc-6166625ed9.json')
        if (fs.existsSync(serviceAccountPath)) {
            const fileContent = fs.readFileSync(serviceAccountPath, 'utf8')
            credential = admin.credential.cert(JSON.parse(fileContent))
            console.log('[Firebase Admin] Credenciais carregadas do arquivo JSON local.')
        }
        // console.log("Simulando ambiente sem JSON local...")
    } catch (e) {
        console.log('[Firebase Admin] Erro ao ler JSON local:', e)
    }

    // Se não carregou do arquivo, tenta variáveis de ambiente (Produção)
    if (!credential) {
        const projectId = process.env.FIREBASE_PROJECT_ID
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
        let privateKey = process.env.FIREBASE_PRIVATE_KEY

        if (privateKey) {
            if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
                privateKey = privateKey.slice(1, -1)
            }
            // Tenta substituir literais \n por quebras de linha reais
            const formattedKey = privateKey.replace(/\\n/g, '\n')

            console.log(`[Firebase Admin] Tentando inicializar com variáveis de ambiente (Project: ${projectId}, Key Length: ${formattedKey.length})`)

            if (projectId && clientEmail) {
                try {
                    credential = admin.credential.cert({
                        projectId,
                        clientEmail,
                        privateKey: formattedKey
                    })
                } catch (certError: any) {
                    console.error('[Firebase Admin] Erro ao criar credencial a partir das env vars:', certError.message)
                    // Log parcial para debug (seguro)
                    console.error('[Firebase Admin] Key Start:', formattedKey.substring(0, 30) + '...')
                    console.error('[Firebase Admin] Key End:', '...' + formattedKey.substring(formattedKey.length - 30))
                }
            }
        }
    }

    if (credential) {
        try {
            admin.initializeApp({
                credential
            })
            console.log('[Firebase Admin] Inicializado com sucesso.')
        } catch (error) {
            console.error('[Firebase Admin] Erro fatal na inicialização:', error)
        }
    } else {
        console.error('Firebase Admin não inicializado. Verifique FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY no .env.local OU o arquivo JSON em ignorar/')
    }
}

// Exportar proxies seguros para evitar crash no build se a inicialização falhar
export const adminDb = new Proxy({}, {
    get: (_target, prop) => {
        if (!admin.apps.length) throw new Error('Firebase Admin DB não inicializado (credenciais inválidas)')
        return (admin.firestore() as any)[prop]
    }
}) as admin.firestore.Firestore

export const adminMessaging = new Proxy({}, {
    get: (_target, prop) => {
        if (!admin.apps.length) throw new Error('Firebase Admin Messaging não inicializado (credenciais inválidas)')
        return (admin.messaging() as any)[prop]
    }
}) as admin.messaging.Messaging
