---
name: catalog
description: Generate and validate the Nuxt component catalog for Vue SFCs with semantic and technical metadata.
---

# Catalog

## Purpose

Scan `components/**/*.vue`, extract `<catalog lang="json">`, merge the result with `vue-component-meta`, and write `components.meta.json`.

## Commands

- `/catalog` - generate aggregate and per-component metadata
- `/catalog [domain]` - generate only one semantic domain
- `/catalog --validate` - report problems without writing files

## Behavior

1. Read the project root catalog target from the current working directory.
2. Inspect every Vue component under `components/`.
3. Require the semantic schema documented in `reference/catalog-schema.md`.
4. Validate `category` and `domain` rules from `reference/taxonomy.md`.
5. Report broken `related`, `replaces`, and `usedBy` references.
6. Generate `components.meta.json` and `components/{ComponentName}.meta.json` unless `--validate` is active.
