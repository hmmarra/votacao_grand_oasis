import { createNotification } from '@/lib/notifications-api'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { userId, type, title, message, link, metadata } = body

        const notificationId = await createNotification({
            userId,
            type: type || 'sistema',
            title: title || 'Notificação de Teste',
            message: message || 'Esta é uma notificação de teste do sistema.',
            link,
            metadata
        })

        return Response.json({
            success: true,
            notificationId,
            message: 'Notificação criada com sucesso!'
        })
    } catch (error: any) {
        console.error('Erro ao criar notificação:', error)
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
