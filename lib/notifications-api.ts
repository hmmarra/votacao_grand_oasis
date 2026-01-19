import { db } from './firebase'
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    Timestamp,
    onSnapshot,
    QuerySnapshot,
    DocumentData
} from 'firebase/firestore'

export type NotificationType = 'reforma' | 'votacao' | 'sistema' | 'mensagem'
export type NotificationStatus = 'unread' | 'read'

export interface Notification {
    id?: string
    userId: string // CPF do usuário que receberá a notificação
    type: NotificationType
    title: string
    message: string
    timestamp: string
    status: NotificationStatus
    link?: string
    metadata?: {
        reformaId?: string
        votacaoId?: string
        senderId?: string
    }
}

// Criar notificação
export const createNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'status'>) => {
    try {
        const notificationsRef = collection(db, 'notificacoes')

        // Remover campos undefined
        const notificationData: any = {
            userId: notification.userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            timestamp: new Date().toISOString(),
            status: 'unread'
        }

        // Adicionar campos opcionais apenas se existirem
        if (notification.link) {
            notificationData.link = notification.link
        }

        if (notification.metadata) {
            notificationData.metadata = notification.metadata
        }

        const docRef = await addDoc(notificationsRef, notificationData)

        // Tentar enviar Push Notification (não bloqueante)
        sendPushToUsers([notification.userId], notification.title, notification.message, notification.link)
            .catch(err => console.error('Falha no envio de Push:', err))

        return docRef.id
    } catch (error) {
        console.error('Erro ao criar notificação:', error)
        throw error
    }
}

// Função auxiliar para envio de Push
const sendPushToUsers = async (userIds: string[], title: string, body: string, link?: string) => {
    try {
        // Buscar tokens dos usuários no Firestore
        const usersRef = collection(db, 'administradores')
        let allTokens: string[] = []

        // Buscar tokens para cada usuário (CPF)
        // Nota: Em produção, idealmente isso seria feito no backend para economizar leituras e ser mais seguro
        for (const cpf of userIds) {
            const q = query(usersRef, where('cpf', '==', cpf.replace(/\D/g, '')))
            const snapshot = await getDocs(q)
            if (!snapshot.empty) {
                const userData = snapshot.docs[0].data()
                if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
                    allTokens.push(...userData.fcmTokens)
                }
            }
        }

        // Remover duplicatas e tokens inválidos
        const uniqueTokens = Array.from(new Set(allTokens)).filter(Boolean)

        if (uniqueTokens.length > 0) {
            await fetch('/api/notifications/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tokens: uniqueTokens,
                    title,
                    body,
                    link
                })
            })
        }
    } catch (e) {
        console.error('Erro ao enviar push:', e)
    }
}

// Criar notificação para múltiplos usuários
export const createNotificationForUsers = async (
    userIds: string[],
    notification: Omit<Notification, 'id' | 'userId' | 'timestamp' | 'status'>
) => {
    try {
        const promises = userIds.map(userId =>
            createNotification({ ...notification, userId })
        )
        await Promise.all(promises)

        // Tentar enviar Push Notification em massa (não bloqueante)
        sendPushToUsers(userIds, notification.title, notification.message, notification.link)
            .catch(err => console.error('Falha no envio de Push em massa:', err))

    } catch (error) {
        console.error('Erro ao criar notificações em massa:', error)
        throw error
    }
}

// Buscar notificações do usuário
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
    try {
        const notificationsRef = collection(db, 'notificacoes')
        const q = query(
            notificationsRef,
            where('userId', '==', userId),
            orderBy('timestamp', 'desc')
        )

        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Notification))
    } catch (error) {
        console.error('Erro ao buscar notificações:', error)
        throw error
    }
}

// Marcar notificação como lida
export const markNotificationAsRead = async (notificationId: string) => {
    try {
        const notificationRef = doc(db, 'notificacoes', notificationId)
        await updateDoc(notificationRef, {
            status: 'read'
        })
    } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error)
        throw error
    }
}

// Marcar todas as notificações do usuário como lidas
export const markAllNotificationsAsRead = async (userId: string) => {
    try {
        const notificationsRef = collection(db, 'notificacoes')
        const q = query(
            notificationsRef,
            where('userId', '==', userId),
            where('status', '==', 'unread')
        )

        const snapshot = await getDocs(q)
        const promises = snapshot.docs.map(doc =>
            updateDoc(doc.ref, { status: 'read' })
        )

        await Promise.all(promises)
    } catch (error) {
        console.error('Erro ao marcar todas como lidas:', error)
        throw error
    }
}

// Excluir notificação
export const deleteNotification = async (notificationId: string) => {
    try {
        const notificationRef = doc(db, 'notificacoes', notificationId)
        await deleteDoc(notificationRef)
    } catch (error) {
        console.error('Erro ao excluir notificação:', error)
        throw error
    }
}

// Contar notificações não lidas
export const getUnreadCount = async (userId: string): Promise<number> => {
    try {
        const notificationsRef = collection(db, 'notificacoes')
        const q = query(
            notificationsRef,
            where('userId', '==', userId),
            where('status', '==', 'unread')
        )

        const snapshot = await getDocs(q)
        return snapshot.size
    } catch (error) {
        console.error('Erro ao contar notificações não lidas:', error)
        return 0
    }
}

// Listener em tempo real para notificações do usuário
export const subscribeToUserNotifications = (
    userId: string,
    callback: (notifications: Notification[]) => void
) => {
    const notificationsRef = collection(db, 'notificacoes')
    const q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
    )

    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
        const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Notification))
        callback(notifications)
    })
}

