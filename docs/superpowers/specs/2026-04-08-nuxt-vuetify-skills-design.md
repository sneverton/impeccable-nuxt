# Design: nuxt-vuetify-skills

**Date**: 2026-04-08
**Status**: Draft
**Approach**: B — Plugin com Skills Independentes + Catalogo como Infraestrutura

---

## 1. Identidade do Plugin

**Nome**: `nuxt-vuetify-skills`
**Proposito**: Plugin Claude Code com 6 skills para desenvolvimento frontend Nuxt 4 + Vuetify 3, com forte componentizacao, catalogo de componentes auto-gerado, e fluxo think -> plan -> execute com dispatch paralelo inteligente.

**Stack alvo**: Nuxt 4, Vue 3, Vuetify 3, TypeScript, SCSS

**Principios embutidos**: Clean Architecture, SOLID pragmatico, padroes nativos do Nuxt (file-based routing, auto-imports, composables), Vuetify usado com intencao.

**Distribuicao**: Plugin Claude Code independente (`.claude-plugin/`), instalavel em qualquer projeto Nuxt 4 + Vuetify 3.

**Pre-requisito do projeto**: O projeto deve ter o bloco `<catalog lang="json">` nos componentes e rodar `/catalog` ao menos uma vez para gerar o `components.meta.json`. Funciona sem catalogo (nivel 0), mas com inteligencia reduzida.

---

## 2. Catalogo de Componentes

### 2.1 Bloco `<catalog lang="json">`

Metadata semantico local em cada componente `.vue`:

```vue
<catalog lang="json">
{
  "title": "Project Status Badge",
  "category": "display",
  "domain": "projects",
  "tags": ["status", "badge", "project"],
  "purpose": "Displays project status as a colored chip with icon",
  "useWhen": "Showing project status in lists, cards, or detail pages",
  "avoidWhen": "For generic status display not tied to project lifecycle, use StatusChip instead",
  "status": "stable",
  "related": ["StatusChip", "ProjectCard"],
  "replaces": null,
  "usedBy": ["ProjectListItem", "ProjectDetailHeader"]
}
</catalog>
```

### Campos obrigatorios

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `title` | string | Nome legivel do componente |
| `category` | enum | `app`, `display`, `feedback`, `form`, `navigation`, `overlay`, `section`, `domain` |
| `domain` | string \| null | `null` para base/global, preenchido para componentes de dominio |
| `tags` | string[] | Tags para busca e matching |
| `purpose` | string | O que o componente faz (1 frase) |
| `useWhen` | string | Quando usar |
| `avoidWhen` | string | Quando NAO usar e o que usar no lugar |
| `status` | enum | `draft`, `stable`, `deprecated` |
| `related` | string[] | Componentes relacionados (por nome) |
| `replaces` | string \| null | Componente que este substitui |
| `usedBy` | string[] | Componentes/paginas que consomem este |

### Taxonomia de categories

- `app` — shell, layout, providers
- `display` — exibicao de dados (badges, cards, lists, tables)
- `feedback` — alerts, toasts, loading, empty states, error states
- `form` — inputs, selects, form groups, wizards
- `navigation` — menus, tabs, breadcrumbs, sidebars
- `overlay` — modals, dialogs, drawers, tooltips
- `section` — secoes de pagina, containers semanticos
- `domain` — componentes atados a um dominio de negocio especifico

**Regra de domain**: `null` para componentes base/global, preenchido para componentes de dominio.

### 2.2 Script de geracao (`generate-catalog.ts`)

Combina duas fontes:

1. **`vue-component-meta`** — metadados tecnicos: props (nome, tipo, required, default), emits, slots, exposed methods. Extracao maxima de informacao.
2. **Bloco `<catalog>`** — metadados semanticos parseados do SFC

**Produz:**
- `components.meta.json` — indice agregado na raiz do projeto (commitado no repo)
- `components/{ComponentName}.meta.json` — JSON individual por componente (opcional, para inspecao)

**Formato do agregado:**

```json
{
  "generated": "2026-04-08T12:00:00Z",
  "version": "1.0.0",
  "components": [
    {
      "name": "ProjectStatusBadge",
      "file": "components/projects/ProjectStatusBadge.vue",
      "catalog": {
        "title": "Project Status Badge",
        "category": "display",
        "domain": "projects",
        "tags": ["status", "badge", "project"],
        "purpose": "Displays project status as a colored chip with icon",
        "useWhen": "...",
        "avoidWhen": "...",
        "status": "stable",
        "related": ["StatusChip", "ProjectCard"],
        "replaces": null,
        "usedBy": ["ProjectListItem", "ProjectDetailHeader"]
      },
      "meta": {
        "props": [
          { "name": "status", "type": "ProjectStatus", "required": true, "default": null },
          { "name": "size", "type": "'small' | 'default' | 'large'", "required": false, "default": "'default'" }
        ],
        "emits": [],
        "slots": [
          { "name": "default", "description": "Optional override content" }
        ],
        "exposed": []
      }
    }
  ]
}
```

