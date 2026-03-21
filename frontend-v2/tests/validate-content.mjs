/**
 * Phase 1 — Content validation
 * Checks all JSON files in public/content/ are valid and have required fields.
 */
import { readFileSync, readdirSync } from 'fs'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const contentDir = resolve(__dirname, '../public/content')

let errors = 0
let checked = 0

function check(condition, message) {
  checked++
  if (!condition) {
    console.error(`  ✗ ${message}`)
    errors++
  } else {
    console.log(`  ✓ ${message}`)
  }
}

function loadJSON(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    console.error(`✗ INVALID JSON: ${path}\n  ${e.message}`)
    errors++
    return null
  }
}

console.log('\n=== Phase 1 Content Validation ===\n')

// Scenario
console.log('📁 scenarios/default.json')
const scenario = loadJSON(join(contentDir, 'scenarios/default.json'))
if (scenario) {
  check(scenario.scenario_key === 'default', 'scenario_key is "default"')
  check(Array.isArray(scenario.directives) && scenario.directives.length === 6, 'has 6 directives')
  check(Array.isArray(scenario.contract_events) && scenario.contract_events.length === 4, 'has 4 contract events')
  check(Array.isArray(scenario.special_npcs) && scenario.special_npcs.length >= 1, 'has special NPCs')
  scenario.directives.forEach((d, i) => {
    check(d.directive_key && d.week_number === i + 1, `directive ${i + 1} has key and correct week_number`)
    check(typeof d.flag_quota === 'number' && d.flag_quota > 0, `directive ${i + 1} has flag_quota`)
    check(typeof d.moral_weight === 'number', `directive ${i + 1} has moral_weight`)
  })
  scenario.contract_events.forEach((ce, i) => {
    check(ce.contract_name && Array.isArray(ce.new_domains_unlocked), `contract event ${i + 1} valid`)
    check(ce.press_release && ce.internal_memo, `contract event ${i + 1} has press_release and internal_memo`)
    check(ce.real_world_reference, `contract event ${i + 1} has real_world_reference`)
    check(typeof ce.unlocks_autoflag === 'boolean', `contract event ${i + 1} has unlocks_autoflag`)
  })
}

// Countries
console.log('\n📁 countries/')
const countries = ['usa', 'uk', 'china', 'russia', 'france']
countries.forEach(key => {
  const country = loadJSON(join(contentDir, `countries/${key}.json`))
  if (country) {
    check(country.country_key === key, `${key}: correct country_key`)
    check(country.display_name, `${key}: has display_name`)
    check([1, 2, 3].includes(country.surveillance_depth), `${key}: valid surveillance_depth`)
    check(Array.isArray(country.available_domains) && country.available_domains.length > 0, `${key}: has available_domains`)
    check(country.legal_framework?.surveillance_law, `${key}: has surveillance_law`)
    check(country.ui_flavor?.agency_name, `${key}: has agency_name`)
    check(country.ui_flavor?.flag_labels?.monitoring, `${key}: has flag_labels`)
    check(Array.isArray(country.real_world_references) && country.real_world_references.length > 0, `${key}: has real_world_references`)
  }
})

// Inference rules
console.log('\n📁 inference_rules.json')
const rules = loadJSON(join(contentDir, 'inference_rules.json'))
if (rules) {
  check(Array.isArray(rules.rules) && rules.rules.length >= 10, `has at least 10 inference rules`)
  rules.rules.forEach((r, i) => {
    check(r.rule_key && r.name, `rule ${i + 1} (${r.rule_key}) has key and name`)
    check(Array.isArray(r.required_domains), `rule ${i + 1} has required_domains`)
    check(r.inference_template, `rule ${i + 1} has inference_template`)
    check(r.educational_note, `rule ${i + 1} has educational_note`)
  })
}

// Outcomes
console.log('\n📁 outcomes.json')
const outcomes = loadJSON(join(contentDir, 'outcomes.json'))
if (outcomes) {
  const flagTypes = ['monitoring', 'restriction', 'intervention', 'detention']
  const timePeriods = ['immediate', '1_month', '6_months', '1_year']
  flagTypes.forEach(ft => {
    check(outcomes.outcome_templates?.[ft], `has outcomes for flag type: ${ft}`)
    timePeriods.forEach(tp => {
      check(outcomes.outcome_templates?.[ft]?.[tp]?.narrative, `${ft}/${tp} has narrative`)
    })
  })
}

// Data banks
console.log('\n📁 data_banks/')
const banks = ['health', 'finance', 'judicial', 'social', 'messages']
banks.forEach(bank => {
  const data = loadJSON(join(contentDir, `data_banks/${bank}.json`))
  if (data) {
    check(Object.keys(data).length > 0, `${bank}: not empty`)
    console.log(`    (${bank} has ${Object.keys(data).length} top-level keys)`)
  }
})

// Locale
console.log('\n📁 locales/en.json')
const locale = loadJSON(join(contentDir, 'locales/en.json'))
if (locale) {
  const keyCount = Object.keys(locale).length
  check(keyCount >= 100, `en.json has ${keyCount} keys (need ≥100)`)
  const required = ['app.title', 'start.begin_shift', 'directive.panel.title',
    'flag.type.monitoring', 'flag.type.detention', 'ending.title', 'metrics.compliance.title']
  required.forEach(k => check(locale[k], `has key: ${k}`))
}

// Summary
console.log(`\n${'─'.repeat(40)}`)
console.log(`Checked: ${checked} | Errors: ${errors}`)
if (errors === 0) {
  console.log('✅ All content valid.\n')
  process.exit(0)
} else {
  console.log(`❌ ${errors} validation error(s) found.\n`)
  process.exit(1)
}
