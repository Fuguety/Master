import { describe, expect, it } from "vitest";
import { scoringConfig } from "../config";
import {
    calculateCompanyRating,
    calculateUniversityRating,
    normalizeInverseLinearValue,
    normalizeLinearValue,
    synchronizeBundleRatings,
    withCalculatedUniversityRating,
} from "../scoring";
import { createCompanyFixture, createUniversityFixture } from "./domainFixtures";

describe("rating calculator", () =>
{
    it("returns five stars when every university criterion is at its configured maximum", () =>
    {
        const result = calculateUniversityRating(createUniversityFixture());

        expect(result.rating).toBe(5);
        expect(result.totalEffectiveWeight).toBe(100);
        expect(result.breakdown.every((item) => item.included)).toBe(true);
    });

    it("excludes missing values and renormalizes the remaining weights", () =>
    {
        const university = createUniversityFixture({
            locationScore: null,
            qualityOfLife: null,
            affordability: null,
            jobOpportunities: null,
            jobPlacementSupport: null,
            regionalCompanies: null,
            globalReputation: null,
            localReputation: null,
            globalRanking: null,
            localRanking: null,
            commuteQuality: null,
            countryTier: "tier-2",
        });

        const result = calculateUniversityRating(university);

        expect(result.rating).toBe(4);
        expect(result.totalEffectiveWeight).toBe(10);
        expect(result.explanation).toContain("remaining weights were scaled to 100%");
    });

    it("uses injected boolean and categorical mappings", () =>
    {
        const customConfig = structuredClone(scoringConfig);
        customConfig.booleanMappings.internshipAvailability = { true: 4, false: 0 };
        customConfig.categoricalMappings.countryTier!.values["tier-1"] = 1;
        customConfig.categoricalMappings.workModel!.values.hybrid = 2;

        const company = createCompanyFixture({
            payment: null,
            careerGrowth: null,
            locationScore: null,
            internshipAvailability: true,
        });
        const result = calculateCompanyRating(company, customConfig);

        expect(result.rating).toBe(2.1);
        expect(result.totalEffectiveWeight).toBe(35);
    });

    it("provides contributions that add up to the precise rating", () =>
    {
        const result = calculateCompanyRating(createCompanyFixture({
            payment: 3.2,
            careerGrowth: 4.1,
        }));
        let contributionTotal = 0;

        for (const item of result.breakdown)
        {
            contributionTotal += item.weightedContribution;
        }

        expect(contributionTotal).toBeCloseTo(result.preciseRating, 10);
        expect(result.breakdown[0]?.explanation).toContain("contributing");
        expect(Number.isInteger(result.rating * 10)).toBe(true);
    });

    it("updates only the persisted final rating field", () =>
    {
        const university = createUniversityFixture({
            id: "unchanged-id",
            affordability: 0,
        });
        const updatedUniversity = withCalculatedUniversityRating(university);

        expect(updatedUniversity.id).toBe("unchanged-id");
        expect(updatedUniversity.finalRating).toBeLessThan(5);
        expect(university.finalRating).toBe(5);
    });

    it("synchronizes imported bundle ratings without mutating source records", () =>
    {
        const university = createUniversityFixture({ finalRating: 0 });
        const company = createCompanyFixture({ finalRating: 0 });
        const synchronized = synchronizeBundleRatings({
            version: 1,
            exportedAt: "2026-08-05T12:00:00.000Z",
            universities: [university],
            companies: [company],
            countryOverlays: [],
        });

        expect(synchronized.universities[0]?.finalRating).toBe(5);
        expect(synchronized.companies[0]?.finalRating).toBe(5);
        expect(university.finalRating).toBe(0);
        expect(company.finalRating).toBe(0);
    });
});

describe("normalization helpers", () =>
{
    it("clamps linear inputs and rejects non-numeric values", () =>
    {
        expect(normalizeLinearValue(8, 0, 5, 0, 5)).toBe(5);
        expect(normalizeLinearValue("5", 0, 5, 0, 5)).toBeNull();
        expect(normalizeLinearValue(2, 5, 5, 0, 5)).toBeNull();
    });

    it("maps a first-place inverse rank to the maximum score", () =>
    {
        expect(normalizeInverseLinearValue(1, 1, 1000, 0, 5)).toBe(5);
        expect(normalizeInverseLinearValue(1000, 1, 1000, 0, 5)).toBe(0);
    });
});
