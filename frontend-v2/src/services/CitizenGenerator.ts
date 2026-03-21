/**
 * CitizenGenerator — deterministic NPC generation using Faker.js.
 * - generateSkeleton(): lightweight, called for all 50 NPCs at game start
 * - generateFullProfile(): heavy, called lazily when player opens a citizen file
 * All generation is seeded: same seed + index = same citizen every time.
 */
import { faker } from '@faker-js/faker'
import type {
  CitizenSkeleton,
  CitizenProfile,
  HealthRecord,
  FinanceRecord,
  JudicialRecord,
  LocationRecord,
  SocialMediaRecord,
  MessageRecord,
  HealthVisit,
  Transaction,
  BankAccount,
  Debt,
  JudicialCase,
  CheckIn,
  SocialPost,
  SocialConnection,
} from '@/types/citizen'
import type { CountryProfile, DataBanks } from '@/types/content'
import type { DomainKey } from '@/types/game'

const SPRITE_KEYS = [
  'citizen_male_01', 'citizen_male_02', 'citizen_male_03',
  'citizen_female_01', 'citizen_female_02', 'citizen_female_03',
  'office_worker_male_01', 'office_worker_female_01',
  'doctor_male_01', 'doctor_female_01', 'nurse_female_01',
  'employee_01', 'official_01', 'analyst_01',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(faker.number.float({ min: 0, max: 1 }) * arr.length)]!
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => faker.number.float({ min: -1, max: 1 }))
  return shuffled.slice(0, n)
}

function randomInt(min: number, max: number): number {
  return Math.floor(faker.number.float({ min, max }))
}

// ─── Skeleton generation ────────────────────────────────────────────────────

export function generateSkeleton(
  seed: number,
  index: number,
  _country: CountryProfile,
): CitizenSkeleton {
  faker.seed(seed + index * 1000)

  const sex = faker.person.sexType()
  const firstName = faker.person.firstName(sex)
  const lastName = faker.person.lastName()

  // Spread NPCs across a 50x50 grid, avoiding clustering
  const mapX = randomInt(2, 47)
  const mapY = randomInt(2, 47)

  return {
    id: faker.string.uuid(),
    first_name: firstName,
    last_name: lastName,
    date_of_birth: faker.date
      .birthdate({ min: 18, max: 75, mode: 'age' })
      .toISOString()
      .split('T')[0]!,
    ssn: `${randomInt(100, 999)}-${randomInt(10, 99)}-${randomInt(1000, 9999)}`,
    street_address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zip_code: faker.location.zipCode(),
    role: 'citizen',
    sprite_key: SPRITE_KEYS[index % SPRITE_KEYS.length]!,
    map_x: mapX,
    map_y: mapY,
    is_scenario_npc: false,
    scenario_key: null,
    risk_score_cache: null,
    risk_score_updated_at: null,
    generation_seed: seed + index * 1000,
  }
}

// ─── Full profile generation ─────────────────────────────────────────────────

export function generateFullProfile(
  skeleton: CitizenSkeleton,
  dataBanks: DataBanks,
  country: CountryProfile,
): CitizenProfile {
  faker.seed(skeleton.generation_seed)

  const dob = new Date(skeleton.date_of_birth)
  const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000))
  const availableDomains = new Set(country.available_domains)

  const profile: CitizenProfile = { ...skeleton }

  if (availableDomains.has('health')) {
    profile.health = generateHealthRecord(age, dataBanks)
  }
  if (availableDomains.has('finance')) {
    profile.finance = generateFinanceRecord(dataBanks)
  }
  if (availableDomains.has('judicial')) {
    profile.judicial = generateJudicialRecord(age, dataBanks)
  }
  if (availableDomains.has('location')) {
    profile.location = generateLocationRecord(skeleton, dataBanks)
  }
  if (availableDomains.has('social')) {
    profile.social = generateSocialRecord(dataBanks)
  }
  if (availableDomains.has('messages')) {
    profile.messages = generateMessageRecords(dataBanks)
  }

  return profile
}

// ─── Domain generators ────────────────────────────────────────────────────────

