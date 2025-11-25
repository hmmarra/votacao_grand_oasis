# Sistema de Votação Genérico - Guia de Uso

## Visão Geral

O sistema foi adaptado para suportar múltiplos tipos de votação (síndico, normas, orçamentos, etc.) usando a aba "moradores" como base de dados dos eleitores.

## Estrutura do Google Sheets

### Aba "moradores" (Obrigatória)
Esta aba contém todos os moradores que podem votar. Estrutura:

| CPF | Nome | Apartamento | Torre |
|-----|------|-------------|-------|
| 24303016000131 | MAIA & ANJOS SOCIEDADE DE ADVOGADOS | 1 | 1 |

**Importante:** Esta é a única fonte de validação de eleitores. Todos os CPFs devem estar nesta aba.

### Aba de Votação (Criada automaticamente)
Para cada tipo de votação, uma aba será criada automaticamente com o nome do tipo (ex: "sindico", "normas", "orcamentos"). Estrutura:

| CPF | Nome | Apartamento | Torre | Voto | TimeStamp |
|-----|------|-------------|-------|------|-----------|
| 24303016000131 | MAIA & ANJOS SOCIEDADE DE ADVOGADOS | 1 | 1 | Sinal | 25/11/2025 10:30 |

### Aba de Candidatos/Opções (Opcional)
Você pode criar abas específicas para cada tipo de votação:
- `sindico_candidatos` - Lista candidatos para votação de síndico
- `normas_candidatos` - Lista opções para votação de normas
- `orcamentos_candidatos` - Lista opções para votação de orçamentos

Ou usar uma aba genérica `candidatos` que será usada quando não houver aba específica.

Estrutura (apenas uma coluna):
| Candidato/Opção |
|-----------------|
| Sinal |
| Gilson |
| Roger |

### Aba "config_votacoes" (Opcional - Recomendado)
Para configurar títulos e descrições personalizadas para cada votação:

| Tipo | Título | Descrição | Candidatos |
|------|--------|-----------|------------|
| sindico | Eleição de Síndico | Escolha o novo síndico do condomínio | Sinal, Gilson, Roger |
| normas | Aprovação de Normas | Vote nas novas normas do condomínio | Aprovar, Rejeitar |
| orcamentos | Aprovação de Orçamento | Vote na aprovação do orçamento anual | Aprovar, Rejeitar, Abster |

## Como Usar

### 1. Criar uma Nova Votação

#### Opção A: Usando aba de candidatos
1. Crie uma aba com o nome `[tipo]_candidatos` (ex: `normas_candidatos`)
2. Na primeira linha, coloque o cabeçalho: `Candidato/Opção`
3. Nas linhas seguintes, liste cada opção (uma por linha)

#### Opção B: Usando configuração
1. Crie ou edite a aba `config_votacoes`
2. Adicione uma linha com:
   - Tipo: nome da votação (ex: "normas")
   - Título: título exibido (ex: "Aprovação de Normas")
   - Descrição: descrição da votação
   - Candidatos: lista separada por vírgula (ex: "Aprovar, Rejeitar, Abster")

### 2. Acessar a Votação

Use a URL com o parâmetro `tipo`:

```
https://script.google.com/.../exec?tipo=normas
```

Exemplos:
- `?tipo=sindico` - Votação de síndico
- `?tipo=normas` - Votação de normas
- `?tipo=orcamentos` - Votação de orçamentos

### 3. Ver o Placar

```
https://script.google.com/.../exec?view=placar&tipo=normas
```

## Funções Disponíveis no Backend

### Funções Genéricas (Recomendadas)
- `getVoterGeneric(cpf, tipoVotacao)` - Busca status do eleitor para uma votação específica
- `saveVoteGeneric(cpf, voto, tipoVotacao)` - Salva voto em uma votação específica
- `getScoresGeneric(tipoVotacao)` - Retorna placar de uma votação específica
- `getVotingConfig(tipoVotacao)` - Retorna configuração de uma votação
- `getCandidates(tipoVotacao)` - Retorna lista de candidatos/opções

### Funções Legadas (Mantidas para compatibilidade)
- `getVoter(cpf)` - Usa aba "BaseDados" (antiga)
- `saveVote(cpf, sindico)` - Usa aba "BaseDados" (antiga)
- `getScores()` - Usa aba "BaseDados" (antiga)

## Exemplo de Uso Completo

### Criar Votação de Normas

1. **Criar aba de candidatos:**
   - Nome: `normas_candidatos`
   - Conteúdo:
     ```
     Candidato/Opção
     Aprovar
     Rejeitar
     Abster
     ```

2. **Acessar a votação:**
   ```
   ?tipo=normas
   ```

3. **Os eleitores votam normalmente:**
   - Digitem o CPF
   - Escolhem a opção (Aprovar, Rejeitar ou Abster)
   - Confirmam o voto

4. **Ver resultados:**
   ```
   ?view=placar&tipo=normas
   ```

## Notas Importantes

1. **Validação de Eleitores:** Todos os CPFs devem estar na aba "moradores". Se um CPF não estiver lá, não poderá votar.

2. **Criação Automática de Abas:** As abas de votação são criadas automaticamente quando o primeiro voto é registrado.

3. **Prevenção de Votos Duplicados:** O sistema impede que o mesmo CPF vote duas vezes na mesma votação.

4. **Compatibilidade:** O sistema mantém compatibilidade com o código antigo. A votação de síndico continua funcionando normalmente.

5. **Administração:** A área administrativa pode ser acessada normalmente e mostrará todas as votações.

