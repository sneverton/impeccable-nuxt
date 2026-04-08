import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '..', '..')
const fixtureRoot = resolve(root, 'tests/fixtures/catalog')

function withFixtureProject(callback, { includeBroken = false } = {}) {
  const projectRoot = mkdtempSync(resolve(tmpdir(), 'nuxt-vuetify-catalog-'))
  cpSync(fixtureRoot, projectRoot, { recursive: true })

  if (!includeBroken) {
    rmSync(resolve(projectRoot, 'components/broken'), { recursive: true, force: true })
  }

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
    const compatibilityAggregate = JSON.parse(
      readFileSync(
        resolve(projectRoot, '.generated/component-catalog/components.meta.json'),
        'utf8',
      ),
    )

    assert.equal(aggregate.components.length, 2)
    assert.equal(aggregate.components[1].name, 'ProjectStatusBadge')
    assert.equal(aggregate.components[1].catalog.domain, 'projects')
    assert.equal(aggregate.components[1].meta.props[0].name, 'status')
    assert.equal(aggregate.components[0].catalog.status, 'experimental')
    assert.equal(perComponent.catalog.category, 'display')
    assert.equal(compatibilityAggregate.totalComponents, 2)
    assert.equal(compatibilityAggregate.components[0].filePath, 'components/shared/StatusChip.vue')
    assert.equal(compatibilityAggregate.components[0].status, 'experimental')
    assert.deepEqual(
      compatibilityAggregate.indexes.byCategory.display,
      ['ProjectStatusBadge', 'StatusChip'],
    )
    assert.deepEqual(compatibilityAggregate.indexes.byDomain.projects, ['ProjectStatusBadge'])
  })
})

test('catalog validate mode reports broken fixtures without writing output', () => {
  withFixtureProject((projectRoot) => {
    const result = spawnSync('npm', ['run', 'catalog:validate'], {
      cwd: root,
      env: { ...process.env, CATALOG_ROOT: projectRoot },
      encoding: 'utf8',
    })

    assert.equal(result.status, 1)
    assert.match(result.stdout, /Missing <catalog lang="json"> block/)
    assert.match(result.stdout, /Broken related reference: GhostCard/)
    assert.match(result.stdout, /Field "title" must be a non-empty string/)
    assert.match(result.stdout, /Field "useWhen" must be a non-empty string/)
    assert.match(result.stdout, /Field "related" must be a string array/)
  }, { includeBroken: true })
})

test('catalog domain filter emits only the requested domain', () => {
  withFixtureProject((projectRoot) => {
    const result = spawnSync('npm', ['run', 'catalog', '--', 'projects'], {
      cwd: root,
      env: { ...process.env, CATALOG_ROOT: projectRoot },
      encoding: 'utf8',
    })

    assert.equal(result.status, 0, result.stderr)

    const aggregate = JSON.parse(
      readFileSync(resolve(projectRoot, 'components.meta.json'), 'utf8'),
    )

    assert.deepEqual(
      aggregate.components.map((component) => component.name),
      ['ProjectStatusBadge'],
    )
  }, { includeBroken: true })
})

test('catalog domain filter fails cleanly for an unknown domain', () => {
  withFixtureProject((projectRoot) => {
    const result = spawnSync('npm', ['run', 'catalog', '--', 'missing-domain'], {
      cwd: root,
      env: { ...process.env, CATALOG_ROOT: projectRoot },
      encoding: 'utf8',
    })

    assert.equal(result.status, 1)
    assert.match(result.stdout, /Unknown domain filter: missing-domain/)
    assert.equal(existsSync(resolve(projectRoot, 'components.meta.json')), false)
  })
})

test('catalog removes stale generated metadata after a failed full generation run', () => {
  withFixtureProject((projectRoot) => {
    const firstRun = spawnSync('npm', ['run', 'catalog'], {
      cwd: root,
      env: { ...process.env, CATALOG_ROOT: projectRoot },
      encoding: 'utf8',
    })

    assert.equal(firstRun.status, 0, firstRun.stderr)
    assert.equal(existsSync(resolve(projectRoot, 'components.meta.json')), true)
    assert.equal(
      existsSync(resolve(projectRoot, 'components/ProjectStatusBadge.meta.json')),
      true,
    )

    mkdirSync(resolve(projectRoot, 'components/broken'), { recursive: true })
    cpSync(
      resolve(fixtureRoot, 'components/broken/MalformedCatalog.vue'),
      resolve(projectRoot, 'components/broken/MalformedCatalog.vue'),
    )

    const secondRun = spawnSync('npm', ['run', 'catalog'], {
      cwd: root,
      env: { ...process.env, CATALOG_ROOT: projectRoot },
      encoding: 'utf8',
    })

    assert.equal(secondRun.status, 1)
    assert.equal(existsSync(resolve(projectRoot, 'components.meta.json')), false)
    assert.equal(
      existsSync(resolve(projectRoot, '.generated/component-catalog/components.meta.json')),
      false,
    )
    assert.equal(
      existsSync(resolve(projectRoot, 'components/ProjectStatusBadge.meta.json')),
      false,
    )
  })
})
