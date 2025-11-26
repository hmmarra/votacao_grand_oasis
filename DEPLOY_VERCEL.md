# Guia de Deploy na Vercel

## Opção 1: Deploy via CLI (Recomendado)

### 1. Login na Vercel
```bash
vercel login
```
Isso abrirá o navegador para você fazer login com sua conta GitHub.

### 2. Deploy
```bash
vercel
```

Na primeira vez, a Vercel fará algumas perguntas:
- **Set up and deploy?** → `Y`
- **Which scope?** → Selecione sua conta
- **Link to existing project?** → `N` (primeira vez)
- **What's your project's name?** → `votacao-condominio` (ou o nome que preferir)
- **In which directory is your code located?** → `./` (pressione Enter)

### 3. Configurar Variáveis de Ambiente

Após o deploy, você precisa adicionar as variáveis de ambiente na Vercel:

1. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione todas as variáveis do seu `.env.local`:

**Variáveis Firebase (se estiver usando Firebase):**
```
NEXT_PUBLIC_USE_FIREBASE=true
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

**Variáveis Google Sheets (se estiver usando Google Sheets):**
```
SPREADSHEET_ID=...
GOOGLE_API_KEY=...
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
```

⚠️ **IMPORTANTE:** 
- Para `GOOGLE_PRIVATE_KEY`, você precisa colar a chave completa incluindo `\n` (quebras de linha)
- Ou substitua `\n` por quebras de linha reais ao colar na Vercel

### 4. Redeploy após adicionar variáveis
```bash
vercel --prod
```

Ou acesse o dashboard e clique em **Redeploy**.

---

## Opção 2: Deploy via GitHub (Mais Fácil)

### 1. Conectar Repositório
1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em **Add New Project**
4. Selecione o repositório `votacao_condominio`
5. A Vercel detectará automaticamente que é um projeto Next.js

### 2. Configurar Projeto
- **Framework Preset:** Next.js (já detectado)
- **Root Directory:** `./` (deixe padrão)
- **Build Command:** `npm run build` (já configurado)
- **Output Directory:** `.next` (já configurado)

### 3. Adicionar Variáveis de Ambiente
Antes de fazer o deploy, adicione todas as variáveis de ambiente na seção **Environment Variables**.

### 4. Deploy
Clique em **Deploy** e aguarde o processo concluir.

---

## Configurações Importantes

### Região (vercel.json)
O arquivo `vercel.json` está configurado para usar a região `gru1` (São Paulo, Brasil) para melhor performance.

### Domínio Personalizado (Opcional)
1. No dashboard da Vercel, vá em **Settings** → **Domains**
2. Adicione seu domínio personalizado
3. Configure os registros DNS conforme instruções

---

## Troubleshooting

### Erro: "Missing environment variables"
- Certifique-se de adicionar TODAS as variáveis necessárias no dashboard da Vercel
- Variáveis devem começar com `NEXT_PUBLIC_` para serem acessíveis no cliente

### Erro: "Build failed"
- Verifique os logs de build no dashboard
- Certifique-se de que todas as dependências estão no `package.json`
- Verifique se não há erros de TypeScript

### Firebase não funciona em produção
- Verifique se todas as variáveis `NEXT_PUBLIC_FIREBASE_*` estão configuradas
- Verifique as regras de segurança do Firestore
- Certifique-se de que o domínio da Vercel está autorizado no Firebase

---

## Comandos Úteis

```bash
# Deploy em produção
vercel --prod

# Deploy em preview
vercel

# Ver logs
vercel logs

# Remover projeto
vercel remove
```

