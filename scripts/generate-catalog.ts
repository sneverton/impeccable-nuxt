const validateOnly = process.argv.includes('--validate')

if (validateOnly) {
  console.log('Catalog validation scaffolded; implementation lands in Task 2.')
} else {
  console.log('Catalog generator scaffolded; implementation lands in Task 2.')
}
