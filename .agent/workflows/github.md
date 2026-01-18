---
description: Como atualizar o repositório garantindo que a main fique 100% atualizada com o trabalho atual
---

### 1. Salvar Trabalho na Branch Atual
Identifique a branch atual e salve as alterações locais.
// turbo
```bash
git branch --show-current
git add .
git commit -m "feat/fix: descrição do trabalho realizado" (Em PT-br)
git push origin {branch_atual}
```

### 2. Atualizar a Main (Sincronização)
Traga as alterações da branch atual para a main, garantindo que a main contenha tudo.
// turbo
```bash
git checkout main
git pull origin main
git merge {branch_atual}
git push origin main
```

### 3. Retornar à Branch de Trabalho
Volte para a branch de origem para continuar o trabalho (agora ela e a main estão sincronizadas).
// turbo
```bash
git checkout {branch_atual}
```

### 4. Validação (Opcional)
Confirme que tudo está sincronizado.
```bash
git log -1
git status
```