import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..', '..')

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8')
}

test('catalog skill files exist and describe validate mode', () => {
  const files = [
    '.claude/skills-nuxt-vuetify/catalog/SKILL.md',
    '.claude/skills-nuxt-vuetify/catalog/reference/catalog-schema.md',
    '.claude/skills-nuxt-vuetify/catalog/reference/taxonomy.md',
  ]

  for (const file of files) {
    assert.equal(existsSync(resolve(root, file)), true, `${file} should exist`)
  }

  const skill = read('.claude/skills-nuxt-vuetify/catalog/SKILL.md')
  assert.match(skill, /\/catalog --validate/)
  assert.match(skill, /components\.meta\.json/)
})

test('think and plan skills explain catalog-aware design and execution topology', () => {
  const files = [
    '.claude/skills-nuxt-vuetify/think/SKILL.md',
    '.claude/skills-nuxt-vuetify/think/reference/conventions.md',
    '.claude/skills-nuxt-vuetify/plan/SKILL.md',
    '.claude/skills-nuxt-vuetify/plan/reference/plan-format.md',
  ]

  for (const file of files) {
    assert.equal(existsSync(resolve(root, file)), true, `${file} should exist`)
  }

  const think = read('.claude/skills-nuxt-vuetify/think/SKILL.md')
  const plan = read('.claude/skills-nuxt-vuetify/plan/SKILL.md')

  assert.match(think, /components\.meta\.json/)
  assert.match(think, /## Think Output/)
  assert.match(plan, /## Grupos de Execucao/)
  assert.match(plan, /esperar aprovacao/)
})
