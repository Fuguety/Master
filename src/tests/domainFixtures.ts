import type { CompanyTag, UniversityTag } from "../types";

const EXAMPLE_TIMESTAMP = "2026-08-01T12:00:00.000Z";

/**
 * Creates a complete university record for business-logic unit tests.
 * Used by scoring, filtering, and validation suites with optional overrides.
 */
export function createUniversityFixture(
    overrides: Partial<UniversityTag> = {},
): UniversityTag
{
    return {
        id: "university-fixture",
        type: "university",
        name: "Fixture University",
        coordinates: {
            longitude: 10,
            latitude: 20,
        },
        city: "Example City",
        country: "Example Country",
        countryCode: "EXA",
        countryTier: "tier-1",
        locationScore: 5,
        qualityOfLife: 5,
        affordability: 5,
        jobOpportunities: 5,
        jobPlacementSupport: true,
        regionalCompanies: 5,
        globalReputation: 5,
        localReputation: 5,
        globalRanking: 1,
        localRanking: 1,
        commuteQuality: 5,
        notes: [],
        sources: [],
        finalRating: 5,
        createdAt: EXAMPLE_TIMESTAMP,
        updatedAt: EXAMPLE_TIMESTAMP,
        ...overrides,
    };
}



/**
 * Creates a complete company record for business-logic unit tests.
 * Used by scoring, filtering, and validation suites with optional overrides.
 */
export function createCompanyFixture(
    overrides: Partial<CompanyTag> = {},
): CompanyTag
{
    return {
        id: "company-fixture",
        type: "company",
        name: "Fixture Company",
        coordinates: {
            longitude: 10,
            latitude: 20,
        },
        city: "Example City",
        country: "Example Country",
        countryCode: "EXA",
        countryTier: "tier-1",
        payment: 5,
        careerGrowth: 5,
        locationScore: 5,
        workModel: "hybrid",
        internshipAvailability: true,
        industry: "Technology",
        companyArea: "Data analytics",
        notes: [],
        sources: [],
        finalRating: 5,
        createdAt: EXAMPLE_TIMESTAMP,
        updatedAt: EXAMPLE_TIMESTAMP,
        ...overrides,
    };
}
