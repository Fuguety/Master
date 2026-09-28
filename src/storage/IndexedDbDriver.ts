import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { AppDataBundle, CompanyTag, CountryOverlay, NoteTag, UniversityTag } from "../types";
import { DATABASE_VERSION, DEFAULT_DATABASE_NAME } from "./constants";
import type { EntityStoreName, IdentifiableRecord, StorageDriver } from "./types";

interface AtlasDatabaseSchema extends DBSchema
{
    universities:
    {
        key: string;
        value: UniversityTag;
        indexes: { "by-updated-at": string };
    };
    companies:
    {
        key: string;
        value: CompanyTag;
        indexes: { "by-updated-at": string };
    };
    notes:
    {
        key: string;
        value: NoteTag;
        indexes: { "by-updated-at": string };
    };
    countryOverlays:
    {
        key: string;
        value: CountryOverlay;
        indexes: { "by-updated-at": string };
    };
    metadata:
    {
        key: string;
        value: { key: string; value: unknown };
    };
}



/**
 * Creates the version-one IndexedDB object stores and update-time indexes.
 * Used by the database upgrade transaction and designed for future version branches.
 */
function createVersionOneStores(database: IDBPDatabase<AtlasDatabaseSchema>): void
{
    const universityStore = database.createObjectStore("universities", { keyPath: "id" });
    const companyStore = database.createObjectStore("companies", { keyPath: "id" });
    const overlayStore = database.createObjectStore("countryOverlays", { keyPath: "id" });

    database.createObjectStore("metadata", { keyPath: "key" });

    universityStore.createIndex("by-updated-at", "updatedAt");
    companyStore.createIndex("by-updated-at", "updatedAt");
    overlayStore.createIndex("by-updated-at", "updatedAt");
}



/**
 * Adds the sticky-note entity store introduced by data version two.
 * Used by IndexedDB upgrade while retaining existing University and Company records.
 */
function createVersionTwoStores(database: IDBPDatabase<AtlasDatabaseSchema>): void
{
    const noteStore = database.createObjectStore("notes", { keyPath: "id" });
    noteStore.createIndex("by-updated-at", "updatedAt");
}



/**
 * Opens the application database and applies ordered schema migrations.
 * Used by the persistence factory when IndexedDB is available.
 * Returns a live typed database connection.
 */
async function openAtlasDatabase(databaseName: string): Promise<IDBPDatabase<AtlasDatabaseSchema>>
{
    return openDB<AtlasDatabaseSchema>(databaseName, DATABASE_VERSION,
    {
        upgrade(database, oldVersion)
        {
            if (oldVersion < 1)
            {
                createVersionOneStores(database);
            }

            if (oldVersion < 2)
            {
                createVersionTwoStores(database);
            }
        },
    });
}

/**
 * Implements local persistence through the idb promise wrapper.
 * Used as the preferred production storage driver.
 */
export class IndexedDbDriver implements StorageDriver
{
    private readonly database: IDBPDatabase<AtlasDatabaseSchema>;

    /**
     * Wraps an opened database connection.
     * Used by the asynchronous create factory.
     */
    private constructor(database: IDBPDatabase<AtlasDatabaseSchema>)
    {
        this.database = database;
    }

    /**
     * Opens and returns an IndexedDB persistence driver.
     * Used by the data-access factory and supports isolated names in tests.
     */
    public static async create(databaseName = DEFAULT_DATABASE_NAME): Promise<IndexedDbDriver>
    {
        const database = await openAtlasDatabase(databaseName);

        return new IndexedDbDriver(database);
    }

    /**
     * Reads all records from a selected object store.
     * Used by typed repositories and bundle export.
     */
    public async getAll<TRecord extends IdentifiableRecord>(storeName: EntityStoreName): Promise<TRecord[]>
    {
        return await this.getAllRecords(storeName) as unknown as TRecord[];
    }

    /**
     * Reads one record by identifier from a selected object store.
     * Used by typed repository lookups.
     */
    public async getById<TRecord extends IdentifiableRecord>(
        storeName: EntityStoreName,
        id: string,
    ): Promise<TRecord | undefined>
    {
        return await this.getRecord(storeName, id) as TRecord | undefined;
    }

    /**
     * Inserts or replaces one record in a selected object store.
     * Used by typed repository save operations.
     */
    public async save<TRecord extends IdentifiableRecord>(
        storeName: EntityStoreName,
        record: TRecord,
    ): Promise<void>
    {
        await this.saveRecord(storeName, record);
    }

    /**
     * Inserts or replaces records in one IndexedDB transaction.
     * Used by imports and first-run seed loading.
     */
    public async saveMany<TRecord extends IdentifiableRecord>(
        storeName: EntityStoreName,
        records: readonly TRecord[],
    ): Promise<void>
    {
        if (records.length === 0)
        {
            return;
        }

        await this.saveManyRecords(storeName, records);
    }

    /**
     * Deletes one record from a selected object store.
     * Used by typed repository delete operations.
     */
    public async delete(storeName: EntityStoreName, id: string): Promise<void>
    {
        await this.database.delete(storeName, id);
    }

