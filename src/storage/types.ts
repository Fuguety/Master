import type {
    AppDataBundle,
    CompanyTag,
    CountryOverlay,
    NoteTag,
    UniversityTag,
} from "../types";

export type EntityStoreName = "universities" | "companies" | "notes" | "countryOverlays";
export type ImportMode = "replace" | "merge";

export interface IdentifiableRecord
{
    id: string;
}

export interface RecordRepository<TRecord extends IdentifiableRecord>
{
    getAll(): Promise<TRecord[]>;
    getById(id: string): Promise<TRecord | undefined>;
    save(record: TRecord): Promise<void>;
    saveMany(records: readonly TRecord[]): Promise<void>;
    delete(id: string): Promise<void>;
    clear(): Promise<void>;
}

export interface StorageSeed
{
    universities: readonly UniversityTag[];
    companies: readonly CompanyTag[];
    notes?: readonly NoteTag[];
    countryOverlays: readonly CountryOverlay[];
}

export interface ImportOptions
{
    mode?: ImportMode;
    maximumBytes?: number;
}

export interface ImportSummary
{
    mode: ImportMode;
    universityCount: number;
    companyCount: number;
    noteCount: number;
    countryOverlayCount: number;
}

export type DataBundleValidator = (input: unknown) => AppDataBundle;

export interface DataAccessOptions
{
    databaseName?: string;
    persistence?: "auto" | "indexeddb" | "localstorage";
    validator?: DataBundleValidator;
    localStorage?: Storage;
}

export interface AtlasDataAccess
{
    readonly universities: RecordRepository<UniversityTag>;
    readonly companies: RecordRepository<CompanyTag>;
    readonly notes: RecordRepository<NoteTag>;
    readonly countryOverlays: RecordRepository<CountryOverlay>;
    initialize(seed?: StorageSeed): Promise<void>;
    loadBundle(): Promise<AppDataBundle>;
    exportJson(pretty?: boolean): Promise<string>;
    importJson(json: string, options?: ImportOptions): Promise<ImportSummary>;
    importBundle(input: unknown, mode?: ImportMode): Promise<ImportSummary>;
    clearAll(): Promise<void>;
    close(): void;
}

export interface StorageDriver
{
    getAll<TRecord extends IdentifiableRecord>(storeName: EntityStoreName): Promise<TRecord[]>;
    getById<TRecord extends IdentifiableRecord>(storeName: EntityStoreName, id: string): Promise<TRecord | undefined>;
    save<TRecord extends IdentifiableRecord>(storeName: EntityStoreName, record: TRecord): Promise<void>;
    saveMany<TRecord extends IdentifiableRecord>(storeName: EntityStoreName, records: readonly TRecord[]): Promise<void>;
    delete(storeName: EntityStoreName, id: string): Promise<void>;
    clear(storeName: EntityStoreName): Promise<void>;
    replaceBundle(bundle: AppDataBundle): Promise<void>;
    isInitialized(): Promise<boolean>;
    markInitialized(): Promise<void>;
    close(): void;
}
