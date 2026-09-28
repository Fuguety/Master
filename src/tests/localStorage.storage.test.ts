import { exampleCompanies, exampleCountryOverlays, exampleUniversities } from "../data";
import { createDataAccess } from "../storage";
import type { AppDataBundle, UniversityTag } from "../types";

/**
 * Creates an isolated localStorage-backed data service for one test.
 * Used by repository, seed, and import/export test cases.
 */
async function createTestDataAccess(testName: string)
{
    return createDataAccess(
    {
        persistence: "localstorage",
        databaseName: `atlas-test-${testName}`,
        localStorage: window.localStorage,
    });
}



/**
 * Returns a modified copy with a deterministic identifier for merge testing.
 * Used by the merge import test.
 */
function createAdditionalUniversity(): UniversityTag
{
    return {
        ...structuredClone(exampleUniversities[0]!),
        id: "university-storage-merge",
        name: "Storage Merge University",
    };
}

describe("local persistence data access", () =>
{
    beforeEach(() =>
    {
        window.localStorage.clear();
    });

    it("seeds exactly once and supports repository CRUD", async () =>
    {
        const dataAccess = await createTestDataAccess("seed");
        const seed =
        {
            universities: exampleUniversities,
            companies: exampleCompanies,
            countryOverlays: exampleCountryOverlays,
        };

        await dataAccess.initialize(seed);
        expect(await dataAccess.universities.getAll()).toHaveLength(exampleUniversities.length);

        await dataAccess.universities.clear();
        await dataAccess.initialize(seed);
        expect(await dataAccess.universities.getAll()).toEqual([]);

        const university = createAdditionalUniversity();

        await dataAccess.universities.save(university);
        expect((await dataAccess.universities.getById(university.id))?.name).toBe(university.name);
        await dataAccess.universities.delete(university.id);
        expect(await dataAccess.universities.getById(university.id)).toBeUndefined();
        dataAccess.close();
    });

    it("exports and imports validated replacement bundles", async () =>
    {
        const dataAccess = await createTestDataAccess("replace");

        await dataAccess.initialize(
        {
            universities: exampleUniversities,
            companies: exampleCompanies,
            countryOverlays: exampleCountryOverlays,
        });

        const exportedJson = await dataAccess.exportJson(false);
        const exportedBundle = JSON.parse(exportedJson) as AppDataBundle;

        expect(exportedBundle.version).toBe(2);
        expect(exportedBundle.companies).toHaveLength(exampleCompanies.length);

        const replacementBundle: AppDataBundle =
        {
            version: 1,
            exportedAt: new Date().toISOString(),
            universities: [createAdditionalUniversity()],
            companies: [],
            countryOverlays: [],
        };
        const summary = await dataAccess.importBundle(replacementBundle);

        expect(summary.mode).toBe("replace");
        expect(await dataAccess.universities.getAll()).toHaveLength(1);
        expect(await dataAccess.companies.getAll()).toEqual([]);
        dataAccess.close();
    });

    it("merges by id and rejects malformed import data", async () =>
    {
        const dataAccess = await createTestDataAccess("merge");

        await dataAccess.initialize(
        {
            universities: exampleUniversities,
            companies: [],
            countryOverlays: [],
        });
        await dataAccess.importBundle(
        {
            version: 1,
            exportedAt: new Date().toISOString(),
            universities: [createAdditionalUniversity()],
            companies: [],
            countryOverlays: [],
        }, "merge");

        expect(await dataAccess.universities.getAll()).toHaveLength(exampleUniversities.length + 1);
        await expect(dataAccess.importJson("{\"version\":1}")).rejects.toThrow();
        dataAccess.close();
    });

    it("rejects identifiers that collide across existing and imported tag types", async () =>
    {
        const dataAccess = await createTestDataAccess("cross-type-collision");
        const existingUniversity = structuredClone(exampleUniversities[0]!);
        const collidingCompany = {
            ...structuredClone(exampleCompanies[0]!),
            id: existingUniversity.id,
        };

        await dataAccess.initialize({
            universities: [existingUniversity],
            companies: [],
            countryOverlays: [],
        });

        await expect(dataAccess.importBundle({
            version: 1,
            exportedAt: new Date().toISOString(),
            universities: [],
            companies: [collidingCompany],
            countryOverlays: [],
        }, "merge")).rejects.toThrow(/Duplicate tag identifier/u);

        expect(await dataAccess.universities.getAll()).toHaveLength(1);
        expect(await dataAccess.companies.getAll()).toHaveLength(0);
        dataAccess.close();
    });

    it("rejects overlay country collisions created by a merge", async () =>
    {
        const dataAccess = await createTestDataAccess("overlay-country-collision");
        const existingOverlay = structuredClone(exampleCountryOverlays[0]!);
        const collidingOverlay = {
            ...existingOverlay,
            id: `${existingOverlay.id}-imported`,
        };

        await dataAccess.initialize({
            universities: [],
            companies: [],
            countryOverlays: [existingOverlay],
        });

        await expect(dataAccess.importBundle({
            version: 1,
            exportedAt: new Date().toISOString(),
            universities: [],
            companies: [],
            countryOverlays: [collidingOverlay],
        }, "merge")).rejects.toThrow(/Duplicate country overlay/u);

        expect(await dataAccess.countryOverlays.getAll()).toHaveLength(1);
        dataAccess.close();
    });
});
