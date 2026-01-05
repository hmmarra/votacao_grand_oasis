# Conexão com Cloudflare R2

Este documento descreve a configuração e conexão com o serviço de armazenamento **Cloudflare R2**, utilizado nesta aplicação para o gerenciamento de arquivos (como anexos e uploads).

A integração é realizada através da biblioteca oficial `@aws-sdk/client-s3`, aproveitando a compatibilidade do R2 com a API S3 da Amazon.

## 🛠️ Configuração do Ambiente (.env.local)

Para que o upload e download de arquivos funcionem corretamente, é necessário configurar as credenciais do Cloudflare R2 no seu arquivo de variáveis de ambiente local.

As seguintes variáveis devem ser adicionadas ao seu arquivo `.env.local`:

```env
# Cloudflare R2 Configuration
CLOUDFLARE_ACCOUNT_ID=seu_account_id_aqui
R2_ACCESS_KEY_ID=sua_access_key_id_aqui
R2_SECRET_ACCESS_KEY=sua_secret_access_key_aqui
R2_BUCKET_NAME=datashare-anexos
```

### Detalhes das Variáveis

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `CLOUDFLARE_ACCOUNT_ID` | O ID da sua conta no painel do Cloudflare. | `89a...` |
| `R2_ACCESS_KEY_ID` | O ID da chave de acesso gerada (API Token). | `012...` |
| `R2_SECRET_ACCESS_KEY` | A chave secreta correspondente ao ID acima. | `a1b...` |
| `R2_BUCKET_NAME` | O nome do bucket criado no R2. | `datashare-anexos` |

## 🔑 Como obter as credenciais

1. Acesse o painel do [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. No menu lateral, navegue até **R2**.
3. Na página principal do R2, copieu o **Account ID** listado na barra lateral direita.
4. Ainda na página do R2, clique em **Manage R2 API Tokens** (Gerenciar tokens de API do R2).
5. Clique em **Create API Token**.
6. Configure o token:
   - **Token name**: Dê um nome descritivo (ex: `datashare-app`).
   - **Permissions**: Selecione **Admin Read & Write** (ou permissões específicas de Object Read/Write se preferir).
   - **TTL**: Defina como "Forever" ou conforme necessidade.
7. Clique em **Create API Token**.
8. **IMPORTANTE**: Copie o `Access Key ID` e o `Secret Access Key` imediatamente. Você não poderá vê-los novamente.

## 📁 Estrutura do Código

A lógica de conexão está centralizada no arquivo:
`lib/cloudflare/r2.ts`

### Cliente S3

A aplicação exporta uma instância configurada do `S3Client`:

```typescript
import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});
```

### Exemplo de Uso

Para listar objetos ou fazer uploads em outras partes da aplicação:

```typescript
import { s3Client, R2_BUCKET_NAME } from '@/lib/cloudflare/r2';
import { PutObjectCommand } from "@aws-sdk/client-s3";

// Exemplo de upload
const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: 'nome-do-arquivo.txt',
    Body: 'conteúdo do arquivo',
});

await s3Client.send(command);
```
