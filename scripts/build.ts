/**
 * Build script: reads all src/*.json plugin definitions and
 * generates public/index.json as the discoverable plugin registry.
 *
 * Run: bun scripts/build.ts
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const srcDir = join(import.meta.dir, '..', 'src')
const outDir = join(import.meta.dir, '..', 'public')

mkdirSync(outDir, { recursive: true })

const plugins = readdirSync(srcDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => {
    const raw = readFileSync(join(srcDir, f), 'utf8')
    return JSON.parse(raw)
  })
  .sort((a, b) => (a.identifier as string).localeCompare(b.identifier as string))

const index = {
  schemaVersion: 1,
  plugins,
}

const outFile = join(outDir, 'index.json')
writeFileSync(outFile, JSON.stringify(index, null, 2) + '\n')

console.log(`✓ Built public/index.json with ${plugins.length} plugin(s):`)
plugins.forEach((p) => console.log(`  · ${p.identifier}`))