### 2.3 Quando rodar

- `/catalog` — manualmente, quando o usuario quiser atualizar
- O `/execute` sugere rodar `/catalog` ao final de uma execucao que criou/alterou componentes
- Futuro possivel: hook automatico pos-commit (fora do escopo inicial)

---

## 3. Skill `/think` — Brainstorming Adaptativo

### Proposito

Explorar a intencao do usuario, consultar o catalogo, desafiar decisoes e produzir uma descricao clara do que construir — sem tocar em codigo.

### Comportamento Adaptativo

Calibra profundidade pelo input:

- **Input simples** (ex: `/think criar pagina de listagem de projetos`): 1-2 perguntas focadas, consulta rapida ao catalogo, propoe estrutura e segue.
- **Input complexo** (ex: `/think redesenhar modulo de solicitacoes com wizard multi-step`): brainstorming profundo, multiplas perguntas, desafia decisoes, propoe 2-3 alternativas arquiteturais.
- **Input com contexto explicito** (ex: `/think criar formulario de projeto; ja existe ProjectForm mas precisa ser dividido`): usa o contexto passado, reduz perguntas ao minimo, foca no delta.

### Fluxo Interno

1. **Ler `components.meta.json`** — se existe. Se nao, avisa que `/catalog` deve rodar primeiro (mas nao bloqueia — segue com discovery manual reduzido).
2. **Analisar input** — classificar complexidade (simples/medio/complexo).
3. **Consultar catalogo** — buscar componentes relacionados por `tags`, `category`, `domain`, `useWhen`.
4. **Perguntas adaptativas** — uma por vez, priorizando: escopo, reutilizacao, variantes, dominio.
5. **Desafiar quando relevante** — aplicar principios SOLID e componentizacao:
   - "Ja existe StatusChip que faz 80% disso — estender ou criar novo?"
   - "Esse form tem 15 campos — faz sentido dividir em secoes?"
   - "Essa logica e reativa? Composable. Pura? Util."
6. **Produzir output estruturado** para o `/plan` consumir.

### Output Estruturado

```markdown
## Think Output

### O que construir
[descricao clara]

### Componentes a reutilizar
- [Nome] (category/domain) — motivo

### Componentes a criar
- [Nome] — descricao curta

### Composables/Utils/Config
- [nome] — tipo e proposito

### Decisoes tomadas
- [decisao] — justificativa
```

### Principios embutidos (de `conventions.md`)

- Componentizar quando: markup repete, responsabilidade clara, tamanho excessivo, potencial de reuso
- Composable quando: logica reativa, comportamento reutilizavel
- Util quando: logica pura e stateless
- Config quando: definicoes declarativas (menus, steps, tabs, columns)
- SOLID pragmatico (SRP, OCP, ISP principalmente)
- Inspecionar padroes existentes antes de criar novos

### O que o `/think` NAO faz

- Nao gera codigo
- Nao altera arquivos
- Nao define estrutura de arquivos (isso e do `/plan`)

---

## 4. Skill `/plan` — Plano de Execucao com Topologia

### Proposito

Transformar o output do `/think` em um plano concreto: quais arquivos criar/alterar, em que ordem, com que dependencias, e como paralelizar a execucao.

### Input

- Output estruturado do `/think` (na conversa ou o usuario cola/descreve)
- Opcionalmente, chamado direto com contexto suficiente (pula o `/think`)

### Fluxo Interno

1. **Consumir o output do `/think`**
2. **Ler `components.meta.json`** — validar componentes citados para reutilizacao, conferir props/slots
3. **Definir arvore de arquivos** — caminho exato de cada item no projeto
4. **Mapear dependencias** — quem depende de quem
5. **Definir grupos de execucao** — baseado no acoplamento real
6. **Descrever cada arquivo** — o que sera feito (nao o codigo)
7. **Apresentar ao usuario e esperar aprovacao**

### Regras de Agrupamento

