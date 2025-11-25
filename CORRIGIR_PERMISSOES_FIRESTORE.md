# 🔒 Corrigir Permissões do Firestore

O erro "Missing or insufficient permissions" indica que as regras de segurança do Firestore estão bloqueando o acesso.

## ⚡ Solução Rápida (Desenvolvimento)

Para testar rapidamente, configure regras temporárias de desenvolvimento:

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em **Firestore Database** → **Regras**
4. Substitua as regras por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // PERMISSÕES TEMPORÁRIAS PARA DESENVOLVIMENTO
    // ⚠️ NÃO USE EM PRODUÇÃO!
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

5. Clique em **Publicar**

## ✅ Solução Segura (Produção)

Para produção, use estas regras mais restritivas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Coleção de teste - permitir tudo temporariamente
    match /test/{document=**} {
      allow read, write: if true;
    }
    
    // Moradores - leitura pública, escrita apenas admin
    match /moradores/{document=**} {
      allow read: if true;
      allow write: if false; // Apenas via admin ou scripts
    }
    
    // Pautas - leitura pública, escrita apenas admin
    match /pautas/{document=**} {
      allow read: if true;
      allow write: if false; // Apenas via admin ou scripts
    }
    
    // Votos - leitura pública, escrita apenas para criar novos votos
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

## 🔍 Verificar se as Regras Foram Aplicadas

1. Após publicar as regras, aguarde alguns segundos
2. Recarregue a página de teste: `http://localhost:3000/test-firebase`
3. Clique em "Testar Novamente"
4. O erro de permissões deve desaparecer

## ⚠️ Importante

- **Desenvolvimento**: Use as regras permissivas temporariamente
- **Produção**: Configure regras mais restritivas
- **Teste**: Sempre teste as regras antes de colocar em produção

## 📝 Próximos Passos

1. ✅ Configure as regras no Firebase Console
2. ✅ Teste a conexão novamente
3. ✅ Se funcionar, ajuste as regras para produção
4. ✅ Teste todas as funcionalidades

