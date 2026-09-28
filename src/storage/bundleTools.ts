import type { AppDataBundle } from "../types";
import { CURRENT_DATA_VERSION, DEFAULT_IMPORT_MAXIMUM_BYTES } from "./constants";
import type { DataBundleValidator } from "./types";

type VersionMigration = (input: unknown) => unknown;

const VERSION_MIGRATIONS: Readonly<Partial<Record<number, VersionMigration>>> = {
    1: (input) => isRecord(input) ? { ...input, version: 2, notes: [] } : input,
};



/**
 * Checks whether unknown input is a non-null JSON object.
 * Used by version migration before domain validation is possible.
 */
function isRecord(input: unknown): input is Record<string, unknown>
{
    return typeof input === "object" && input !== null && !Array.isArray(input);
}



/**
 * Measures a JSON string as UTF-8 rather than JavaScript UTF-16 code units.
 * Used by import limits to handle international text accurately.
 */
function calculateUtf8Size(input: string): number
{
    return new TextEncoder().encode(input).byteLength;
}



/**
 * Migrates a raw bundle through each registered version step.
 * Used before Zod or a custom validator parses imported data.
 * Rejects unversioned, unsupported-old, and future-version bundles safely.
 */
export function migrateBundleInput(input: unknown): unknown
{
    if (!isRecord(input) || !Number.isInteger(input.version))
    {
        throw new Error("The imported data does not contain a valid schema version.");
    }

    let version = input.version as number;
    let migratedInput: unknown = input;

    if (version > CURRENT_DATA_VERSION)
    {
        throw new Error(
            `This file uses data version ${version}, but this application supports up to ${CURRENT_DATA_VERSION}.`,
        );
    }

    while (version < CURRENT_DATA_VERSION)
    {
        const migration = VERSION_MIGRATIONS[version];

        if (migration === undefined)
        {
            throw new Error(`No migration is available from data version ${version}.`);
        }

        migratedInput = migration(migratedInput);
        version += 1;
    }

    return migratedInput;
}



/**
 * Parses size-limited JSON without evaluating imported content.
 * Used by the import boundary before migration and schema validation.
 * Returns unknown so untrusted data cannot bypass the validator type boundary.
 */
export function parseImportJson(
    json: string,
    maximumBytes = DEFAULT_IMPORT_MAXIMUM_BYTES,
): unknown
{
    if (calculateUtf8Size(json) > maximumBytes)
    {
        throw new Error(`The import exceeds the ${maximumBytes.toLocaleString()} byte limit.`);
    }

    try
    {
        return JSON.parse(json) as unknown;
    }
    catch
    {
        throw new Error("The selected file is not valid JSON.");
    }
}



/**
 * Migrates and validates an untrusted import with an injected domain parser.
 * Used by the data-access import methods.
 * Returns only the trusted AppDataBundle produced by the validator.
 */
export function prepareImportedBundle(
    input: unknown,
    validator: DataBundleValidator,
): AppDataBundle
{
    return validator(migrateBundleInput(input));
}



/**
 * Serializes a trusted bundle for JSON download or clipboard transfer.
 * Used by the data-access export method.
 */
export function serializeBundle(bundle: AppDataBundle, pretty = true): string
{
    return JSON.stringify(bundle, null, pretty ? 2 : 0);
}



/**
 * Creates a UTF-8 JSON Blob from exported application data.
 * Used by UI download actions without coupling storage logic to DOM clicks.
 */
export function createBundleBlob(json: string): Blob
{
    return new Blob([json], { type: "application/json;charset=utf-8" });
}



/**
 * Reads an import File as text while enforcing a pre-read size limit.
 * Used by file-picker UI before passing JSON to the data-access layer.
 */
export async function readImportFile(
    file: File,
    maximumBytes = DEFAULT_IMPORT_MAXIMUM_BYTES,
): Promise<string>
{
    if (file.size > maximumBytes)
    {
        throw new Error(`The import exceeds the ${maximumBytes.toLocaleString()} byte limit.`);
    }

    return file.text();
}
