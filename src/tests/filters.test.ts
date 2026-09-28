import { describe, expect, it } from "vitest";
import {
    createEmptyCompanyFilters,
    createEmptyUniversityFilters,
    filterCompanies,
    filterUniversities,
} from "../filters";
import { createCompanyFixture, createUniversityFixture } from "./domainFixtures";

const universities = [
    createUniversityFixture({
        id: "university-a",
        city: "São Paulo",
        country: "Brazil",
        countryCode: "BRA",
        countryTier: "tier-2",
        finalRating: 4.4,
        affordability: 4.2,
        qualityOfLife: 4.1,
        jobOpportunities: 4.4,
        jobPlacementSupport: true,
        regionalCompanies: 4.7,
        globalReputation: 4.2,
        localReputation: 4.8,
        globalRanking: 85,
        localRanking: 1,
        commuteQuality: 3.2,
    }),
    createUniversityFixture({
        id: "university-b",
        city: "Cambridge",
        country: "United States",
        countryCode: "USA",
        finalRating: 4.2,
        affordability: 2.2,
        jobPlacementSupport: true,
        globalReputation: 5,
        localReputation: 5,
        globalRanking: 1,
        localRanking: 1,
    }),
    createUniversityFixture({
        id: "university-c",
        city: "Recife",
        country: "Brazil",
        countryCode: "BRA",
        countryTier: "tier-3",
        finalRating: 3.1,
        affordability: 4.8,
        qualityOfLife: 3.4,
        jobOpportunities: 2.9,
        jobPlacementSupport: false,
        regionalCompanies: 2.5,
        globalReputation: null,
        localReputation: 3.5,
        globalRanking: null,
        localRanking: 12,
        commuteQuality: 2.8,
    }),
];

const companies = [
    createCompanyFixture({
        id: "company-a",
        city: "Berlin",
        country: "Germany",
        countryCode: "DEU",
        finalRating: 4.7,
        payment: 4.4,
        careerGrowth: 4.6,
        locationScore: 4.5,
        workModel: "hybrid",
        internshipAvailability: true,
        industry: "Technology",
        companyArea: "Data analytics",
    }),
    createCompanyFixture({
        id: "company-b",
        city: "São Paulo",
        country: "Brazil",
        countryCode: "BRA",
        countryTier: "tier-2",
        finalRating: 3.9,
        payment: 4,
        careerGrowth: 4.5,
        locationScore: 4.2,
        workModel: "on-site",
        internshipAvailability: false,
        industry: "Transportation",
        companyArea: "Electric mobility",
    }),
    createCompanyFixture({
        id: "company-c",
        city: "Recife",
        country: "Brazil",
        countryCode: "BRA",
        countryTier: "tier-3",
        finalRating: 3.2,
        payment: null,
        careerGrowth: 3.6,
        locationScore: 3.5,
        workModel: "remote",
        internshipAvailability: true,
        industry: "Technology",
        companyArea: "Cybersecurity",
    }),
];

describe("university filters", () =>
{
    it("combines country, rating, affordability, and tier independently", () =>
    {
        const result = filterUniversities(universities, {
            countries: ["bra"],
            minimumRating: 4,
            price: { minimum: 4 },
            countryTiers: ["tier-2"],
        });

        expect(result.map((university) => university.id)).toEqual(["university-a"]);
    });

    it("combines support, regional-company, reputation, ranking, and commute filters", () =>
    {
        const result = filterUniversities(universities, {
            jobPlacementSupport: true,
            regionalCompanies: { minimum: 4 },
            reputation: { minimum: 4.4 },
            ranking: { maximum: 50 },
            commute: { minimum: 3 },
        });

        expect(result.map((university) => university.id)).toEqual(["university-a", "university-b"]);
    });

    it("excludes missing values only when their numeric dimension is active", () =>
    {
        expect(filterUniversities(universities, {
            globalRanking: { maximum: 100 },
        })).toHaveLength(2);
        expect(filterUniversities(universities, {})).toHaveLength(3);
    });

    it("returns every record after reset", () =>
    {
        expect(filterUniversities(universities, createEmptyUniversityFilters())).toHaveLength(3);
    });
});

describe("company filters", () =>
{
    it("combines country, payment, growth, location, and work model", () =>
    {
        const result = filterCompanies(companies, {
            countries: ["Germany"],
            payment: { minimum: 4 },
            careerGrowth: { minimum: 4.5 },
            location: { minimum: 4 },
            workModels: ["hybrid"],
        });

        expect(result.map((company) => company.id)).toEqual(["company-a"]);
    });

    it("combines internship, industry, area, tier, city, and rating", () =>
    {
        const result = filterCompanies(companies, {
            cities: ["Recife"],
            minimumRating: 3,
            internshipAvailability: true,
            industries: ["technology"],
            companyAreas: ["CYBERSECURITY"],
            countryTiers: ["tier-3"],
        });

        expect(result.map((company) => company.id)).toEqual(["company-c"]);
    });

    it("excludes missing numeric fields only for an active dimension", () =>
    {
        expect(filterCompanies(companies, { payment: { minimum: 0 } })).toHaveLength(2);
        expect(filterCompanies(companies, createEmptyCompanyFilters())).toHaveLength(3);
    });
});
