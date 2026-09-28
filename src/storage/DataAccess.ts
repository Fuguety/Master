import type {
    AppDataBundle,
    CompanyTag,
    CountryOverlay,
    NoteTag,
    UniversityTag,
} from "../types";
import { parseAppDataBundle } from "../validation";
import { CURRENT_DATA_VERSION, DEFAULT_IMPORT_MAXIMUM_BYTES } from "./constants";
import { IndexedDbDriver } from "./IndexedDbDriver";
import { LocalStorageDriver } from "./LocalStorageDriver";
import { RecordRepository } from "./RecordRepository";
import {
    parseImportJson,
    prepareImportedBundle,
    serializeBundle,
} from "./bundleTools";
import type {
    AtlasDataAccess as AtlasDataAccessContract,
    DataAccessOptions,
    DataBundleValidator,
    ImportMode,
    ImportOptions,
    ImportSummary,
    StorageDriver,
    StorageSeed,
} from "./types";



/**
 * Merges records by identifier with incoming records taking precedence.
 * Used by non-destructive JSON imports for every entity collection.
 */
function mergeRecords<TRecord extends { id: string }>(
    existingRecords: readonly TRecord[],
    incomingRecords: readonly TRecord[],
): TRecord[]
{
    const recordsById = new globalThis.Map(existingRecords.map((record) => [record.id, record]));

    for (const record of incomingRecords)
    {
        recordsById.set(record.id, record);
    }

    return [...recordsById.values()];
}



/**
 * Resolves browser localStorage without failing in privacy-restricted contexts.
 * Used by explicit fallback mode and automatic IndexedDB recovery.
 */
function resolveLocalStorage(configuredStorage?: Storage): Storage | undefined
{
    if (configuredStorage)
    {
        return configuredStorage;
    }

    try
    {
        return globalThis.localStorage;
    }
    catch
    {
        return undefined;
    }
}



/**
 * Opens the requested persistence driver and falls back only in automatic mode.
 * Used by the public asynchronous data-access factory.
 */
async function createStorageDriver(options: DataAccessOptions): Promise<StorageDriver>
{
    const persistence = options.persistence ?? "auto";
    const databaseName = options.databaseName;

    if (persistence !== "localstorage" && typeof indexedDB !== "undefined")
    {
        try
        {
            return await IndexedDbDriver.create(databaseName);
        }
        catch (error)
        {
            if (persistence === "indexeddb")
            {
                throw error;
            }
        }
    }

    const storage = resolveLocalStorage(options.localStorage);

    if (storage)
    {
        return new LocalStorageDriver(storage, databaseName);
    }

    throw new Error("No supported local persistence mechanism is available in this browser.");
}



/**
 * Implements the application-facing repository facade over a swappable local driver.
 * Used by React state providers without exposing IndexedDB or localStorage details.
 */
class DefaultAtlasDataAccess implements AtlasDataAccessContract
{
    public readonly universities: RecordRepository<UniversityTag>;
    public readonly companies: RecordRepository<CompanyTag>;
    public readonly notes: RecordRepository<NoteTag>;
    public readonly countryOverlays: RecordRepository<CountryOverlay>;
    private readonly driver: StorageDriver;
    private readonly validator: DataBundleValidator;

    /**
     * Creates repositories and the import validation boundary over one driver.
     * Used by the public createDataAccess factory.
     */
    public constructor(driver: StorageDriver, validator: DataBundleValidator)
    {
        this.driver = driver;
        this.validator = validator;
        this.universities = new RecordRepository(driver, "universities");
        this.companies = new RecordRepository(driver, "companies");
        this.notes = new RecordRepository(driver, "notes");
        this.countryOverlays = new RecordRepository(driver, "countryOverlays");
    }