    /**
     * Clears a selected object store.
     * Used by resets and repository-level maintenance.
     */
    public async clear(storeName: EntityStoreName): Promise<void>
    {
        await this.database.clear(storeName);
    }

    /**
     * Atomically replaces every application entity store from a validated bundle.
     * Used by replace imports so partial writes cannot corrupt local state.
     */
    public async replaceBundle(bundle: AppDataBundle): Promise<void>
    {
        const transaction = this.database.transaction(
            ["universities", "companies", "notes", "countryOverlays"],
            "readwrite",
        );
        const universityStore = transaction.objectStore("universities");
        const companyStore = transaction.objectStore("companies");
        const noteStore = transaction.objectStore("notes");
        const overlayStore = transaction.objectStore("countryOverlays");
        const requests: Array<Promise<unknown>> = [
            universityStore.clear(),
            companyStore.clear(),
            noteStore.clear(),
            overlayStore.clear(),
        ];

        for (const university of bundle.universities)
        {
            requests.push(universityStore.put(university));
        }

        for (const company of bundle.companies)
        {
            requests.push(companyStore.put(company));
        }

        for (const note of bundle.notes ?? [])
        {
            requests.push(noteStore.put(note));
        }

        for (const overlay of bundle.countryOverlays)
        {
            requests.push(overlayStore.put(overlay));
        }

        await Promise.all([...requests, transaction.done]);
    }

    /**
     * Checks the durable first-run flag without inferring it from empty user collections.
     * Used by seed initialization so intentionally deleted data is not recreated later.
     */
    public async isInitialized(): Promise<boolean>
    {
        const record = await this.database.get("metadata", "initialized");

        return record?.value === true;
    }

    /**
     * Persists completion of first-run initialization.
     * Used only after seed handling finishes successfully.
     */
    public async markInitialized(): Promise<void>
    {
        await this.database.put("metadata", { key: "initialized", value: true });
    }

    /**
     * Closes this tab's IndexedDB connection without deleting persisted data.
     * Used during application teardown and tests.
     */
    public close(): void
    {
        this.database.close();
    }

    /**
     * Dispatches an all-record read to a literal store for precise idb typing.
     * Used internally by the generic repository boundary.
     */
    private getAllRecords(storeName: EntityStoreName): Promise<Array<UniversityTag | CompanyTag | NoteTag | CountryOverlay>>
    {
        switch (storeName)
        {
            case "universities":
                return this.database.getAll("universities");
            case "companies":
                return this.database.getAll("companies");
            case "notes":
                return this.database.getAll("notes");
            case "countryOverlays":
                return this.database.getAll("countryOverlays");
        }
    }

    /**
     * Dispatches a keyed read to a literal store for precise idb typing.
     * Used internally by the generic repository boundary.
     */
    private getRecord(
        storeName: EntityStoreName,
        id: string,
    ): Promise<UniversityTag | CompanyTag | NoteTag | CountryOverlay | undefined>
    {
        switch (storeName)
        {
            case "universities":
                return this.database.get("universities", id);
            case "companies":
                return this.database.get("companies", id);
            case "notes":
                return this.database.get("notes", id);
            case "countryOverlays":
                return this.database.get("countryOverlays", id);
        }
    }

    /**
     * Dispatches one write to a literal store after its repository contract narrows the record.
     * Used internally by save.
     */
    private async saveRecord(storeName: EntityStoreName, record: IdentifiableRecord): Promise<void>
    {
        switch (storeName)
        {
            case "universities":
                await this.database.put("universities", record as UniversityTag);
                break;
            case "companies":
                await this.database.put("companies", record as CompanyTag);
                break;
            case "notes":
                await this.database.put("notes", record as NoteTag);
                break;
            case "countryOverlays":
                await this.database.put("countryOverlays", record as CountryOverlay);
                break;
        }
    }

    /**
     * Dispatches a batched write to one literal-store transaction.
     * Used internally by saveMany.
     */
    private async saveManyRecords(
        storeName: EntityStoreName,
        records: readonly IdentifiableRecord[],
    ): Promise<void>
    {
        switch (storeName)
        {
            case "universities":
            {
                const transaction = this.database.transaction("universities", "readwrite");

                await Promise.all(records.map((record) => transaction.store.put(record as UniversityTag)));
                await transaction.done;
                break;
            }
            case "companies":
            {
                const transaction = this.database.transaction("companies", "readwrite");

                await Promise.all(records.map((record) => transaction.store.put(record as CompanyTag)));
                await transaction.done;
                break;
            }
            case "notes":
            {
                const transaction = this.database.transaction("notes", "readwrite");

                await Promise.all(records.map((record) => transaction.store.put(record as NoteTag)));
                await transaction.done;
                break;
            }
            case "countryOverlays":
            {
                const transaction = this.database.transaction("countryOverlays", "readwrite");

                await Promise.all(records.map((record) => transaction.store.put(record as CountryOverlay)));
                await transaction.done;
                break;
            }
        }
    }
}
