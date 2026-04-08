# nuxt-vuetify-skills

Claude Code plugin for Nuxt 4 + Vuetify 3 projects.

## Included skills

- `/think` - adaptive brainstorming with catalog-aware reuse
- `/plan` - dependency-aware file topology
- `/execute` - grouped parallel dispatch
- `/catalog` - component manifest generation and validation
- `/audit` - structural quality review
- `/test` - Playwright E2E quality audit

## Installation

Keep the plugin files together in the target project:

- `.claude-plugin/`
- `.claude/skills-nuxt-vuetify/`
- `scripts/generate-catalog.ts`
- `tsconfig.json`

Then install the workspace dependencies:

```bash
npm install
```

## Catalog workflow

Projects get the best results when reusable components include a `<catalog lang="json">` block and the catalog stays up to date:

```bash
npm run catalog
npm run catalog:validate
```

`npm run catalog` writes:

- `components.meta.json` with the rich semantic and technical metadata
- `.generated/component-catalog/components.meta.json` with the slim compatibility mirror
- `components/*.meta.json` for per-component rich metadata

## Recommended command flow

The normal working loop is:

1. `/think`
2. `/plan`
3. `/execute`
4. `/catalog`
5. `/test`

Use `/audit` whenever you need a non-editing review of structure, catalog hygiene, Vuetify usage, or CSS quality.

## Local verification

Run the full smoke suite with:

```bash
npm test
```

## License

Apache 2.0. See [LICENSE](LICENSE).
