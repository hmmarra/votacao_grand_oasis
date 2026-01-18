---
description: Como criar e manter Background Functions no Netlify para sincronização automática
---

Este workflow descreve o padrão para transformar APIs de sincronização existentes em Background Functions do Netlify com agendamento automático e segurança via JWT.

### 1. Padrão de Arquivo
Todas as funções devem ser criadas na pasta `netlify/functions/` e terminar com o sufixo `-background.ts`.
Exemplo: `netlify/functions/sync-fuel-background.ts`

### 2. Estrutura de Segurança (Obrigatório)
Toda função deve validar se a chamada é legítima. O token JWT deve ser enviado no header `Authorization`.

```ts
const isCron = event.headers['user-agent']?.includes('Netlify');
const isLocal = event.headers['host']?.includes('localhost');

if (!isCron && !isLocal) {
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('Falha de Segurança: Token JWT ausente');
        return { statusCode: 401, body: 'Não autorizado' };
    }
    // Lógica de validação do JWT_SECRET aqui
}
```

### 3. Registro no netlify.toml
Sempre adicione o agendamento (cron) no arquivo raiz `netlify.toml`.

```toml
[functions."nome-da-funcao-background"]
  schedule = "0 2 * * *" # Ex: Todo dia às 02h da manhã
```

### 4. Checklist de Migração de API
Ao converter uma API de `app/api/...` para Background Function:
1. Reutilize as configurações de banco (`mssql` e `mongoose`).
2. Adicione logs detalhados via `console.log` para monitoramento no painel do Netlify.
3. Garanta que a função retorne apenas status `200` ou `202` para o Netlify gerenciar o background corretamente.
4. Ao final, atualize o `SyncLog` no MongoDB para manter o histórico visível no dashboard do portal.
