import type { AppDataBundle, CompanyTag, CountryOverlay, NoteTag, UniversityTag } from "../types";
import { CURRENT_DATA_VERSION, DEFAULT_DATABASE_NAME } from "./constants";
import type { EntityStoreName, IdentifiableRecord, StorageDriver } from "./types";

interface LocalStorageState extends AppDataBundle
{
    initialized: boolean;
}



/**
 * Creates a deep JSON clone of persisted records crossing the storage boundary.
 * Used by the localStorage fallback to match IndexedDB's structured-clone behavior.
 */
function cloneValue<TValue>(value: TValue): TValue
{
    return structuredClone(value);
}



/**
 * Implements a compact localStorage fallback when IndexedDB is unavailable.
 * Used primarily in restricted browsers while preserving the repository API.
 */
export class LocalStorageDriver implements StorageDriver
{
    private readonly storage: Storage;
    private readonly storageKey: string;

    /**
     * Creates a namespaced driver over a supplied browser Storage implementation.
     * Used by the persistence factory and deterministic unit tests.
     */
    public constructor(
        storage: Storage,
        namespace = DEFAULT_DATABASE_NAME,
    )
    {
        this.storage = storage;
        this.storageKey = `${namespace}:data:v1`;
    }

    /**
     * Reads all records from a logical localStorage collection.
     * Used by typed repositories and exports.
     */
    public async getAll<TRecord extends IdentifiableRecord>(storeName: EntityStoreName): Promise<TRecord[]>
    {
        await Promise.resolve();
        const records = this.selectStore(this.readState(), storeName);

        return cloneValue(records) as unknown as TRecord[];
    }

    /**
     * Reads one record by identifier from a logical collection.
     * Used by typed repository lookups.
     */
    public async getById<TRecord extends IdentifiableRecord>(
        storeName: EntityStoreName,
        id: string,
    ): Promise<TRecord | undefined>
    {
        await Promise.resolve();
        const record = this.selectStore(this.readState(), storeName).find((candidate) => candidate.id === id);

        return record ? cloneValue(record) as unknown as TRecord : undefined;
    }

    /**
     * Inserts or replaces one record in a logical collection.
     * Used by typed repository saves.
     */
    public async save<TRecord extends IdentifiableRecord>(
        storeName: EntityStoreName,
        record: TRecord,
    ): Promise<void>
    {
        await this.saveMany(storeName, [record]);
    }

    /**
     * Inserts or replaces several records in one localStorage write.
     * Used by seeds and merge imports.
     */
    public async saveMany<TRecord extends IdentifiableRecord>(
        storeName: EntityStoreName,
        records: readonly TRecord[],
    ): Promise<void>
    {
        await Promise.resolve();
        const state = this.readState();
        const mergedRecords = new globalThis.Map(
            this.selectStore(state, storeName).map((record) => [record.id, record]),
        );

        for (const record of records)
        {
            mergedRecords.set(
                record.id,
                cloneValue(record) as unknown as UniversityTag | CompanyTag | NoteTag | CountryOverlay,
            );
        }

        this.assignStore(state, storeName, [...mergedRecords.values()]);
        this.writeState(state);
    }

    /**
     * Removes one record by identifier from a logical collection.
     * Used by typed repository delete operations.
     */
    public async delete(storeName: EntityStoreName, id: string): Promise<void>
    {
        await Promise.resolve();
        const state = this.readState();
        const records = this.selectStore(state, storeName).filter((record) => record.id !== id);

        this.assignStore(state, storeName, records);
        this.writeState(state);
    }

    /**
     * Removes all records from one logical collection.
     * Used by repository resets.
     */
    public async clear(storeName: EntityStoreName): Promise<void>
    {
        await Promise.resolve();
        const state = this.readState();

        this.assignStore(state, storeName, []);
        this.writeState(state);
    }

