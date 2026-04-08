# Test Conventions

## Selector priority

1. getByTestId()
2. getByRole()
3. aria-label
4. stable visible text
5. justified fallback selectors

Never use internal Vuetify classes as the primary selector.

## Naming

Use kebab-case English identifiers:

- <module>-<section>-<element>-<action>

## Coverage

When applicable, cover routes, filters, CRUD flows, form validation, loading states, empty states, error states, and destructive confirmations.