- **Paralelo quando**: componentes sem dependencia mutua, composables independentes, configs isoladas
- **Serial quando**: arquivo consome contrato definido por outro do mesmo plano, alteracao em componente compartilhado que outros vao usar, pagina que integra componentes do plano
- **Sempre por ultimo**: pagina/integracao final, atualizacao do catalogo, sugestao de testes

A granularidade nao e fixa. O plano decide caso a caso baseado no acoplamento real:

- Componentes independentes entre si podem ir em paralelo
- Pagina que consome componentes deve esperar os contratos principais
- Composable compartilhado nao nasce em paralelo com agentes mexendo ao redor
- Catalogo fica para o fim, depois que a implementacao estabiliza

### Formato do Plano

```markdown
# Plan: [titulo]

## Contexto
[resumo do /think]

## Arquivos

| Acao | Caminho | Grupo | Depende de |
|------|---------|-------|------------|
| criar | components/projects/ProjectDetailHeader.vue | 1 | — |
| criar | components/projects/ProjectFinancialSection.vue | 1 | — |
| criar | composables/useProjectDetail.ts | 2 | — |
| alterar | components/shared/SectionCard.vue | 3 | — |
| criar | pages/projects/[id].vue | 4 | grupos 1,2,3 |

## Grupos de Execucao

### Grupo 1 — [nome descritivo] (paralelo)
[descricao de cada arquivo: props, responsabilidade, catalog category]

### Grupo 2 — [nome descritivo] (paralelo)
[descricao]

### Grupo N — [nome descritivo] (serial, apos X+Y)
[descricao]

## Pos-execucao
- [ ] Rodar /catalog
- [ ] Sugestao: /test [modulo]
```

### Principios embutidos (de `plan-format.md`)

- File-based routing do Nuxt
- Auto-imports (componentes em `components/`, composables em `composables/`)
- Naming: PascalCase componentes, camelCase composables, kebab-case configs
- `<script setup lang="ts">` + `<style scoped lang="scss">`
- Layout strategy: CSS Grid 2D, Flexbox 1D, container queries

### O que o `/plan` NAO faz

- Nao escreve codigo
- Nao executa nada
- Nao altera arquivos
- Nao roda sem aprovacao do usuario

---

## 5. Skill `/execute` — Execucao com Dispatch Paralelo

### Proposito

Executar o plano aprovado, despachando agentes em paralelo conforme a topologia definida, e coordenando a sequencia entre grupos.

### Input

Plano aprovado pelo usuario (output do `/plan` na conversa).

### Fluxo Interno

1. **Parsear o plano** — extrair grupos, dependencias, arquivos
2. **Para cada grupo, na ordem definida:**
   - Despachar agentes em paralelo para itens do mesmo grupo
   - Aguardar conclusao de todos os agentes do grupo
   - Validar que os arquivos foram criados/alterados
   - Avancar para o proximo grupo
3. **Pos-execucao:**
   - Sugerir `/catalog` para atualizar o manifesto
   - Sugerir `/test [modulo]` para cobertura E2E

### Dispatch de Agentes

Cada agente recebe um prompt auto-contido com:

- **O que fazer**: criar/alterar qual arquivo, caminho exato
- **Contexto do componente**: props, emits, slots esperados (do plano)
- **Componentes a reutilizar**: nomes + props relevantes (do catalogo)
- **Convencoes**: regras relevantes para o tipo de arquivo
- **Bloco `<catalog>`**: instrucao para incluir o bloco com campos corretos

O agente NAO recebe o plano inteiro — so a fatia relevante para sua tarefa.

### Convencoes Injetadas nos Agentes

**Componentes `.vue`:**
- `<script setup lang="ts">`
- `<style scoped lang="scss">`
- Incluir bloco `<catalog lang="json">` com todos os campos obrigatorios
- Props tipadas, sem business logic no template
- Computed para derivacoes, evitar watchers desnecessarios

**Composables:**
- Nome `use[Entidade][Acao]`
- Retornar refs/computeds/functions com nomes claros
- Logica reativa, reutilizavel

**Utils:**
- Funcoes puras, sem dependencia Vue
- Tipagem completa

**Configs:**
- Definicoes declarativas, tipadas
- Export default do objeto/array

**Paginas:**
- File-based routing do Nuxt
- `definePageMeta` quando necessario
- Composicao de componentes, nao logica direta

### Tratamento de Falhas

- Se um agente falha, reporta qual arquivo falhou e por que
- Nao tenta re-executar automaticamente — mostra o erro e pergunta ao usuario
- Grupos subsequentes dependentes sao pausados
- O usuario pode corrigir manualmente e pedir para continuar do grupo pausado

