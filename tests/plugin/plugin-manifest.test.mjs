import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(root, relativePath), 'utf8'))
}

test('plugin manifest registers the six shipped skills', () => {
  const plugin = readJson('.claude-plugin/plugin.json')

  assert.equal(plugin.name, 'nuxt-vuetify-skills')
  assert.deepEqual(
    plugin.skills.map((skill) => skill.name),
    ['think', 'plan', 'execute', 'catalog', 'audit', 'test'],
  )
})

test('marketplace manifest points at the local plugin folder', () => {
  const marketplace = readJson('.claude-plugin/marketplace.json')

  assert.equal(marketplace.name, 'nuxt-vuetify-skills')
  assert.equal(marketplace.source.path, './')
  assert.equal(marketplace.entry, '.claude-plugin/plugin.json')
})
