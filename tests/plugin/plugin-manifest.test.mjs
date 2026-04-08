import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(root, relativePath), 'utf8'))
}

test('plugin manifest registers the six shipped skills', () => {
  const plugin = readJson('.claude-plugin/plugin.json')
  const skillsRoot = resolve(root, plugin.skills)
  const shippedSkills = readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  assert.equal(plugin.name, 'nuxt-vuetify-skills')
  assert.equal(plugin.skills, './.claude/skills-nuxt-vuetify')
  assert.deepEqual(shippedSkills, ['audit', 'catalog', 'execute', 'plan', 'test', 'think'])
  assert.equal(existsSync(skillsRoot), true)

  for (const skillName of shippedSkills) {
    const skillFile = resolve(skillsRoot, skillName, 'SKILL.md')
    assert.equal(existsSync(skillFile), true, `Missing scaffold file: ${skillFile}`)
    assert.match(readFileSync(skillFile, 'utf8'), /^---\nname: /, `Missing frontmatter in ${skillFile}`)
  }
})

test('marketplace manifest points at the local plugin folder', () => {
  const marketplace = readJson('.claude-plugin/marketplace.json')
  const pluginEntry = marketplace.plugins[0]

  assert.equal(marketplace.name, 'nuxt-vuetify-skills')
  assert.equal(marketplace.$schema, 'https://anthropic.com/claude-code/marketplace.schema.json')
  assert.equal(pluginEntry.source, './')
  assert.equal(pluginEntry.name, 'nuxt-vuetify-skills')
})

test('README documents plugin installation and command flow', () => {
  const readme = readFileSync(resolve(root, 'README.md'), 'utf8')

  assert.match(readme, /nuxt-vuetify-skills/)
  assert.match(readme, /\/think/)
  assert.match(readme, /\/plan/)
  assert.match(readme, /\/execute/)
  assert.match(readme, /\/catalog/)
  assert.match(readme, /\/audit/)
  assert.match(readme, /\/test/)
  assert.match(readme, /\.generated\/component-catalog\/components\.meta\.json/)
  assert.equal(existsSync(resolve(root, 'LICENSE')), true)
})
