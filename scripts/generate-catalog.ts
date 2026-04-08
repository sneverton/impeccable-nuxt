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

type CatalogStatus = 'draft' | 'stable' | 'deprecated' | 'experimental'

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

type CompatibilityComponent = {
  name: string
  filePath: string
  category: CatalogCategory
  domain: string | null
  status: CatalogStatus
  tags: string[]
}

type CatalogValidationTarget = Partial<CatalogEntry> & Record<string, unknown>

const projectRoot = resolve(process.env.CATALOG_ROOT ?? process.cwd())
const compatibilityOutputFile = join(
  projectRoot,
  '.generated',
  'component-catalog',
  'components.meta.json',
)
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

  const allowedStatuses = new Set<CatalogStatus>([
    'draft',
    'stable',
    'deprecated',
    'experimental',
  ])

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

const knownDomains = new Set(
  collected
    .filter((item): item is OutputComponent => 'name' in item)
    .map((item) => item.catalog.domain)
    .filter((domain): domain is string => typeof domain === 'string' && domain.length > 0),
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

const unknownDomainFilter = Boolean(domainFilter && !validateOnly && !knownDomains.has(domainFilter))

if (unknownDomainFilter) {
  validationErrors.push(`Unknown domain filter: ${domainFilter}`)
}

function removeGeneratedOutputs(): void {
  rmSync(join(projectRoot, 'components.meta.json'), { force: true })
  rmSync(compatibilityOutputFile, { force: true })

  for (const outputFile of fg.sync('components/**/*.meta.json', { cwd: projectRoot, absolute: true })) {
    rmSync(outputFile, { force: true })
  }
}

function buildIndex(
  components: CompatibilityComponent[],
  key: keyof CompatibilityComponent,
): Record<string, string[]> {
  const entries = components.reduce((index, component) => {
    const value = component[key]

    if (Array.isArray(value)) {
      for (const item of value) {
        index[item] ??= []
        index[item].push(component.name)
      }

      return index
    }

    if (value === null) {
      return index
    }

    index[value] ??= []
    index[value].push(component.name)
    return index
  }, {} as Record<string, string[]>)

  return Object.fromEntries(
    Object.entries(entries)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, members]) => [name, members.sort((left, right) => left.localeCompare(right))]),
  )
}

if (validationErrors.length > 0) {
  if (!validateOnly && !unknownDomainFilter) {
    removeGeneratedOutputs()
  }

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
const compatibilityComponents = components.map((component) => ({
  name: component.name,
  filePath: component.file,
  category: component.catalog.category,
  domain: component.catalog.domain,
  status: component.catalog.status,
  tags: component.catalog.tags,
}))
const compatibilityAggregate = {
  generatedAt: aggregate.generated,
  version: aggregate.version,
  totalComponents: compatibilityComponents.length,
  components: compatibilityComponents,
  indexes: {
    byCategory: buildIndex(compatibilityComponents, 'category'),
    byDomain: buildIndex(compatibilityComponents, 'domain'),
    byTag: buildIndex(compatibilityComponents, 'tags'),
    byStatus: buildIndex(compatibilityComponents, 'status'),
  },
}

removeGeneratedOutputs()

writeFileSync(
  join(projectRoot, 'components.meta.json'),
  `${JSON.stringify(aggregate, null, 2)}\n`,
)
mkdirSync(dirname(compatibilityOutputFile), { recursive: true })
writeFileSync(
  compatibilityOutputFile,
  `${JSON.stringify(compatibilityAggregate, null, 2)}\n`,
)

for (const component of components) {
  const outputFile = join(projectRoot, 'components', `${component.name}.meta.json`)
  mkdirSync(dirname(outputFile), { recursive: true })
  writeFileSync(outputFile, `${JSON.stringify(component, null, 2)}\n`)
}

console.log(`Generated catalog for ${components.length} components`)
