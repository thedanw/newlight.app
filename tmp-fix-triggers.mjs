import { readFileSync, writeFileSync } from 'fs'
const files = [
  'src/content/plugins/elvanto-sync/settings/components/MappingRow.tsx',
  'public/content/plugins/elvanto-sync/settings/components/MappingRow.tsx',
]
files.forEach((f) => {
  let c = readFileSync(f, 'utf8')
  c = c.replace(/<Combobox\.Trigger\s+size="xs"\s*\/>/g, '<Combobox.Trigger />')
  writeFileSync(f, c)
  console.log('Fixed:', f)
})