function generateHealthRecord(age: number, banks: DataBanks): HealthRecord {
  const { health } = banks
  const conditionCount = randomInt(0, 3)
  const conditions = pickN(health.common_conditions, conditionCount)

  const sensitiveCount = age > 30 && faker.datatype.boolean(0.25) ? 1 : 0
  const sensitive_conditions = pickN(health.sensitive_conditions, sensitiveCount)

  const allConditions = [...conditions, ...sensitive_conditions]
  const medications = allConditions.flatMap(c => {
    const meds = health.condition_medications[c] ?? []
    return meds.length > 0 ? [pick(meds)] : []
  })

  const visitCount = randomInt(1, 8)
  const visits: HealthVisit[] = Array.from({ length: visitCount }, () => ({
    date: faker.date.recent({ days: 365 }).toISOString().split('T')[0]!,
    reason: faker.datatype.boolean(0.8)
      ? pick(health.common_visit_reasons)
      : pick(health.sensitive_visit_reasons),
    facility: pick(health.hospitals),
    specialty: pick(health.specialties),
  })).sort((a, b) => b.date.localeCompare(a.date))

  return {
    conditions,
    sensitive_conditions,
    medications,
    visits,
    insurance_provider: pick(health.insurance_providers),
  }
}

function generateFinanceRecord(banks: DataBanks): FinanceRecord {
  const { finance } = banks
  const accountCount = randomInt(1, 3)
  const accounts: BankAccount[] = Array.from({ length: accountCount }, () => ({
    id: faker.string.uuid(),
    bank: pick(finance.banks),
    type: pick(['checking', 'savings', 'credit'] as const),
    balance: randomInt(-500, 50000),
    opened_date: faker.date.past({ years: 10 }).toISOString().split('T')[0]!,
  }))

  const txCount = randomInt(15, 40)
  const allMerchants = Object.values(finance.merchants).flat()
  const transactions: Transaction[] = Array.from({ length: txCount }, () => {
    const merchant = pick(allMerchants)
    const isSuspicious = finance.transaction_descriptions.suspicious.some(d =>
      d.toLowerCase().includes('cash') || d.toLowerCase().includes('transfer'),
    ) && faker.datatype.boolean(0.08)
    return {
      date: faker.date.recent({ days: 90 }).toISOString().split('T')[0]!,
      merchant,
      category: Object.keys(finance.merchants).find(k =>
        (finance.merchants[k] ?? []).includes(merchant),
      ) ?? 'other',
      amount: randomInt(5, 500),
      is_suspicious: isSuspicious,
    }
  }).sort((a, b) => b.date.localeCompare(a.date))

  const debtCount = randomInt(0, 3)
  const debts: Debt[] = Array.from({ length: debtCount }, () => ({
    type: pick(finance.debt_types),
    creditor: pick(finance.creditors),
    amount: randomInt(500, 50000),
    delinquent: faker.datatype.boolean(0.2),
  }))

  return {
    accounts,
    transactions,
    debts,
    credit_score: randomInt(400, 800),
    employer: pick(finance.employers),
    annual_income: randomInt(25000, 120000),
  }
}

function generateJudicialRecord(age: number, banks: DataBanks): JudicialRecord {
  const { judicial } = banks
  const hasCriminalHistory = age > 20 && faker.datatype.boolean(0.25)
  const caseCount = hasCriminalHistory ? randomInt(1, 3) : randomInt(0, 1)

  const cases: JudicialCase[] = Array.from({ length: caseCount }, () => {
    const type = pick(['criminal', 'civil', 'traffic'] as const)
    let charge = ''
    if (type === 'criminal') {
      const category = pick(Object.keys(judicial.criminal_charges))
      charge = pick(judicial.criminal_charges[category] ?? ['Unknown'])
    } else if (type === 'civil') {
      const category = pick(Object.keys(judicial.civil_case_descriptions))
      charge = pick(judicial.civil_case_descriptions[category] ?? ['Unknown'])
    } else {
      const category = pick(Object.keys(judicial.traffic_violation_descriptions))
      charge = pick(judicial.traffic_violation_descriptions[category] ?? ['Unknown'])
    }
    return {
      id: faker.string.uuid(),
      type,
      charge,
      date: faker.date.past({ years: 10 }).toISOString().split('T')[0]!,
      outcome: pick(judicial.case_outcomes),
      sentence: faker.datatype.boolean(0.4) ? pick(judicial.sentences) : null,
    }
  })

  return {
    cases,
    has_felony: cases.some(c => c.type === 'criminal' && c.outcome === 'Convicted'),
    has_violent_offense: cases.some(c =>
      (judicial.criminal_charges['VIOLENT'] ?? []).includes(c.charge),
    ),
    has_drug_offense: cases.some(c =>
      (judicial.criminal_charges['DRUG'] ?? []).includes(c.charge),
    ),
  }
}

