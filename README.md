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

Copy the plugin manifests and skill tree into the target project:

```bash
cp -r .claude-plugin /path/to/your-project/
mkdir -p /path/to/your-project/.claude
cp -r .claude/skills-nuxt-vuetify /path/to/your-project/.claude/
```

Then install the package dependencies:

```bash
npm install
```

## Catalog workflow

Projects get the best results when reusable components include `<catalog lang="json">` blocks and the catalog stays current:

```bash
npm run catalog
npm run catalog -- projects
npm run catalog:validate
```

`npm run catalog` writes `components.meta.json` plus `components/*.meta.json` in the target project root. Use `CATALOG_ROOT=/path/to/project` when validating or generating metadata for another workspace.

## Daily command flow

The recommended daily flow is `/think` -> `/plan` -> `/execute`, followed by `/catalog` and `/test`.

## Local verification

```bash
npm test
```

This runs the manifest smoke tests, skill-tree checks, and fixture-driven catalog coverage.

## License

Apache 2.0. See [LICENSE](LICENSE).
