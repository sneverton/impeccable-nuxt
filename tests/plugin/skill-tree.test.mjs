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
