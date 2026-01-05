# Sistema de Notificações - Documentação

## 📋 Visão Geral

O sistema de notificações permite comunicação bidirecional entre moradores e administradores através de notificações em tempo real armazenadas no Firebase Firestore.

## 🏗️ Arquitetura

### Coleções do Firebase

1. **`notificacoes`** - Armazena todas as notificações
   - `userId` (string): CPF do destinatário
   - `type` (string): Tipo da notificação ('reforma' | 'votacao' | 'sistema' | 'mensagem')
   - `title` (string): Título da notificação
   - `message` (string): Mensagem completa
   - `timestamp` (string): Data/hora de criação (ISO 8601)
   - `status` (string): Status da notificação ('unread' | 'read')
   - `link` (string, opcional): URL para redirecionamento
   - `metadata` (object, opcional): Dados adicionais (reformaId, votacaoId, etc.)

2. **`administradores`** - Lista de administradores do sistema
   - `cpf` (string): CPF do administrador
   - `isMaster` (boolean): Indica se é administrador

## 🔄 Fluxo de Notificações

### 1. Morador → Administradores

**Quando acontece**: Morador envia uma mensagem no chat de uma reforma

**Processo**:
```typescript
// 1. Morador envia mensagem (app/reformas/page.tsx)
handleSendMessage() {
  // Salva mensagem no chat
  await api.updateReforma(reforma.id, { mensagens: updatedMessages })
  
  // 2. Dispara notificação para administradores
  await notifyAdminsNewMessage(
    reforma.id,           // ID da reforma
    user.nome,            // Nome do morador
    `Apt ${reforma.apartamento} - Torre ${reforma.torre}`
  )
}

// 3. Sistema busca todos os administradores (lib/notifications-api.ts)
notifyAdminsNewMessage() {
  // Busca na coleção 'administradores' onde isMaster === true
  const adminRef = collection(db, 'administradores')
  const q = query(adminRef, where('isMaster', '==', true))
  const snapshot = await getDocs(q)
  
  // Extrai CPFs dos administradores
  const adminCpfs = snapshot.docs.map(doc => doc.data().cpf).filter(Boolean)
  
  // 4. Cria notificação para cada administrador
  await createNotificationForUsers(adminCpfs, {
    type: 'mensagem',
    title: 'Nova Mensagem de Morador',
    message: `${senderName} enviou uma mensagem sobre a reforma do apartamento ${apartamento}.`,
    link: '/reformas',
    metadata: { reformaId }
  })
}
```

**Resultado**: Todos os administradores recebem uma notificação

---

### 2. Administrador → Morador

**Quando acontece**: Administrador envia uma mensagem no chat de uma reforma

**Processo**:
```typescript
// 1. Admin envia mensagem (app/reformas/page.tsx)
handleSendMessage() {
  // Salva mensagem no chat
  await api.updateReforma(reforma.id, { mensagens: updatedMessages })
  
  // 2. Dispara notificação para o morador dono da reforma
  await notifyNewReformaMessage(
    reforma.cpf,          // CPF do morador (dono da reforma)
    reforma.id,           // ID da reforma
    user.nome,            // Nome do admin
    `Apt ${reforma.apartamento} - Torre ${reforma.torre}`
  )
}

// 3. Sistema cria notificação (lib/notifications-api.ts)
notifyNewReformaMessage() {
  await createNotification({
    userId: reforma.cpf,  // CPF do morador
    type: 'mensagem',
    title: 'Nova Mensagem',
    message: `${senderName} comentou na reforma do apartamento ${apartamento}.`,
    link: '/reformas',
    metadata: { reformaId }
  })
}
```

**Resultado**: O morador dono da reforma recebe uma notificação

---

## 📱 Exibição de Notificações

### Página de Notificações (`/notificacoes`)

