---
name: think
description: Explore Nuxt 4 + Vuetify 3 frontend requests, reuse the catalog when present, and return a structured design brief without editing code.
---

# Think

## Purpose

Clarify what to build before implementation. Consult `components.meta.json` when it exists, or `.generated/component-catalog/components.meta.json` when the project ships the slim catalog mirror, ask only the minimum useful questions, and challenge weak component boundaries.

## Flow

1. Read `components.meta.json` when available. Fall back to `.generated/component-catalog/components.meta.json` when the project exposes only the slim catalog.
2. Classify the request as simple, medium, or complex.
3. Search for reusable components by `tags`, `category`, and `domain`. Use `useWhen` only when the rich catalog includes it.
4. Ask focused follow-up questions only when the request still has material ambiguity.
5. Produce the structured output below and stop. Do not write code.

## Think Output

### O que construir

Describe the requested page, flow, or component in one sentence.

### Componentes a reutilizar

- `ProjectStatusBadge` - reuse when the request needs project lifecycle display.

### Componentes a criar

- `ProjectDetailsSidebar` - summarize project metadata and actions.

### Composables/Utils/Config

- `useProjectDetails` - keep reactive fetch and transformation logic outside the page component.

### Decisoes tomadas

- Split the header and sidebar because the concerns and reuse surface are different.
