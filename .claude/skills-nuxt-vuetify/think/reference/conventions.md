# Conventions

## Componentize when

- Markup repeats with the same semantic role.
- A file mixes page orchestration with display concerns.
- A section has a clear public API of props, slots, or emits.

## Use a composable when

- The logic is reactive.
- The state or behavior will be reused across views.

## Use a util when

- The logic is pure and stateless.

## Use config when

- The feature is mostly declarative: tabs, step lists, table columns, or menu items.

## SOLID focus

- Favor SRP, OCP, and ISP.
- Avoid putting business logic in templates.
- Inspect existing patterns before inventing new ones.
