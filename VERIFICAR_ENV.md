# Verificação do .env.local

## ✅ Checklist de Variáveis Obrigatórias

Seu arquivo `.env.local` deve conter TODAS estas variáveis:

```env
# Ativar Firebase
NEXT_PUBLIC_USE_FIREBASE=true

# Credenciais do Firebase (obtenha no Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef...
```

## 📋 Como Verificar

1. **Localize o arquivo `.env.local`** na raiz do projeto
2. **Abra o arquivo** e verifique se todas as variáveis estão presentes
3. **Certifique-se de que:**
   - Não há espaços antes ou depois do `=`
   - Não há aspas desnecessárias (a menos que o valor contenha espaços)
   - Todos os valores estão preenchidos (não deixe vazio)

## 🔍 Exemplo Correto

```env
NEXT_PUBLIC_USE_FIREBASE=true
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=meu-projeto-votacao.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=meu-projeto-votacao
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=meu-projeto-votacao.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=987654321098
NEXT_PUBLIC_FIREBASE_APP_ID=1:987654321098:web:abcdef1234567890
```

## ❌ Erros Comuns

### 1. Variáveis sem o prefixo `NEXT_PUBLIC_`
```env
# ❌ ERRADO
FIREBASE_API_KEY=...

# ✅ CORRETO
NEXT_PUBLIC_FIREBASE_API_KEY=...
```

### 2. Valores com espaços extras
```env
# ❌ ERRADO
NEXT_PUBLIC_FIREBASE_API_KEY = AIzaSy...

# ✅ CORRETO
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
```

### 3. Aspas desnecessárias
```env
# ❌ ERRADO (geralmente)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."

# ✅ CORRETO
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
```

### 4. Comentários na mesma linha
```env
# ❌ ERRADO
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy... # minha chave

# ✅ CORRETO
# minha chave
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
```

## 🧪 Como Testar

1. **Acesse a página de teste:**
   ```
   http://localhost:3000/test-firebase
   ```

2. **A página mostrará:**
   - ✅ Quais variáveis estão configuradas
   - ❌ Quais variáveis estão faltando
   - 🔄 Status da conexão com Firebase
   - ✍️ Teste de escrita

3. **Se houver erros:**
   - Verifique o console do navegador (F12)
   - Verifique se o servidor foi reiniciado após alterar `.env.local`
   - Certifique-se de que o Firestore está ativado no Firebase Console

## 🔄 Após Alterar .env.local

**IMPORTANTE:** Sempre reinicie o servidor após alterar o `.env.local`:

```bash
# Pare o servidor (Ctrl+C)
# Depois inicie novamente
npm run dev
```

## 📍 Onde Obter as Credenciais

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Clique no ícone de engrenagem ⚙️ → "Configurações do projeto"
4. Role até "Seus aplicativos"
5. Clique no ícone `</>` (Web)
6. Copie as credenciais que aparecem