### O que o `/execute` NAO faz

- Nao decide o que construir (isso e do `/think`)
- Nao define a estrutura (isso e do `/plan`)
- Nao roda sem plano aprovado
- Nao faz commit automaticamente

---

## 6. Skill `/catalog` — Geracao do Manifesto

### Proposito

Escanear componentes `.vue` do projeto, combinar metadados semanticos (`<catalog>`) com metadados tecnicos (`vue-component-meta`), e gerar o manifesto agregado.

### Invocacao

```
/catalog                    # gera/atualiza tudo
/catalog [domain]           # apenas componentes de um domain
/catalog --validate         # so valida, nao gera — reporta problemas
```

### Fluxo Interno

1. **Escanear** — glob `components/**/*.vue`
2. **Para cada componente:**
   - Extrair bloco `<catalog lang="json">` (se existir)
   - Extrair metadados tecnicos via `vue-component-meta`
   - Validar campos obrigatorios
   - Validar `category` contra taxonomia
   - Validar `domain` (null para base/global)
3. **Reportar problemas:**
   - Componentes sem bloco `<catalog>`
   - Campos obrigatorios faltantes
   - Category fora da taxonomia
   - Referencias quebradas em `related`/`replaces`/`usedBy`
4. **Gerar:**
   - `components.meta.json` — indice agregado (raiz do projeto, commitado)
   - `components/{ComponentName}.meta.json` — individual (opcional)
5. **Reportar resumo:**
   - Total escaneados, com catalog completo, sem catalog, com problemas, referencias quebradas

### Modo `--validate`

Nao gera arquivos. Reporta problemas e sugere preenchimento (a IA pode inferir `category`, `tags` e `purpose` basicos a partir do nome e props).

---

## 7. Skill `/audit` — Verificacao de Aderencia

### Proposito

Auditar componentes, paginas e estrutura contra padroes estabelecidos. Produz relatorio — sem alterar codigo.

### Invocacao

```
/audit                      # projeto inteiro
/audit [domain]             # modulo/domain especifico
/audit [ComponentName]      # componente especifico
```

### Dimensoes da Auditoria

**1. Componentizacao**
- Templates > 150 linhas — candidatos a split
- Markup duplicado — candidato a extracao
- SRP violado
- Wrappers triviais sem valor

**2. Arquitetura / SOLID**
- Logica de negocio no template
- Composables com responsabilidades misturadas
- Componentes "faz tudo" (ISP)
- Acoplamento direto (DIP)
- Watchers que poderiam ser computed

**3. Convencoes Nuxt**
- Naming fora do padrao
- Paginas com logica excessiva
- `definePageMeta` ausente
- Imports manuais redundantes

**4. Vuetify**
- Defaults re-especificados
- Deep selector chains frageis
- `!important` desnecessarios
- Vuetify sem refinamento

**5. Catalogo**
- Componentes sem `<catalog>`
- Campos invalidos/faltantes
- Referencias quebradas
- `status: deprecated` em uso ativo
- `avoidWhen` sendo ignorado

**6. CSS/SCSS**
- Seletores excessivamente especificos
- Nesting profundo
- Variaveis nao utilizadas
- Layout strategy inadequada

### Severidades

- **Critico** — viola principio core (SRP, componentizacao, acoplamento forte)
- **Atencao** — desvio de convencao que degrada manutenibilidade
- **Sugestao** — oportunidade de melhoria, nao urgente

### Formato do Relatorio

```markdown
# Audit: [escopo]

## Resumo
- Criticos: N
- Atencao: N
- Sugestoes: N

## Criticos
### [C1] NomeArquivo — titulo do problema
- **Dimensao**: [qual]
- **Problema**: [descricao]
- **Sugestao**: [o que fazer]
- **Comando sugerido**: [skill relevante]

## Atencao
[...]

## Sugestoes
[...]
```

### O que o `/audit` NAO faz

- Nao altera codigo
- Nao audita testes (isso e do `/test`)
- Nao audita performance ou acessibilidade

---

## 8. Skill `/test` — E2E Quality Auditor

### Proposito

Auditar, estabilizar e expandir testes E2E de um modulo especifico usando Playwright.

### Invocacao

```
/test [modulo]              # auditar/expandir testes do modulo
/test [ComponentName]       # focar nos fluxos de um componente
/test --audit-only          # so diagnostica, nao cria/altera
```

### Fluxo Interno

