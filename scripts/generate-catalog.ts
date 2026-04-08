import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import fg from 'fast-glob'
import { parse } from '@vue/compiler-sfc'
import ts from 'typescript'
import { createChecker } from 'vue-component-meta'

type CatalogCategory =
  | 'app'
  | 'display'
  | 'feedback'
  | 'form'
  | 'navigation'
  | 'overlay'
  | 'section'
  | 'domain'

type CatalogStatus = 'draft' | 'stable' | 'deprecated'

type CatalogEntry = {
  title: string
  category: CatalogCategory
  domain: string | null
  tags: string[]
  purpose: string
  useWhen: string
  avoidWhen: string
  status: CatalogStatus
  related: string[]
  replaces: string | null
  usedBy: string[]
}

type OutputComponent = {
  name: string
  file: string
  catalog: CatalogEntry
  meta: {
    props: Array<{ name: string; type: string; required: boolean; default: unknown }>
    emits: Array<{ name: string }>
    slots: Array<{ name: string; description?: string }>
    exposed: Array<{ name: string }>
  }
}

type CatalogValidationTarget = Partial<CatalogEntry> & Record<string, unknown>

const projectRoot = resolve(process.env.CATALOG_ROOT ?? process.cwd())
const componentFiles = fg.sync('components/**/*.vue', { cwd: projectRoot, absolute: true })
const checker = createChecker(join(projectRoot, 'tsconfig.json'), { forceUseTs: true })
const rawArgs = process.argv.slice(2)
const validateOnly = rawArgs.includes('--validate')
const domainFilter = rawArgs.find((arg) => !arg.startsWith('--')) ?? null

function readCatalog(filePath: string): CatalogEntry {
  const source = readFileSync(filePath, 'utf8')
  const { descriptor } = parse(source, { filename: filePath })
  const block = descriptor.customBlocks.find(
    (candidate) => candidate.type === 'catalog' && candidate.lang === 'json',
  )

  if (!block) {
    throw new Error(`Missing <catalog lang="json"> block in ${relative(projectRoot, filePath)}`)
  }

  return JSON.parse(block.content) as CatalogEntry
}