    /**
     * Atomically replaces all localStorage application collections in one value write.
     * Used by validated replace and merge imports.
     */
    public async replaceBundle(bundle: AppDataBundle): Promise<void>
    {
        await Promise.resolve();
        const initialized = this.readState().initialized;

        this.writeState({ ...cloneValue(bundle), initialized });
    }

    /**
     * Reads the durable first-run seed flag.
     * Used by data-access initialization.
     */
    public async isInitialized(): Promise<boolean>
    {
        await Promise.resolve();
        return this.readState().initialized;
    }

    /**
     * Writes the durable first-run seed flag.
     * Used after successful seed handling.
     */
    public async markInitialized(): Promise<void>
    {
        await Promise.resolve();
        const state = this.readState();

        state.initialized = true;
        this.writeState(state);
    }

    /**
     * Satisfies the shared driver lifecycle contract; localStorage has no connection.
     * Used by application teardown.
     */
    public close(): void
    {
        // localStorage has no open connection to release.
    }

    /**
     * Parses the namespaced state or returns a safe empty state after corruption.
     * Used before every localStorage operation.
     */
    private readState(): LocalStorageState
    {
        const storedValue = this.storage.getItem(this.storageKey);

        if (storedValue === null)
        {
            return this.createEmptyState();
        }

        try
        {
            const parsedValue = JSON.parse(storedValue) as Partial<LocalStorageState>;

            if (
                !Array.isArray(parsedValue.universities)
                || !Array.isArray(parsedValue.companies)
                || (parsedValue.notes !== undefined && !Array.isArray(parsedValue.notes))
                || !Array.isArray(parsedValue.countryOverlays)
            )
            {
                return this.createEmptyState();
            }

            return {
                version: CURRENT_DATA_VERSION,
                exportedAt: typeof parsedValue.exportedAt === "string"
                    ? parsedValue.exportedAt
                    : new Date(0).toISOString(),
                universities: parsedValue.universities,
                companies: parsedValue.companies,
                notes: parsedValue.notes ?? [],
                countryOverlays: parsedValue.countryOverlays,
                initialized: parsedValue.initialized === true,
            };
        }
        catch
        {
            return this.createEmptyState();
        }
    }

    /**
     * Serializes the complete fallback state in one mutation.
     * Used by every write to prevent partial multi-key updates.
     */
    private writeState(state: LocalStorageState): void
    {
        this.storage.setItem(this.storageKey, JSON.stringify(state));
    }

    /**
     * Creates a versioned empty fallback state.
     * Used for first run and recovery from malformed internal data.
     */
    private createEmptyState(): LocalStorageState
    {
        return {
            version: CURRENT_DATA_VERSION,
            exportedAt: new Date(0).toISOString(),
            universities: [],
            companies: [],
            notes: [],
            countryOverlays: [],
            initialized: false,
        };
    }

    /**
     * Selects a logical collection using exhaustive store-name narrowing.
     * Used by generic read and mutation operations.
     */
    private selectStore(
        state: LocalStorageState,
        storeName: EntityStoreName,
    ): Array<UniversityTag | CompanyTag | NoteTag | CountryOverlay>
    {
        switch (storeName)
        {
            case "universities":
                return state.universities;
            case "companies":
                return state.companies;
            case "notes":
                return state.notes ?? [];
            case "countryOverlays":
                return state.countryOverlays;
        }
    }

    /**
     * Replaces a logical collection using exhaustive store-name narrowing.
     * Used by generic mutation operations.
     */
    private assignStore(
        state: LocalStorageState,
        storeName: EntityStoreName,
        records: Array<UniversityTag | CompanyTag | NoteTag | CountryOverlay>,
    ): void
    {
        switch (storeName)
        {
            case "universities":
                state.universities = records as UniversityTag[];
                break;
            case "companies":
                state.companies = records as CompanyTag[];
                break;
            case "notes":
                state.notes = records as NoteTag[];
                break;
            case "countryOverlays":
                state.countryOverlays = records as CountryOverlay[];
                break;
        }
    }
}