function generateLocationRecord(skeleton: CitizenSkeleton, banks: DataBanks): LocationRecord {
  const { finance, social } = banks
  const employer = pick(finance.employers)
  const checkinCount = randomInt(4, 12)

  const flaggedOrgNames = social.group_memberships.flagged
  const checkins: CheckIn[] = Array.from({ length: checkinCount }, (_, i) => {
    const isFlagged = i < 1 && faker.datatype.boolean(0.15)
    return {
      date: faker.date.recent({ days: 60 }).toISOString().split('T')[0]!,
      location_name: isFlagged ? pick(flaggedOrgNames) : faker.company.name(),
      location_type: pick(['workplace', 'restaurant', 'healthcare', 'recreational', 'retail', 'transit']),
      address: faker.location.streetAddress(),
      frequency: pick(['daily', 'weekly', 'occasional', 'once'] as const),
    }
  })

  const flaggedLocations = checkins
    .filter(c => flaggedOrgNames.includes(c.location_name))
    .map(c => c.location_name)

  return {
    home_address: `${skeleton.street_address}, ${skeleton.city}, ${skeleton.state}`,
    work_address: faker.location.streetAddress(),
    work_name: employer,
    checkins,
    flagged_locations: flaggedLocations,
  }
}

function generateSocialRecord(banks: DataBanks): SocialMediaRecord {
  const { social } = banks
  const platforms = pickN(social.platforms, randomInt(1, 3))
  const postCount = randomInt(5, 20)

  const posts: SocialPost[] = Array.from({ length: postCount }, () => {
    const category = pick(Object.keys(social.post_templates) as ('political' | 'personal' | 'concerning')[])
    const template = pick(social.post_templates[category] ?? ['...'])
    const isConcerning = category === 'concerning'
    const categoryHashtags = isConcerning
      ? social.hashtags.political ?? []
      : social.hashtags.normal ?? []
    return {
      date: faker.date.recent({ days: 90 }).toISOString().split('T')[0]!,
      platform: pick(platforms),
      content: template,
      is_concerning: isConcerning,
      hashtags: faker.datatype.boolean(0.5) && categoryHashtags.length > 0
        ? [pick(categoryHashtags)]
        : [],
    }
  }).sort((a, b) => b.date.localeCompare(a.date))

  const connectionCount = randomInt(8, 30)
  const connections: SocialConnection[] = Array.from({ length: connectionCount }, () => ({
    name: `${faker.person.firstName()} ${faker.person.lastName()}`,
    relationship: pick(social.relationship_types),
    is_flagged: faker.datatype.boolean(0.08),
  }))

  const neutralGroups = pickN(social.group_memberships.neutral, randomInt(0, 3))
  const flaggedGroupCount = faker.datatype.boolean(0.15) ? randomInt(1, 2) : 0
  const flaggedGroups = pickN(social.group_memberships.flagged, flaggedGroupCount)
  const allGroups = [...neutralGroups, ...flaggedGroups]

  return {
    platforms,
    posts,
    connections,
    group_memberships: allGroups,
    flagged_group_memberships: flaggedGroups,
    political_inferences: posts.filter(p => p.is_concerning).length >= 3
      ? ['Possible organizing activity']
      : [],
  }
}

function generateMessageRecords(banks: DataBanks): MessageRecord[] {
  const { messages } = banks
  const count = randomInt(5, 20)

  return Array.from({ length: count }, () => {
    const categoryKey = pick(['organizing', 'personal_crisis', 'normal', 'coded'] as const)
    // Weight toward normal
    const category: 'organizing' | 'personal_crisis' | 'normal' | 'coded' =
      faker.datatype.boolean(0.7) ? 'normal' : categoryKey
    const templates = messages.message_templates[category] ?? []
    const isConcerning = category === 'organizing' || category === 'personal_crisis' || category === 'coded'

    return {
      id: faker.string.uuid(),
      date: faker.date.recent({ days: 30 }).toISOString().split('T')[0]!,
      contact: faker.datatype.boolean(0.8)
        ? pick(messages.contacts.normal)
        : pick(messages.contacts.suspicious),
      platform: pick(['SMS', 'WhatsApp', 'Signal', 'Telegram', 'Email']),
      excerpt: templates.length > 0 ? pick(templates) : '[Message content]',
      is_encrypted: messages.encryption_indicators.some(
        e => e.includes('Signal') || e.includes('WhatsApp'),
      ) && faker.datatype.boolean(0.3),
      is_concerning: isConcerning,
      category,
    }
  }).sort((a, b) => b.date.localeCompare(a.date))
}

// ─── Available domains for a citizen at a given unlock state ─────────────────

export function getAvailableDomains(
  _profile: CitizenSkeleton,
  unlockedDomains: DomainKey[],
): DomainKey[] {
  return unlockedDomains
}
