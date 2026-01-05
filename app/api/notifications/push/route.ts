import { NextResponse } from 'next/server'
import { adminMessaging } from '@/lib/firebase-admin'

export async function POST(request: Request) {
    try {
        const { tokens, title, body, link, icon } = await request.json()

        if (!tokens || !tokens.length) {
            return NextResponse.json({ error: 'Tokens não fornecidos' }, { status: 400 })
        }

        // Usar MulticastMessage para enviar para vários tokens
        const message = {
            notification: {
                title,
                body,
            },
            data: {
                link: link || '/',
            },
            webpush: {
                notification: {
                    icon: icon || '/icon-192x192.png',
                    actions: [
                        { action: 'open_url', title: 'Ver' }
                    ]
                },
                fcmOptions: {
                    link: link || '/'
                }
            },
            tokens: tokens
        }

        const response = await adminMessaging.sendEachForMulticast(message)

        console.log('Push enviado:', response.successCount, 'sucessos', response.failureCount, 'falhas')

        if (response.failureCount > 0) {
            const failedTokens: string[] = []
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx])
                    console.error('Falha no token:', tokens[idx], resp.error)
                }
            })
            // Aqui poderíamos remover tokens inválidos do banco de dados futuramente
        }

        return NextResponse.json({
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount
        })

    } catch (error) {
        console.error('Erro na API de Push (Admin SDK):', error)
        return NextResponse.json({ error: 'Erro interno ao enviar notificação' }, { status: 500 })
    }
}
