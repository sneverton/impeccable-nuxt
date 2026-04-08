import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, cpSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '..', '..')
const fixtureRoot = resolve(root, 'tests/fixtures/catalog')

function withFixtureProject(callback) {
  const projectRoot = mkdtempSync(resolve(tmpdir(), 'nuxt-vuetify-catalog-'))
  cpSync(fixtureRoot, projectRoot, { recursive: true })

  try {
    callback(projectRoot)
  } finally {
    rmSync(projectRoot, { recursive: true, force: true })
  }
}

test('catalog command generates aggregate and per-component metadata', () => {
  withFixtureProject((projectRoot) => {
    const result = spawnSync('npm', ['run', 'catalog'], {
      cwd: root,
      env: { ...process.env, CATALOG_ROOT: projectRoot },
      encoding: 'utf8',
    })

    assert.equal(result.status, 0, result.stderr)

    const aggregate = JSON.parse(
      readFileSync(resolve(projectRoot, 'components.meta.json'), 'utf8'),
    )
    const perComponent = JSON.parse(
      readFileSync(
        resolve(projectRoot, 'components/ProjectStatusBadge.meta.json'),
        'utf8',
      ),
    )

    assert.equal(aggregate.components.length, 2)
    assert.equal(aggregate.components[1].name, 'ProjectStatusBadge')
    assert.equal(aggregate.components[1].catalog.domain, 'projects')
    assert.equal(aggregate.components[1].meta.props[0].name, 'status')
    assert.equal(perComponent.catalog.category, 'display')
  })
})
