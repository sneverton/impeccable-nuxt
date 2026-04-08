---
name: catalog
description: Generate and validate the Nuxt component catalog for Vue SFCs with semantic and technical metadata.
---

# Catalog

## Purpose

Scan `components/**/*.vue`, extract `<catalog lang="json">`, merge the result with `vue-component-meta`, and write both the rich `components.meta.json` catalog and the slim `.generated/component-catalog/components.meta.json` mirror.

## Commands

- `/catalog` - generate aggregate and per-component metadata
- `/catalog [domain]` - generate only one semantic domain
- `/catalog --validate` - report problems without writing files

## Execution Priority

1. If the project already exposes native scripts such as `catalog:generate` and `catalog:validate`, use those commands first.
2. If the project only ships catalog artifacts, read `components.meta.json` or `.generated/component-catalog/components.meta.json` directly.
3. Use the local fallback generator in `scripts/generate-catalog.ts` only when the project does not provide a native catalog workflow.

## Behavior

1. Read the project root catalog target from the current working directory.
2. Prefer the native project workflow when `catalog:generate` or `catalog:validate` already exist.
3. Inspect every Vue component under `components/` only in fallback mode.
4. Require the semantic schema documented in `reference/catalog-schema.md`.
5. Validate `category` and `domain` rules from `reference/taxonomy.md`.
6. Report broken `related`, `replaces`, and `usedBy` references in the rich schema.
7. In fallback mode, generate `components.meta.json`, `.generated/component-catalog/components.meta.json`, and `components/{ComponentName}.meta.json` unless `--validate` is active.