    /**
     * Loads example records exactly once on a genuinely empty first run.
     * Used by application startup before the initial data read.
     */
    public async initialize(seed?: StorageSeed): Promise<void>
    {
        if (await this.driver.isInitialized())
        {
            return;
        }

        const [universities, companies, notes, countryOverlays] = await Promise.all([
            this.universities.getAll(),
            this.companies.getAll(),
            this.notes.getAll(),
            this.countryOverlays.getAll(),
        ]);
        const isEmpty = universities.length === 0
            && companies.length === 0
            && notes.length === 0
            && countryOverlays.length === 0;

        if (isEmpty && seed)
        {
            await this.driver.replaceBundle(
            {
                version: CURRENT_DATA_VERSION,
                exportedAt: new Date().toISOString(),
                universities: [...seed.universities],
                companies: [...seed.companies],
                notes: [...(seed.notes ?? [])],
                countryOverlays: [...seed.countryOverlays],
            });
        }

        await this.driver.markInitialized();
    }

    /**
     * Loads all entity collections as a versioned immutable transfer boundary.
     * Used by application startup, reset workflows, and export.
     */
    public async loadBundle(): Promise<AppDataBundle>
    {
        const [universities, companies, notes, countryOverlays] = await Promise.all([
            this.universities.getAll(),
            this.companies.getAll(),
            this.notes.getAll(),
            this.countryOverlays.getAll(),
        ]);

        return this.validator({
            version: CURRENT_DATA_VERSION,
            exportedAt: new Date().toISOString(),
            universities,
            companies,
            notes,
            countryOverlays,
        });
    }

    /**
     * Exports current persistent state as validated versioned JSON.
     * Used by download and backup UI actions.
     */
    public async exportJson(pretty = true): Promise<string>
    {
        return serializeBundle(await this.loadBundle(), pretty);
    }

    /**
     * Parses, migrates, validates, and imports size-limited JSON.
     * Used by file and paste import UI actions.
     */
    public async importJson(json: string, options: ImportOptions = {}): Promise<ImportSummary>
    {
        const input = parseImportJson(
            json,
            options.maximumBytes ?? DEFAULT_IMPORT_MAXIMUM_BYTES,
        );

        return this.importBundle(input, options.mode ?? "replace");
    }

    /**
     * Validates and atomically replaces or merges an unknown data bundle.
     * Used by JSON import and programmatic restore workflows.
     */
    public async importBundle(input: unknown, mode: ImportMode = "replace"): Promise<ImportSummary>
    {
        const importedBundle = prepareImportedBundle(input, this.validator);
        let bundleToPersist = importedBundle;

        if (mode === "merge")
        {
            const existingBundle = await this.loadBundle();

            bundleToPersist = {
                version: CURRENT_DATA_VERSION,
                exportedAt: new Date().toISOString(),
                universities: mergeRecords(existingBundle.universities, importedBundle.universities),
                companies: mergeRecords(existingBundle.companies, importedBundle.companies),
                notes: mergeRecords(existingBundle.notes ?? [], importedBundle.notes ?? []),
                countryOverlays: mergeRecords(existingBundle.countryOverlays, importedBundle.countryOverlays),
            };
        }

        bundleToPersist = this.validator(bundleToPersist);

        await this.driver.replaceBundle(bundleToPersist);
        await this.driver.markInitialized();

        return {
            mode,
            universityCount: importedBundle.universities.length,
            companyCount: importedBundle.companies.length,
            noteCount: importedBundle.notes?.length ?? 0,
            countryOverlayCount: importedBundle.countryOverlays.length,
        };
    }

    /**
     * Clears all application records while retaining first-run completion state.
     * Used by an explicit reset or clear-data action.
     */
    public async clearAll(): Promise<void>
    {
        await this.driver.replaceBundle(
        {
            version: CURRENT_DATA_VERSION,
            exportedAt: new Date().toISOString(),
            universities: [],
            companies: [],
            notes: [],
            countryOverlays: [],
        });
        await this.driver.markInitialized();
    }

    /**
     * Releases driver resources without deleting persisted application data.
     * Used when the owning application service is disposed.
     */
    public close(): void
    {
        this.driver.close();
    }
}



/**
 * Creates the swappable persistent data-access service.
 * Used once by application composition before React state initialization.
 * Prefers IndexedDB and falls back to localStorage in automatic mode.
 */
export async function createDataAccess(options: DataAccessOptions = {}): Promise<AtlasDataAccessContract>
{
    const driver = await createStorageDriver(options);

    return new DefaultAtlasDataAccess(driver, options.validator ?? parseAppDataBundle);
}
