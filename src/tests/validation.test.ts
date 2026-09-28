import { describe, expect, it } from "vitest";
import { scoringConfig, themeConfig } from "../config";
import {
    exampleCompanies,
    exampleCountryOverlays,
    exampleUniversities,
} from "../data";
import {
    appDataBundleSchema,
    companyTagSchema,
    countryOverlaySchema,
    parseScoringConfig,
    parseThemeConfig,
    universityTagSchema,
} from "../validation";
import { createCompanyFixture, createUniversityFixture } from "./domainFixtures";

describe("example data validation", () =>
{
    it("accepts every example university, company, and country overlay", () =>
    {
        for (const university of exampleUniversities)
        {
            expect(universityTagSchema.safeParse(university).success).toBe(true);
        }

        for (const company of exampleCompanies)
        {
            expect(companyTagSchema.safeParse(company).success).toBe(true);
        }

        for (const overlay of exampleCountryOverlays)
        {
            expect(countryOverlaySchema.safeParse(overlay).success).toBe(true);
        }
    });

    it("accepts optional country codes, sources, and company descriptive fields", () =>
    {
        const company = createCompanyFixture();
        delete company.countryCode;
        delete company.industry;
        delete company.companyArea;
        company.sources = [];

        expect(companyTagSchema.safeParse(company).success).toBe(true);
    });

    it("accepts both editable configuration files", () =>
    {
        expect(parseScoringConfig(scoringConfig)).toEqual(scoringConfig);
        expect(parseThemeConfig(themeConfig)).toEqual(themeConfig);
    });

    it("rejects scoring normalization kinds that do not match their fields", () =>
    {
        const invalidConfig = structuredClone(scoringConfig);
        const internshipCriterion = invalidConfig.company.criteria.find(
            (criterion) => criterion.field === "internshipAvailability",
        );

        expect(internshipCriterion).toBeDefined();

        if (internshipCriterion !== undefined)
        {
            internshipCriterion.normalization = {
                kind: "linear",
                inputMin: 0,
                inputMax: 5,
            };
        }

        expect(() => parseScoringConfig(invalidConfig)).toThrow(/not compatible/u);
    });
});

describe("tag validation", () =>
{
    it("rejects coordinates outside WGS84 bounds", () =>
    {
        const invalidUniversity = createUniversityFixture({
            coordinates: {
                longitude: 181,
                latitude: 20,
            },
        });

        expect(universityTagSchema.safeParse(invalidUniversity).success).toBe(false);
    });

    it("rejects unsafe unknown fields and malformed source URLs", () =>
    {
        const invalidCompany = {
            ...createCompanyFixture(),
            injectedMarkup: "<script>alert(1)</script>",
            sources: [{
                id: "bad-source",
                title: "Bad source",
                url: "javascript:alert(1)",
            }],
        };

        expect(companyTagSchema.safeParse(invalidCompany).success).toBe(false);
    });

    it("rejects ratings outside the zero-to-five output scale", () =>
    {
        const invalidCompany = createCompanyFixture({ finalRating: 5.1 });

        expect(companyTagSchema.safeParse(invalidCompany).success).toBe(false);
    });

    it("rejects duplicate note and source identifiers inside a tag", () =>
    {
        const duplicateNote = {
            id: "duplicate-note",
            text: "Research note",
            createdAt: "2026-08-01T12:00:00.000Z",
            updatedAt: "2026-08-01T12:00:00.000Z",
        };
        const duplicateSource = {
            id: "duplicate-source",
            title: "Research source",
            url: "https://example.com/research",
        };
        const invalidUniversity = createUniversityFixture({
            notes: [duplicateNote, duplicateNote],
            sources: [duplicateSource, duplicateSource],
        });

        expect(universityTagSchema.safeParse(invalidUniversity).success).toBe(false);
    });

    it("rejects malformed country overlay colors and codes", () =>
    {
        const invalidOverlay = {
            ...exampleCountryOverlays[0],
            countryCode: "br",
            color: "red",
        };

        expect(countryOverlaySchema.safeParse(invalidOverlay).success).toBe(false);
    });
});

describe("bundle integrity validation", () =>
{
    it("rejects tag identifiers reused across tag collections", () =>
    {
        const bundle = {
            version: 1,
            exportedAt: "2026-08-01T12:00:00.000Z",
            universities: [createUniversityFixture({ id: "shared-tag" })],
            companies: [createCompanyFixture({ id: "shared-tag" })],
            countryOverlays: [],
        };

        expect(appDataBundleSchema.safeParse(bundle).success).toBe(false);
    });

    it("rejects duplicate overlay identifiers and country codes", () =>
    {
        const firstOverlay = exampleCountryOverlays[0];

        expect(firstOverlay).toBeDefined();

        if (firstOverlay === undefined)
        {
            return;
        }

        const bundle = {
            version: 1,
            exportedAt: "2026-08-01T12:00:00.000Z",
            universities: [],
            companies: [],
            countryOverlays: [
                firstOverlay,
                {
                    ...firstOverlay,
                    countryName: `${firstOverlay.countryName} duplicate`,
                },
            ],
        };

        expect(appDataBundleSchema.safeParse(bundle).success).toBe(false);
    });
});
