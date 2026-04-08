---
name: execute
description: Execute an approved Nuxt/Vuetify implementation plan using dependency-aware parallel dispatch.
---

# Execute

## Purpose

Apply an approved /plan by dispatching independent files in parallel and serializing dependent groups.

## Flow

1. Parse the approved plan into ordered groups.
2. Dispatch agents in parallel inside each group.
3. Wait for the whole group to finish before starting dependent groups.
4. Report failures with the exact file that stopped the flow.
5. Suggest /catalog and /test after implementation.

## Failure handling

- If one agent fails, stop the dependent groups.
- Nao tenta re-executar automaticamente.
- Ask the user whether to fix manually or resume from the failed group.
