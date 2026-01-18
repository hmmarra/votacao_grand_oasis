---
description: Pipeline de deploy seguro (atualiza git, muda para deploye, type-check, build e push)
---

Este workflow garante que o deploy no Netlify seja feito apenas se o código estiver buildando corretamente e sem erros de TypeScript.

// turbo-all
1. Atualizar o trabalho atual no Git:
   - `git add .`
   - `git commit -m "chore: pre-deploy check and fixes" (em PT-br)`

2. Garantir que estamos na branch `main`:
   - `git checkout main`

3. Executar verificação de tipos:
   - `npm run type-check`

4. Se tudo passar, enviar para o remoto para disparar o deploy no Netlify:
   - `git add .`
   - `git commit -m "build: production-ready deploy"`
   - `git push origin main`