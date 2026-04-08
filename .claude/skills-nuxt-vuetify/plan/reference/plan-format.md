# Plan Format

## Naming

- Components: `PascalCase.vue`
- Composables: `useEntityAction.ts`
- Configs: `kebab-case.ts`

## Nuxt structure

- Use file-based routing under `pages/`.
- Rely on Nuxt auto-imports for `components/` and `composables/`.
- Prefer `<script setup lang="ts">` and `<style scoped lang="scss">`.

## Layout strategy

- CSS Grid for 2D page sections.
- Flexbox for 1D alignment.
- Container queries when local responsiveness matters.

## Grouping rules

- Parallel for independent components and isolated configs.
- Serial for shared contracts, shared composables, and final page integration.
- Always leave page integration, `/catalog`, and `/test` suggestions for the end.
