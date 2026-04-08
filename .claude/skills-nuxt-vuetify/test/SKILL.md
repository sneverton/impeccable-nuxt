---
name: test
description: Audit and expand Playwright E2E coverage for a Nuxt/Vuetify module while keeping frontend edits minimal.
---

# Test

## Purpose

Map a module, run only its E2E coverage, stabilize flaky selectors, and add the smallest possible frontend hooks such as data-testid or aria-label.

## Workflow

1. Map the target pages, components, composables, and stores.
2. Run only the relevant Playwright tests.
3. Diagnose whether each failure belongs to the test, the frontend, or both.
4. Fix selectors and waits first.
5. Add data-testid only when a stable semantic selector is missing.
6. Create the missing tests and rerun the module suite.