// Listener para contador de não lidas
export const subscribeToUnreadCount = (
    userId: string,
    callback: (count: number) => void
) => {
    const notificationsRef = collection(db, 'notificacoes')
    const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('status', '==', 'unread')
    )

    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
        callback(snapshot.size)
    })
}

// Funções auxiliares para criar notificações específicas

// Notificação de reforma aprovada
export const notifyReformaApproved = async (userId: string, reformaId: string, apartamento: string, artRrt: string) => {
    await createNotification({
        userId,
        type: 'reforma',
        title: 'Reforma Aprovada',
        message: `Sua solicitação de reforma para o apartamento ${apartamento} foi aprovada.`,
        link: `/reformas?art=${encodeURIComponent(artRrt)}`,
        metadata: { reformaId }
    })
}

// Notificação de reforma reprovada
export const notifyReformaRejected = async (userId: string, reformaId: string, apartamento: string, artRrt: string, motivo?: string) => {
    await createNotification({
        userId,
        type: 'reforma',
        title: 'Reforma Reprovada',
        message: motivo
            ? `Sua solicitação de reforma para o apartamento ${apartamento} foi reprovada. Motivo: ${motivo}`
            : `Sua solicitação de reforma para o apartamento ${apartamento} foi reprovada.`,
        link: `/reformas?art=${encodeURIComponent(artRrt)}`,
        metadata: { reformaId }
    })
}

// Notificação de nova mensagem na reforma
export const notifyNewReformaMessage = async (userId: string, reformaId: string, senderName: string, apartamento: string, artRrt: string) => {
    await createNotification({
        userId,
        type: 'mensagem',
        title: 'Nova Mensagem',
        message: `${senderName} comentou na reforma do apartamento ${apartamento}.`,
        link: `/reformas?art=${encodeURIComponent(artRrt)}`,
        metadata: { reformaId }
    })
}

// Notificação de vistoria agendada
export const notifyVistoriaScheduled = async (userId: string, reformaId: string, apartamento: string, artRrt: string, data: string) => {
    await createNotification({
        userId,
        type: 'reforma',
        title: 'Vistoria Agendada',
        message: `Vistoria agendada para o apartamento ${apartamento} em ${new Date(data).toLocaleDateString('pt-BR')}.`,
        link: `/reformas?art=${encodeURIComponent(artRrt)}`,
        metadata: { reformaId }
    })
}

// Notificação de nova votação
export const notifyNewVotacao = async (userIds: string[], votacaoId: string, titulo: string) => {
    await createNotificationForUsers(userIds, {
        type: 'votacao',
        title: 'Nova Votação Disponível',
        message: `Votação sobre "${titulo}" está aberta. Participe!`,
        link: '/votacao',
        metadata: { votacaoId }
    })
}

// Notificação de sistema
export const notifySystem = async (userIds: string[], title: string, message: string) => {
    await createNotificationForUsers(userIds, {
        type: 'sistema',
        title,
        message
    })
}

// Notificação para administradores sobre nova mensagem de morador
export const notifyAdminsNewMessage = async (reformaId: string, senderName: string, apartamento: string, artRrt: string) => {
    try {
        // Buscar todos os usuários administradores (coleção: administradores, campo: isMaster)
        const adminRef = collection(db, 'administradores')
        const q = query(adminRef, where('isMaster', '==', true))
        const snapshot = await getDocs(q)

        const adminCpfs = snapshot.docs.map(doc => doc.data().cpf).filter(Boolean)

        console.log('Administradores encontrados:', adminCpfs.length, adminCpfs)

        if (adminCpfs.length > 0) {
            const artLink = `/reformas?art=${encodeURIComponent(artRrt)}`
            await createNotificationForUsers(adminCpfs, {
                type: 'mensagem',
                title: 'Nova Mensagem de Morador',
                message: `${senderName} enviou uma mensagem sobre a reforma do apto ${apartamento}.\nClique para abrir.`,
                link: artLink,
                metadata: { reformaId }
            })
        } else {
            console.warn('Nenhum administrador encontrado para notificar')
        }
    } catch (error) {
        console.error('Erro ao notificar administradores:', error)
        throw error
    }
}

// Notificação para Engenharia sobre solicitação de vistoria
export const notifyEngenhariaVistoriaRequested = async (reformaId: string, apartamento: string, artRrt: string) => {
    try {
        const usersRef = collection(db, 'administradores')
        // Buscar usuários com acesso 'Engenharia' ou 'Desenvolvedor' (por segurança, dev também vê)
        // Mas a requisição foi especificamente "notificar o Engenheiro"
        const q = query(usersRef, where('acesso', '==', 'Engenharia'))
        const snapshot = await getDocs(q)

        const engenhariaCpfs = snapshot.docs.map(doc => doc.data().cpf).filter(Boolean)

        if (engenhariaCpfs.length > 0) {
            const artLink = `/reformas?art=${encodeURIComponent(artRrt)}`
            await createNotificationForUsers(engenhariaCpfs, {
                type: 'reforma',
                title: 'Nova Solicitação de Vistoria',
                message: `Foi solicitada uma vistoria para a reforma do apartamento ${apartamento}.`,
                link: artLink,
                metadata: { reformaId }
            })
        }
    } catch (error) {
        console.error('Erro ao notificar Engenharia:', error)
        throw error
    }
}
