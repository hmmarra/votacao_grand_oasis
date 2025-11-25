# Sistema de Votação - Next.js

Sistema de votação moderno construído com Next.js, TypeScript, Tailwind CSS e suporte completo a dark mode.

## 🚀 Tecnologias

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização moderna
- **Dark Mode** - Suporte completo a tema claro/escuro com persistência
- **Axios** - Cliente HTTP para comunicação com API

## 📦 Instalação

1. Instale as dependências:
```bash
npm install
```

2. Configure a variável de ambiente:

**Opção A: Firebase (Recomendado) 🚀**
```env
NEXT_PUBLIC_USE_FIREBASE=true
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
```
📖 Veja [SETUP_FIREBASE.md](./SETUP_FIREBASE.md) para instruções detalhadas

**Opção B: Google Sheets**
```env
NEXT_PUBLIC_USE_FIREBASE=false
GOOGLE_SHEETS_API_KEY=sua_chave_api_aqui
```
📖 Veja [SETUP_GOOGLE_SHEETS.md](./SETUP_GOOGLE_SHEETS.md) para instruções detalhadas

**Como obter a API Key do Google Sheets:**
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a **Google Sheets API**
4. Vá em "Credenciais" → "Criar credenciais" → "Chave de API"
5. Copie a chave e cole no `.env.local`
6. **Importante:** Configure as restrições de API para permitir apenas a Google Sheets API
7. **Importante:** Configure as restrições de aplicativo para permitir apenas seu domínio (ou deixe sem restrições para desenvolvimento)

**⚠️ IMPORTANTE - Compartilhamento da Planilha:**
Para que a API Key funcione para **leitura**, você precisa:
- Compartilhar a planilha publicamente (pelo menos para leitura), OU
- Usar uma Service Account (recomendado para produção)

**Para escrita na planilha:**
A API Key não permite escrita. Você tem duas opções:
1. **Service Account (Recomendado):** Crie uma Service Account no Google Cloud Console, baixe o JSON de credenciais e compartilhe a planilha com o email da Service Account
2. **Manter Google Apps Script:** Use o Google Apps Script apenas para operações de escrita

A planilha já está configurada com ID: `1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ`

3. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

4. Acesse [http://localhost:3000](http://localhost:3000)

## 🎨 Features Implementadas

- ✅ **Dark Mode / Light Mode** - Alternância de tema com persistência no localStorage
- ✅ **Interface Moderna e Responsiva** - Design adaptável para mobile e desktop
- ✅ **Sistema de Votação** - Formulário completo com validação de CPF
- ✅ **Painel Administrativo** - Login integrado e gerenciamento completo
- ✅ **Gerenciamento de Pautas** - Criar, editar, excluir e visualizar pautas
- ✅ **Gerenciamento de Moradores** - Upload de Excel e gerenciamento de dados
- ✅ **Visualização de Resultados** - Placar em tempo real e exportação para Excel
- ✅ **Upload de Planilhas Excel** - Atualização em massa de moradores

## 📁 Estrutura do Projeto

```
├── app/
│   ├── layout.tsx                    # Layout principal com ThemeProvider
│   ├── page.tsx                      # Página inicial (redireciona para /pautas)
│   ├── globals.css                   # Estilos globais e Tailwind
│   ├── pautas/
│   │   └── page.tsx                 # Lista de pautas disponíveis
│   ├── votacao/
│   │   └── page.tsx                 # Formulário de votação
│   └── admin/
│       └── page.tsx                 # Painel administrativo
├── components/
│   ├── ThemeProvider.tsx            # Provedor de tema (context)
│   ├── ThemeToggle.tsx               # Botão de alternar tema
│   └── admin/
│       ├── VisualizarPautaTab.tsx   # Aba de visualização de pautas
│       ├── GerenciarPautasTab.tsx   # Aba de gerenciamento de pautas
│       └── GerenciarMoradoresTab.tsx # Aba de gerenciamento de moradores
├── lib/
│   └── api.ts                       # Serviço de API para Google Apps Script
└── public/                          # Arquivos estáticos
```

## 🎯 Funcionalidades Principais

### Página de Pautas (`/pautas`)
- Lista todas as pautas com status "Votação Liberada"
- Cards informativos com opções de votação
- Botão para acessar área administrativa

### Formulário de Votação (`/votacao?tipo=...`)
- Busca de morador por CPF
- Exibição de dados do morador
- Opções de voto dinâmicas
- Placar em tempo real
- Confirmação de voto registrado

### Painel Administrativo (`/admin`)
- **Login integrado** - Autenticação com CPF e senha
- **Visualizar Pauta** - Detalhes, placar e lista de votos
- **Gerenciar Pautas** - CRUD completo de pautas
- **Gerenciar Moradores** - Upload de Excel e gerenciamento

## 🔧 Configuração do Google Apps Script

O sistema se comunica com o Google Apps Script existente. Certifique-se de que:

1. O Google Apps Script está publicado como Web App
2. A URL está configurada em `.env.local`
3. As funções do backend estão implementadas corretamente

## 🌙 Dark Mode

O tema é persistido no `localStorage` e respeita a preferência do sistema no primeiro acesso. O usuário pode alternar entre temas usando o botão no header.

## 📝 Notas Importantes

- O upload de Excel requer autorização do Google Drive na primeira execução
- As permissões são solicitadas automaticamente pelo Google Apps Script
- O sistema usa `sessionStorage` para manter a sessão administrativa

## 🚀 Build para Produção

```bash
npm run build
npm start
```

Ou faça deploy em plataformas como Vercel, Netlify, etc.