**Funcionalidades**:
- Lista todas as notificações do usuário logado
- Filtros por tipo (Todas, Reformas, Votações, Mensagens, Sistema)
- Filtros por status (Todas, Não Lidas, Lidas)
- Marcar individual como lida
- Marcar todas como lidas
- Excluir notificação
- Atualização em tempo real

**Listener em Tempo Real**:
```typescript
useEffect(() => {
  if (!user?.cpf) return

  // Listener que atualiza automaticamente quando há mudanças
  const unsubscribe = subscribeToUserNotifications(user.cpf, (notifs) => {
    setNotifications(notifs)
    setLoading(false)
  })

  return () => unsubscribe()
}, [user?.cpf])
```

---

### Contador na Sidebar

**Funcionalidade**: Badge com número de notificações não lidas

**Implementação**:
```typescript
// components/Sidebar.tsx
useEffect(() => {
  if (!user?.cpf) return

  // Listener que conta notificações não lidas em tempo real
  const unsubscribe = subscribeToUnreadCount(user.cpf, (count) => {
    setUnreadCount(count)
  })

  return () => unsubscribe()
}, [user?.cpf])

// Badge só aparece se houver notificações não lidas
<SidebarItem
  icon={<NotificationsIcon />}
  label="Notificações"
  href="/notificacoes"
  badge={unreadCount > 0 ? unreadCount : undefined}
/>
```

---

## 🔧 Funções da API

### Principais Funções (`lib/notifications-api.ts`)

#### 1. **createNotification**
Cria uma notificação para um único usuário
```typescript
await createNotification({
  userId: '12345678900',
  type: 'sistema',
  title: 'Título',
  message: 'Mensagem',
  link: '/pagina',
  metadata: { key: 'value' }
})
```

#### 2. **createNotificationForUsers**
Cria notificação para múltiplos usuários
```typescript
await createNotificationForUsers(['cpf1', 'cpf2'], {
  type: 'votacao',
  title: 'Nova Votação',
  message: 'Participe da votação!'
})
```

#### 3. **markNotificationAsRead**
Marca uma notificação como lida
```typescript
await markNotificationAsRead(notificationId)
```

#### 4. **markAllNotificationsAsRead**
Marca todas as notificações do usuário como lidas
```typescript
await markAllNotificationsAsRead(userCpf)
```

#### 5. **deleteNotification**
Exclui uma notificação
```typescript
await deleteNotification(notificationId)
```

#### 6. **subscribeToUserNotifications**
Listener em tempo real para notificações do usuário
```typescript
const unsubscribe = subscribeToUserNotifications(userCpf, (notifications) => {
  console.log('Notificações atualizadas:', notifications)
})
```

#### 7. **subscribeToUnreadCount**
Listener em tempo real para contador de não lidas
```typescript
const unsubscribe = subscribeToUnreadCount(userCpf, (count) => {
  console.log('Não lidas:', count)
})
```

---

## 🎯 Helpers Específicos

### Notificações de Reforma

```typescript
// Reforma aprovada
await notifyReformaApproved(userCpf, reformaId, 'Apt 101')

// Reforma reprovada
await notifyReformaRejected(userCpf, reformaId, 'Apt 101', 'Motivo da reprovação')

// Nova mensagem (Admin → Morador)
await notifyNewReformaMessage(userCpf, reformaId, 'Admin Nome', 'Apt 101')

// Nova mensagem (Morador → Admins)
await notifyAdminsNewMessage(reformaId, 'Morador Nome', 'Apt 101')

// Vistoria agendada
await notifyVistoriaScheduled(userCpf, reformaId, 'Apt 101', '2026-01-10')
```

### Notificações de Votação

```typescript
// Nova votação para múltiplos usuários
await notifyNewVotacao(['cpf1', 'cpf2'], votacaoId, 'Título da Votação')
```

### Notificações de Sistema

```typescript
// Notificação de sistema para múltiplos usuários
await notifySystem(['cpf1', 'cpf2'], 'Título', 'Mensagem do sistema')
```

---

## 🔐 Segurança

### Regras do Firestore

