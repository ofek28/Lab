#!/usr/bin/env node
/**
 * Patches yahoo-finance2 ESM build to replace `import ... with { type: "json" }`
 * (requires Node.js 22+) with Node.js 18/20-compatible equivalents.
 * Runs automatically after `npm install` via the postinstall script.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const PKG_REPLACEMENT = `const pkg = { name: "yahoo-finance2", version: "2.12.5" };`

// Files that import package.json for the User-Agent string
const PKG_FILES = [
  'node_modules/yahoo-finance2/dist/esm/src/lib/getCrumb.js',
  'node_modules/yahoo-finance2/dist/esm/src/lib/yahooFinanceFetch.js',
  'node_modules/yahoo-finance2/dist/esm/src/lib/validateAndCoerceTypes.js',
]

let patched = 0

for (const rel of PKG_FILES) {
  const file = resolve(root, rel)
  if (!existsSync(file)) continue

  let content = readFileSync(file, 'utf8')
  const original = content

  content = content.replace(
    /import pkg from ["']\.\.\/\.\.\/package\.json["'] with \{ type: ["']json["'] \};/g,
    PKG_REPLACEMENT
  )

  if (content !== original) {
    writeFileSync(file, content, 'utf8')
    console.log(`  patched: ${rel}`)
    patched++
  }
}

// fundamentalsTimeSeries imports timeseries.json — inline the actual JSON
const timeseriesFile = resolve(root, 'node_modules/yahoo-finance2/dist/esm/src/modules/fundamentalsTimeSeries.js')
const timeseriesJson = resolve(root, 'node_modules/yahoo-finance2/dist/esm/src/lib/timeseries.json')

if (existsSync(timeseriesFile) && existsSync(timeseriesJson)) {
  let content = readFileSync(timeseriesFile, 'utf8')
  const original = content

  content = content.replace(
    /import Timeseries_Keys from ["']\.\.\/lib\/timeseries\.json["'] with \{ type: ["']json["'] \};/g,
    `const Timeseries_Keys = ${readFileSync(timeseriesJson, 'utf8').trim()};`
  )

  if (content !== original) {
    writeFileSync(timeseriesFile, content, 'utf8')
    console.log('  patched: .../modules/fundamentalsTimeSeries.js')
    patched++
  }
}

if (patched > 0) {
  console.log(`yahoo-finance2 patch applied (${patched} files)`)
} else {
  console.log('yahoo-finance2 patch: nothing to patch (already clean)')
}