1. **Mapear o modulo alvo** — paginas, componentes, composables, stores
2. **Localizar testes existentes**
3. **Rodar apenas os testes do modulo**
4. **Diagnosticar:** testes quebrados, frageis, obsoletos, gaps de cobertura
5. **Para cada falha, determinar causa raiz:** teste, frontend, ou ambos
6. **Corrigir testes:** waits inteligentes, seletores estaveis, isolamento
7. **Adicionar `data-testid`** onde necessario (alteracao minima no frontend)
8. **Criar testes faltantes**
9. **Re-rodar e validar**
10. **Reportar**

### Convencoes de `data-testid`

Naming: `<module>-<section>-<element>-<action>`, kebab-case, ingles.

### Prioridade de Seletores

1. `getByTestId()`
2. `getByRole()`
3. `aria-label`
4. Texto visivel estavel
5. Outros seletores justificados

Nunca: classes internas do Vuetify como seletor primario.

### Cobertura Alvo

Quando aplicavel: navegacao/rotas, listagem/busca/filtros/paginacao, criacao/edicao/exclusao, validacao de formularios, estados loading/empty/error, mensagens sucesso/erro, confirmacao de acoes destrutivas.

### Permissoes de Alteracao no Frontend

**Pode**: adicionar `data-testid`, adicionar `aria-label`, corrigir bugs reais, ajustes minimos para testabilidade.

**Nao pode**: alterar logica de negocio, refatorar componentes, mudar UI para forcar testes, alterar contratos de API.

### Integracao com o Fluxo

- **Standalone**: usuario chama quando quiser
- **Pos-execute**: sugerido ao final de uma execucao
- Consulta `components.meta.json` para entender o modulo

### Relatorio Final

```markdown
# Test Report: [modulo]

## Resumo
- Testes existentes: N
- Removidos (obsoletos): N
- Corrigidos: N
- Criados: N
- data-testid adicionados: N
- Frontend alterado: N

## Detalhes
[por teste: o que mudou e por que]

## Gaps Restantes
[fluxos nao cobertos e justificativa]
```

### O que o `/test` NAO faz

- Nao roda a suite inteira
- Nao testa performance ou acessibilidade
- Nao cria abstracoes excessivas
- Nao adapta UI para forcar testes

---

## 9. Estrutura Final do Plugin

```
nuxt-vuetify-skills/
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── .claude/
│   └── skills/
│       ├── think/
│       │   ├── SKILL.md
│       │   └── reference/
│       │       └── conventions.md
│       ├── plan/
│       │   ├── SKILL.md
│       │   └── reference/
│       │       └── plan-format.md
│       ├── execute/
│       │   └── SKILL.md
│       ├── catalog/
│       │   ├── SKILL.md
│       │   └── reference/
│       │       ├── catalog-schema.md
│       │       └── taxonomy.md
│       ├── audit/
│       │   ├── SKILL.md
│       │   └── reference/
│       │       └── quality-rules.md
│       └── test/
│           ├── SKILL.md
│           └── reference/
│               └── test-conventions.md
├── scripts/
│   └── generate-catalog.ts
├── package.json
├── README.md
└── LICENSE
```

### Grafo de Dependencias

```
/catalog  (gera components.meta.json)
    |
    v
/think --> /plan --> /execute --> sugere /catalog
                                  └──> sugere /test

/audit  (independente, consulta components.meta.json)
/test   (independente, consulta components.meta.json)
```

Nenhuma skill bloqueia outra. O fluxo think -> plan -> execute e recomendado, mas cada skill funciona standalone.

### Distribuicao de Principios

| Principio | Arquivo | Usado por |
|-----------|---------|-----------|
| Componentizacao, composable/util/config | `think/reference/conventions.md` | `/think`, `/plan` |
| SOLID pragmatico | `think/reference/conventions.md` | `/think`, `/audit` |
| Naming, estrutura Nuxt, SFC standards | `plan/reference/plan-format.md` | `/plan`, `/execute` |
| Regras visuais Vuetify, CSS/SCSS | `audit/reference/quality-rules.md` | `/audit` |
| data-testid, seletores, Playwright | `test/reference/test-conventions.md` | `/test` |

### Adocao Gradual

- **Nivel 0**: Instala plugin, usa `/think` e `/plan` sem catalogo — convencoes e SOLID
- **Nivel 1**: Roda `/catalog`, adiciona blocos `<catalog>` — discovery inteligente
- **Nivel 2**: Usa `/execute` com dispatch paralelo — produtividade maxima
- **Nivel 3**: `/audit` e `/test` como praticas regulares — qualidade sustentavel
