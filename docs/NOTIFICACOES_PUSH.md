# Implementação de Notificações Push (Web Push)

Para que as notificações funcionem mesmo com o site fechado, é necessário configurar o **Firebase Cloud Messaging (FCM)**.

## 1. Configuração no Firebase Console

1. Acesse o [Console do Firebase](https://console.firebase.google.com).
2. Vá em **Project Settings** (Engrenagem) > **Cloud Messaging**.
3. Em **Web configuration**, clique em "Generate key pair" se ainda não tiver.
4. Copie a **Key pair** (VAPID Key).

## 2. Configuração no Código

### A. Service Worker
O arquivo `public/firebase-messaging-sw.js` já foi criado.
**AÇÃO NECESSÁRIA**: Abra este arquivo e preencha o `firebaseConfig` com os valores reais do seu `.env.local`.

### B. VAPID Key
O arquivo `lib/fcm-helper.ts` foi criado.
**AÇÃO NECESSÁRIA**: Substitua `'SUA_KEY_VAPID_AQUI'` pela Key pair que você copiou no passo 1.

## 3. Salvar Token do Usuário

O token FCM identifica o navegador do usuário. Você precisa salvar esse token no cadastro do usuário no Firestore para saber para quem enviar.

Recomendo adicionar um campo `fcmTokens` (array) no documento do usuário na coleção `administradores`.

```typescript
// Exemplo de como salvar o token (no login ou dashboard)
import { requestNotificationPermission } from '@/lib/fcm-helper'

useEffect(() => {
  async function setupNotifications() {
    const token = await requestNotificationPermission(user.cpf)
    if (token) {
      // Chame sua API para salvar o token no perfil do usuário
      saveUserToken(token) 
    }
  }
  setupNotifications()
}, [])
```

## 4. Enviar Notificação (Backend)

Para enviar a notificação para o dispositivo, você deve fazer uma chamada HTTP POST para a API do FCM a partir do seu servidor (Next.js API Route).

**Endpoint**: `https://fcm.googleapis.com/fcm/send`
**Headers**:
- `Content-Type`: `application/json`
- `Authorization`: `key=SUA_SERVER_KEY_LEGACY` (Pegue no Console > Cloud Messaging > Cloud Messaging API (Legacy))

**Body**:
```json
{
  "to": "TOKEN_DO_USUARIO_DESTINO",
  "notification": {
    "title": "Nova Mensagem",
    "body": "Você recebeu uma nova mensagem sobre a reforma.",
    "icon": "/icon.png",
    "click_action": "https://seu-site.com/reformas"
  }
}
```

> **Nota**: Se usar a API HTTP v1 (mais nova), a autenticação é mais complexa e requer o Firebase Admin SDK.

## Resumo dos Arquivos Criados

- `public/firebase-messaging-sw.js`: Worker que recebe a notificação em background.
- `lib/fcm-helper.ts`: Helper para pedir permissão e pegar o token.
- `lib/firebase.ts`: Atualizado para inicializar o Messaging.

## Próximos Passos para Você:

1. [ ] Preencher `firebaseConfig` em `public/firebase-messaging-sw.js`.
2. [ ] Colocar a VAPID Key em `lib/fcm-helper.ts`.
3. [ ] Criar lógica para salvar o token no Firestore quando o usuário logar.
4. [ ] Criar API Route `/api/notify` que recebe o token do destino e a mensagem, e faz o POST para o FCM.
5. [ ] Chamar essa API nas funções de notificação existentes (`sendNotification`).