function readScriptSetupProps(filePath: string): OutputComponent['meta']['props'] {
  const source = readFileSync(filePath, 'utf8')
  const { descriptor } = parse(source, { filename: filePath })
  const scriptSetup = descriptor.scriptSetup?.content

  if (!scriptSetup) {
    return []
  }

  const sourceFile = ts.createSourceFile(
    `${filePath}.ts`,
    scriptSetup,
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.TS,
  )

  const propsCall = findDefinePropsCall(sourceFile)
  const typeNode = propsCall?.typeArguments?.[0]

  if (!typeNode || !ts.isTypeLiteralNode(typeNode)) {
    return []
  }

  return typeNode.members.flatMap((member) => {
    if (!ts.isPropertySignature(member) || !member.type || !member.name) {
      return []
    }

    const name = member.name.getText(sourceFile).replace(/^['"]|['"]$/g, '')

    return [
      {
        name,
        type: member.type.getText(sourceFile),
        required: !member.questionToken,
        default: null,
      },
    ]
  })
}

function findDefinePropsCall(sourceFile: ts.SourceFile): ts.CallExpression | undefined {
  let match: ts.CallExpression | undefined

  function visit(node: ts.Node): void {
    if (
      ts.isCallExpression(node)
      && ts.isIdentifier(node.expression)
      && node.expression.text === 'defineProps'
    ) {
      match = node
      return
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return match
}

function collectComponent(filePath: string): OutputComponent {
  const catalog = readCatalog(filePath)
  const meta = checker.getComponentMeta(filePath)
  const name = basename(filePath, '.vue')
  const props = meta.props.length > 0 ? meta.props.map((prop) => ({
    name: prop.name,
    type: prop.type ?? 'unknown',
    required: Boolean(prop.required),
    default: prop.default ?? null,
  })) : readScriptSetupProps(filePath)

  return {
    name,
    file: relative(projectRoot, filePath).replaceAll('\\', '/'),
    catalog,
    meta: {
      props,
      emits: meta.events.map((event) => ({ name: event.name })),
      slots: meta.slots.map((slot) => ({
        name: slot.name,
        description: slot.description,
      })),
      exposed: meta.exposed.map((item) => ({ name: item.name })),
    },
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function validateCatalog(entry: CatalogValidationTarget, componentNames: Set<string>, file: string): string[] {
  const errors: string[] = []

  const requiredKeys: Array<keyof CatalogEntry> = [
    'title',
    'category',
    'domain',
    'tags',
    'purpose',
    'useWhen',
    'avoidWhen',
    'status',
    'related',
    'replaces',
    'usedBy',
  ]

  for (const key of requiredKeys) {
    if (!(key in entry)) {
      errors.push(`Missing required field "${key}" in ${file}`)
    }
  }

  const requiredStringFields: Array<keyof Pick<CatalogEntry, 'title' | 'purpose' | 'useWhen' | 'avoidWhen'>> = [
    'title',
    'purpose',
    'useWhen',
    'avoidWhen',
  ]

  for (const field of requiredStringFields) {
    if (typeof entry[field] !== 'string' || entry[field].trim() === '') {
      errors.push(`Field "${field}" must be a non-empty string in ${file}`)
    }
  }

  const allowedCategories = new Set<CatalogCategory>([
    'app',
    'display',
    'feedback',
    'form',
    'navigation',
    'overlay',
    'section',
    'domain',
  ])

  if (!allowedCategories.has(entry.category)) {
    errors.push(`Invalid category "${entry.category}" in ${file}`)
  }

  if (entry.domain !== null && typeof entry.domain !== 'string') {
    errors.push(`Field "domain" must be a string or null in ${file}`)
  }

  if (!isStringArray(entry.tags)) {
    errors.push(`Field "tags" must be a string array in ${file}`)
  }

  const allowedStatuses = new Set<CatalogStatus>(['draft', 'stable', 'deprecated'])

  if (!allowedStatuses.has(entry.status as CatalogStatus)) {
    errors.push(`Invalid status "${entry.status}" in ${file}`)
  }

  if (!isStringArray(entry.related)) {
    errors.push(`Field "related" must be a string array in ${file}`)
  }

  if (!isStringArray(entry.usedBy)) {
    errors.push(`Field "usedBy" must be a string array in ${file}`)
  }

  if (typeof entry.replaces !== 'string' && entry.replaces !== null) {
    errors.push(`Field "replaces" must be a string or null in ${file}`)
  }

  if (!isStringArray(entry.related)) {
    return errors
  }

  for (const related of entry.related) {
    if (!componentNames.has(related)) {
      errors.push(`Broken related reference: ${related} in ${file}`)
    }
  }

  if (typeof entry.replaces === 'string' && !componentNames.has(entry.replaces)) {
    errors.push(`Broken replaces reference: ${entry.replaces} in ${file}`)
  }

  if (!isStringArray(entry.usedBy)) {
    return errors
  }

  for (const usedBy of entry.usedBy) {
    if (!componentNames.has(usedBy) && !usedBy.endsWith('Page')) {
      errors.push(`Broken usedBy reference: ${usedBy} in ${file}`)
    }
  }

  return errors
}

const collected = componentFiles.map((filePath) => {
  try {
    return collectComponent(filePath)
  } catch (error) {
    return { error: (error as Error).message, file: relative(projectRoot, filePath) }
  }
})

const scopedCollected = validateOnly || !domainFilter
  ? collected
  : collected.filter(
      (item): item is OutputComponent => 'name' in item && item.catalog.domain === domainFilter,
    )

const componentNames = new Set(
  collected.filter((item): item is OutputComponent => 'name' in item).map((item) => item.name),
)

const validationErrors = scopedCollected.flatMap((item) => {
  if ('error' in item) {
    return [item.error]
  }

  return validateCatalog(item.catalog, componentNames, item.file)
})

const validatedComponents = scopedCollected.filter((item): item is OutputComponent => {
  if ('error' in item) {
    return false
  }

  return validateCatalog(item.catalog, componentNames, item.file).length === 0
})

const componentNameCounts = validatedComponents.reduce((counts, component) => {
  counts.set(component.name, (counts.get(component.name) ?? 0) + 1)
  return counts
}, new Map<string, number>())

const duplicateNameErrors = [...componentNameCounts.entries()]
  .filter(([, count]) => count > 1)
  .map(([name]) => `Duplicate component meta output name: ${name}`)

validationErrors.push(...duplicateNameErrors)

if (domainFilter && !validateOnly && validatedComponents.length === 0) {
  validationErrors.push(`Unknown domain filter: ${domainFilter}`)
}

if (validationErrors.length > 0) {
  console.log(validationErrors.join('\n'))
  process.exit(1)
}

const components = validatedComponents
  .filter((item) => (componentNameCounts.get(item.name) ?? 0) === 1)
  .filter((item) => (domainFilter ? item.catalog.domain === domainFilter : true))
  .sort((a, b) => b.name.localeCompare(a.name))

if (validateOnly) {
  console.log(`Validated ${collected.length} component files`)
  process.exit(0)
}

const aggregate = {
  generated: new Date().toISOString(),
  version: '1.0.0',
  components,
}

for (const outputFile of fg.sync('components/**/*.meta.json', { cwd: projectRoot, absolute: true })) {
  rmSync(outputFile, { force: true })
}

writeFileSync(
  join(projectRoot, 'components.meta.json'),
  `${JSON.stringify(aggregate, null, 2)}\n`,
)

for (const component of components) {
  const outputFile = join(projectRoot, 'components', `${component.name}.meta.json`)
  mkdirSync(dirname(outputFile), { recursive: true })
  writeFileSync(outputFile, `${JSON.stringify(component, null, 2)}\n`)
}

console.log(`Generated catalog for ${components.length} components`)