É necessário configurar regras de segurança no Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Notificações: usuário só pode ler/modificar suas próprias notificações
    match /notificacoes/{notificationId} {
      allow read, delete: if request.auth != null && 
                             resource.data.userId == request.auth.token.cpf;
      allow update: if request.auth != null && 
                       resource.data.userId == request.auth.token.cpf &&
                       request.resource.data.status in ['read', 'unread'];
      allow create: if request.auth != null;
    }
  }
}
```

---

## 📊 Índices Necessários

### Firestore Composite Index

Para queries eficientes, é necessário criar um índice composto:

**Coleção**: `notificacoes`
**Campos**:
1. `userId` (Ascending)
2. `timestamp` (Descending)

**Como criar**:
1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Vá em Firestore → Indexes
3. Clique em "Create Index"
4. Configure os campos acima
5. Ou use o link gerado automaticamente no erro do console

---

## 🚀 Como Adicionar Novas Notificações

### Exemplo: Notificar quando status de reforma muda

```typescript
// 1. Criar helper em lib/notifications-api.ts
export const notifyReformaStatusChanged = async (
  userId: string, 
  reformaId: string, 
  newStatus: string, 
  apartamento: string
) => {
  await createNotification({
    userId,
    type: 'reforma',
    title: 'Status da Reforma Atualizado',
    message: `O status da reforma do apartamento ${apartamento} foi alterado para: ${newStatus}`,
    link: '/reformas',
    metadata: { reformaId }
  })
}

// 2. Usar no código onde o status muda
// app/reformas/page.tsx
const handleStatusChange = async (newStatus: string) => {
  await api.updateReforma(reforma.id, { status: newStatus })
  
  // Notificar morador
  await notifyReformaStatusChanged(
    reforma.cpf,
    reforma.id,
    newStatus,
    `Apt ${reforma.apartamento} - Torre ${reforma.torre}`
  )
}
```

---

## 🐛 Troubleshooting

### Notificações não aparecem

1. **Verificar se o índice foi criado** no Firestore
2. **Verificar console do navegador** para erros
3. **Verificar se o CPF está correto** no campo `userId`
4. **Verificar se o Firebase está inicializado** (`db` não é `null`)

### Contador não atualiza

1. **Verificar se o listener está ativo** (useEffect executou)
2. **Verificar se o CPF do usuário está correto**
3. **Verificar regras de segurança** do Firestore

### Performance

- Os listeners são eficientes e só atualizam quando há mudanças
- Usar `unsubscribe()` no cleanup do useEffect para evitar memory leaks
- Limitar quantidade de notificações antigas (implementar limpeza periódica)

---

## 📝 Checklist de Implementação

- [x] Coleção `notificacoes` criada no Firestore
- [x] Índice composto criado
- [x] API de notificações implementada
- [x] Página `/notificacoes` criada
- [x] Contador na Sidebar implementado
- [x] Notificações de mensagens (Morador ↔ Admin)
- [ ] Notificações de mudança de status de reforma
- [ ] Notificações de vistoria
- [ ] Notificações de votação
- [ ] Regras de segurança do Firestore configuradas
- [ ] Limpeza automática de notificações antigas

---

## 🎨 Tipos de Notificação

| Tipo | Cor | Ícone | Uso |
|------|-----|-------|-----|
| `reforma` | Teal | 🔨 Hammer | Mudanças em reformas |
| `votacao` | Roxo | ✅ CheckCheck | Novas votações |
| `mensagem` | Azul | 💬 MessageSquare | Mensagens de chat |
| `sistema` | Âmbar | ℹ️ Info | Avisos do sistema |

---

## 📚 Referências

- [Firebase Firestore Docs](https://firebase.google.com/docs/firestore)
- [Firebase Realtime Listeners](https://firebase.google.com/docs/firestore/query-data/listen)
- [Next.js useEffect](https://react.dev/reference/react/useEffect)

---

**Última atualização**: 04/01/2026
**Versão**: 1.0.0
