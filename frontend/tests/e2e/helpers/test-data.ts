import { faker } from '@faker-js/faker';

/**
 * Deterministic test data generation using Faker with fixed seeds.
 * Ensures reproducible test scenarios across test runs.
 */

/**
 * Test citizen data structure
 */
export interface TestCitizen {
  id: string;
  name: string;
  age: number;
  ssn: string;
  seed: number;
}

/**
 * Generate a test citizen with deterministic data
 */
export function generateTestCitizen(id: string, seed: number): TestCitizen {
  faker.seed(seed);

  return {
    id,
    name: faker.person.fullName(),
    age: faker.number.int({ min: 18, max: 80 }),
    ssn: faker.string.numeric('###-##-####'),
    seed,
  };
}

/**
 * Predefined test scenarios for common use cases
 */
export const TEST_SCENARIOS = {
  // High-risk citizen scenario
  highRisk: {
    seed: 12345,
    expectedRiskFactors: ['financial_distress', 'social_isolation'],
  },

  // Low-risk citizen scenario
  lowRisk: {
    seed: 54321,
    expectedRiskFactors: [],
  },

  // Citizen with multiple data points
  complexProfile: {
    seed: 99999,
    expectedDataDomains: ['health', 'finance', 'judicial', 'social'],
  },

  // Edge case: minimal data
  minimalData: {
    seed: 11111,
    expectedDataDomains: ['identity'],
  },
};

/**
 * Seed the game with deterministic test data
 * This function sets up the game state for predictable testing
 */
export async function seedTestData(page: any, scenarioName: keyof typeof TEST_SCENARIOS) {
  const scenario = TEST_SCENARIOS[scenarioName];

  // Execute in browser context to seed the game
  await page.evaluate((seed: number) => {
    // Set the seed in localStorage for the game to use
    localStorage.setItem('test_seed', seed.toString());
    localStorage.setItem('test_mode', 'true');
  }, scenario.seed);
}

/**
 * Generate a batch of test citizens
 */
export function generateTestCitizens(count: number, startSeed = 1000): TestCitizen[] {
  const citizens: TestCitizen[] = [];

  for (let i = 0; i < count; i++) {
    const id = `test-citizen-${i}`;
    const seed = startSeed + i;
    citizens.push(generateTestCitizen(id, seed));
  }

  return citizens;
}

/**
 * Validate citizen data structure
 */
export function validateCitizenData(citizen: any): boolean {
  // Check required fields
  if (!citizen.name || typeof citizen.name !== 'string') return false;
  if (!citizen.age || citizen.age < 18 || citizen.age > 80) return false;

  // Validate SSN format (XXX-XX-XXXX)
  const ssnPattern = /^\d{3}-\d{2}-\d{4}$/;
  if (citizen.ssn && !ssnPattern.test(citizen.ssn)) return false;

  return true;
}

/**
 * Test flag types
 */
export const FLAG_TYPES = {
  monitoring: {
    label: 'Monitoring',
    severity: 'low',
  },
  restriction: {
    label: 'Restriction',
    severity: 'medium',
  },
  intervention: {
    label: 'Intervention',
    severity: 'high',
  },
  detention: {
    label: 'Detention',
    severity: 'critical',
  },
} as const;

/**
 * Test justifications for flags
 */
export const TEST_JUSTIFICATIONS = {
  monitoring: 'Suspicious pattern detected in financial transactions',
  restriction: 'Multiple risk factors indicate potential threat',
  intervention: 'High-risk behavior requires immediate intervention',
  detention: 'Critical threat level requires detention',
  noAction: 'Insufficient evidence to justify any action',
};
