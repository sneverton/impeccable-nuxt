# Quality Rules

## Nuxt

- Pages orchestrate components; they do not own reusable business widgets.
- Avoid manual imports that Nuxt auto-imports already cover.

## Vuetify

- Do not target internal Vuetify classes as the primary contract.
- Avoid deep selector chains and unnecessary !important.
- Prefer refining existing Vuetify primitives instead of rebuilding them.

## CSS and SCSS

- Keep nesting shallow.
- Prefer layout primitives over one-off spacing hacks.
- Flag selectors that are too specific to survive refactors.

## Catalog

- Every reusable component should carry <catalog lang="json">.
- Broken semantic references are audit findings.
