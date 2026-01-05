import { getToken } from 'firebase/messaging'
import { messaging } from './firebase'
import { collection, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from './firebase'

// VAPID Key para Identificação do Servidor
const VAPID_KEY = 'BN63lQ69mn5wuO1QAYak0c8v8Py329Dxj6qBuoKllDKX7cvzM2XLbAWYXrobkV-ZdexR0ng-6JxNISdV39rAFMs'

export async function requestNotificationPermission(userCpf: string) {
    if (!messaging) {
        console.warn('Messaging não suportado ou não inicializado')
        return null
    }

    try {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {

            // Registrar o Service Worker explicitamente
            let registration;
            try {
                if ('serviceWorker' in navigator) {
                    // Registrar
                    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

                    // Aguardar ficar pronto
                    await navigator.serviceWorker.ready;
                    registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');

                }
            } catch (err) {
                console.error('Falha ao registrar Service Worker:', err);
                return null;
            }

            if (!registration) {
                console.error('Service Worker registration not found');
                return null;
            }

            // Passar o registration para obter o token
            const token = await getToken(messaging, {
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: registration
            })

            // Salvar token no perfil do usuário no Firestore
            if (token && userCpf && db) {
                await saveTokenToUser(userCpf, token)
            }
            return token
        } else {
            console.log('Permissão de notificação negada')
            return null
        }
    } catch (error) {
        console.error('Erro ao obter token FCM:', error)
        return null
    }
}

// Função auxiliar para salvar o token no documento do usuário
async function saveTokenToUser(cpf: string, token: string) {
    try {
        if (!db) return

        // 1. Buscar usuário pelo CPF na coleção 'administradores' (que contém todos os usuários)
        const usersRef = collection(db, 'administradores')
        const q = query(usersRef, where('cpf', '==', cpf.replace(/\D/g, ''))) // Normaliza CPF
        const snapshot = await getDocs(q)

        if (!snapshot.empty) {
            const userDoc = snapshot.docs[0]

            // 2. Atualizar o documento adicionando o token ao array fcmTokens
            await updateDoc(userDoc.ref, {
                fcmTokens: arrayUnion(token)
            })
        } else {
            console.warn('Usuário não encontrado para salvar token FCM:', cpf)
        }
    } catch (error) {
        console.error('Erro ao salvar token no Firestore:', error)
    }
}
