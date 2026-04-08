---
name: plan
description: Transform a think output into an execution topology with exact files, dependency order, and parallel groups.
---

# Plan

## Purpose

Turn an approved design direction into a concrete file tree and execution sequence. This skill never writes code and never runs without user approval.

## Flow

1. Consume the latest think output or a direct request with equivalent detail.
2. Read `components.meta.json` when the plan references reusable components. Fall back to `.generated/component-catalog/components.meta.json` when the project only ships the slim catalog.
3. Define the exact file paths, grouped by dependency order.
4. Mark which files can run in parallel and which must wait.
5. Present the plan and esperar aprovacao do usuario.

## Output Shape

```md
# Plan: Project Details Page

## Contexto
Create a project details page using the existing status badge and a new sidebar.

## Arquivos
| Acao | Caminho | Grupo | Depende de |

## Grupos de Execucao
### Grupo 1 - paralelo
### Grupo 2 - serial

## Pos-execucao
- [ ] Rodar /catalog
- [ ] Sugestao: /test projects
```
