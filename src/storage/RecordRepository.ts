import type {
    EntityStoreName,
    IdentifiableRecord,
    RecordRepository as RecordRepositoryContract,
    StorageDriver,
} from "./types";

/**
 * Implements entity CRUD against an injected persistence driver.
 * Used by the data-access facade for universities, companies, and country overlays.
 */
export class RecordRepository<TRecord extends IdentifiableRecord>
    implements RecordRepositoryContract<TRecord>
{
    private readonly driver: StorageDriver;
    private readonly storeName: EntityStoreName;

    /**
     * Creates a typed repository for one logical entity store.
     * Used exclusively by the data-access factory.
     */
    public constructor(driver: StorageDriver, storeName: EntityStoreName)
    {
        this.driver = driver;
        this.storeName = storeName;
    }

    /**
     * Reads every record in stable insertion or key order from the driver.
     * Used by filters, exports, and initial application loading.
     */
    public getAll(): Promise<TRecord[]>
    {
        return this.driver.getAll<TRecord>(this.storeName);
    }

    /**
     * Reads one record by its application identifier.
     * Used by detail, edit, and delete workflows.
     */
    public getById(id: string): Promise<TRecord | undefined>
    {
        return this.driver.getById<TRecord>(this.storeName, id);
    }

    /**
     * Inserts or replaces one record by identifier.
     * Used by tag and overlay editors.
     */
    public save(record: TRecord): Promise<void>
    {
        return this.driver.save(this.storeName, record);
    }

    /**
     * Inserts or replaces a batch of records efficiently.
     * Used by seed and merge import workflows.
     */
    public saveMany(records: readonly TRecord[]): Promise<void>
    {
        return this.driver.saveMany(this.storeName, records);
    }

    /**
     * Removes one record by identifier.
     * Used by destructive actions after user confirmation.
     */
    public delete(id: string): Promise<void>
    {
        return this.driver.delete(this.storeName, id);
    }

    /**
     * Removes every record in this logical entity store.
     * Used by reset and atomic replacement workflows.
     */
    public clear(): Promise<void>
    {
        return this.driver.clear(this.storeName);
    }
}

