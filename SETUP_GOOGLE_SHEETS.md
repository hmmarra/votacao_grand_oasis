# Configuração do Google Sheets API

Este guia explica como configurar o acesso direto à planilha do Google Sheets.

## Opção 1: API Key (Apenas Leitura)

### Passo 1: Criar API Key
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a **Google Sheets API**
4. Vá em "Credenciais" → "Criar credenciais" → "Chave de API"
5. Copie a chave gerada

### Passo 2: Compartilhar Planilha
Para que a API Key funcione, você precisa compartilhar a planilha:
- Opção A: Compartilhar publicamente (não recomendado para produção)
- Opção B: Usar Service Account (veja Opção 2 abaixo)

### Passo 3: Configurar no Projeto
Adicione no `.env.local`:
```env
GOOGLE_SHEETS_API_KEY=sua_chave_aqui
```

## Opção 2: Service Account (Leitura e Escrita) - RECOMENDADO

### Passo 1: Criar Service Account
1. No Google Cloud Console, vá em "IAM e administração" → "Contas de serviço"
2. Clique em "Criar conta de serviço"
3. Dê um nome (ex: "votacao-sheets-access")
4. Clique em "Criar e continuar"
5. Pule as permissões (não precisa)
6. Clique em "Concluir"

### Passo 2: Criar e Baixar Chave
1. Clique na conta de serviço criada
2. Vá na aba "Chaves"
3. Clique em "Adicionar chave" → "Criar nova chave"
4. Escolha JSON e clique em "Criar"
5. O arquivo JSON será baixado - guarde-o com segurança

### Passo 3: Compartilhar Planilha com Service Account
1. Abra o arquivo JSON baixado
2. Copie o email que está no campo `client_email` (algo como: `votacao-sheets-access@seu-projeto.iam.gserviceaccount.com`)
3. Abra a planilha do Google Sheets: https://docs.google.com/spreadsheets/d/1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ
4. Clique em "Compartilhar" (botão no canto superior direito)
5. Cole o email da Service Account
6. Dê permissão de "Editor"
7. Clique em "Enviar"

### Passo 4: Configurar no Projeto
1. Coloque o arquivo JSON na raiz do projeto como `google-service-account.json`
2. Adicione no `.env.local`:
```env
GOOGLE_SERVICE_ACCOUNT_PATH=./google-service-account.json
```

**⚠️ IMPORTANTE:** 
- NUNCA commite o arquivo JSON no Git
- Adicione `google-service-account.json` no `.gitignore`
- Em produção, use variáveis de ambiente ou serviços de gerenciamento de segredos

## Estrutura da Planilha

A planilha deve ter as seguintes abas:
- **moradores**: CPF, Nome, Apartamento, Torre
- **pautas**: Nome da Pauta, Descrição, Opções, Status, Nome da Aba
- **administrador**: CPF, Senha, Nome
- **[nome da aba]**: Para cada pauta, uma aba com os votos (CPF, Nome, Apartamento, Torre, Voto, Timestamp)

## ID da Planilha

A planilha já está configurada com ID: `1Ex9qmWfj-Jnu0AcFGNsTH88L8a5pDnZUmeB02_WZFdQ`

