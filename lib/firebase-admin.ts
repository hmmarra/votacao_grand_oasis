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
            privateKey = privateKey.replace(/\\n/g, '\n')

            if (projectId && clientEmail) {
                credential = admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey
                })
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

export const adminDb = admin.firestore()
export const adminMessaging = admin.messaging()
