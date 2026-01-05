# Configuração do Firebase

Este guia explica como configurar o Firebase para o sistema de votação.

## Por que Firebase?

- ✅ **Mais simples** que Google Sheets API
- ✅ **Real-time updates** automáticos
- ✅ **Autenticação integrada**
- ✅ **Melhor performance**
- ✅ **Escalável** e confiável
- ✅ **Gratuito** para uso moderado

## Passo 1: Criar Projeto Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Dê um nome ao projeto (ex: "votacao-sindico")
4. Desative o Google Analytics (ou mantenha se quiser)
5. Clique em "Criar projeto"

## Passo 2: Configurar Firestore

1. No menu lateral, clique em "Firestore Database"
2. Clique em "Criar banco de dados"
3. Escolha "Começar no modo de teste" (para desenvolvimento)
4. Escolha uma localização (ex: `southamerica-east1` para Brasil)
5. Clique em "Ativar"

## Passo 3: Configurar Regras de Segurança

No Firestore, vá em "Regras" e configure:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Moradores - leitura pública, escrita apenas admin
    match /moradores/{document=**} {
      allow read: if true;
      allow write: if false; // Apenas via admin
    }
    
    // Pautas - leitura pública, escrita apenas admin
    match /pautas/{document=**} {
      allow read: if true;
      allow write: if false; // Apenas via admin
    }
    
    // Votos - leitura pública, escrita apenas para votos próprios
    match /votos/{document=**} {
      allow read: if true;
      allow create: if true; // Qualquer um pode criar (votar)
      allow update, delete: if false; // Não pode editar/deletar
    }
    
    // Administradores - apenas leitura para autenticação
    match /administradores/{document=**} {
      allow read: if true; // Para autenticação
      allow write: if false; // Apenas manualmente
    }
  }
}
```

**⚠️ IMPORTANTE:** Para produção, ajuste as regras para serem mais restritivas!

## Passo 4: Obter Credenciais

1. No projeto Firebase, clique no ícone de engrenagem → "Configurações do projeto"
2. Role até "Seus aplicativos"
3. Clique no ícone `</>` (Web)
4. Dê um nome ao app (ex: "Sistema de Votação")
5. Copie as credenciais que aparecem

## Passo 5: Configurar no Projeto

Crie/atualize o arquivo `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
```

## Passo 6: Migrar Dados do Google Sheets

Você precisará migrar os dados do Google Sheets para o Firestore:

### Estrutura das Coleções:

1. **moradores**
   - Campos: `cpf`, `nome`, `apartamento`, `torre`

2. **pautas**
   - Campos: `nomePauta`, `descricao`, `opcoes` (array), `status`, `aba`

3. **votos**
   - Campos: `cpf`, `nome`, `apartamento`, `torre`, `voto`, `tipoVotacao`, `timestamp`

4. **administradores**
   - Campos: `cpf`, `senha`, `nome`

### Script de Migração

Você pode criar um script Node.js para migrar os dados, ou fazer manualmente pelo console do Firebase.

## Passo 7: Atualizar o Código

O código já está preparado! Basta:

1. Instalar dependências:
```bash
npm install
```

2. Atualizar `lib/api.ts` para usar `firebaseApi` ao invés de chamadas HTTP

3. Reiniciar o servidor:
```bash
npm run dev
```

## Comparação: Firebase vs Google Sheets

| Recurso | Firebase | Google Sheets |
|---------|----------|---------------|
| Configuração | ⭐⭐⭐⭐⭐ Simples | ⭐⭐⭐ Média |
| Performance | ⭐⭐⭐⭐⭐ Excelente | ⭐⭐⭐ Boa |
| Real-time | ⭐⭐⭐⭐⭐ Nativo | ⭐⭐ Limitado |
| Escalabilidade | ⭐⭐⭐⭐⭐ Alta | ⭐⭐⭐ Média |
| Custo | Gratuito até 50k leituras/dia | Gratuito |
| Autenticação | ⭐⭐⭐⭐⭐ Integrada | ⭐⭐ Manual |

## Próximos Passos

1. ✅ Configurar Firebase
2. ✅ Migrar dados do Google Sheets
3. ✅ Testar todas as funcionalidades
4. ✅ Ajustar regras de segurança para produção

