import { useCallback, useEffect, useRef, useState } from 'react';
import { exampleCompanies, exampleCountryOverlays, exampleNotes, exampleUniversities } from '@/data';
import { synchronizeBundleRatings } from '@/scoring';
import { sharedDatasetClient } from '@/services';
import {
    CURRENT_DATA_VERSION,
    parseImportJson,
    prepareImportedBundle,
    serializeBundle,
    type ImportMode,
} from '@/storage';
import type { AppDataBundle, CountryOverlay, MapTag } from '@/types';
import { parseAppDataBundle } from '@/validation';

const EMPTY_BUNDLE: AppDataBundle = {
    version: CURRENT_DATA_VERSION,
    exportedAt: new Date(0).toISOString(),
    universities: [],
    companies: [],
    notes: [],
    countryOverlays: [],
};

const CONFIGURATION_FALLBACK_BUNDLE: AppDataBundle = {
    version: CURRENT_DATA_VERSION,
    exportedAt: new Date(0).toISOString(),
    universities: exampleUniversities,
    companies: exampleCompanies,
    notes: exampleNotes,
    countryOverlays: exampleCountryOverlays,
};

export type AtlasDataStatus = 'loading' | 'ready' | 'saving' | 'error';

export interface UseAtlasDataResult
{
    bundle: AppDataBundle;
    clearAll: () => Promise<void>;
    deleteCountryOverlay: (overlayId: string) => Promise<void>;
    deleteTag: (tag: MapTag) => Promise<void>;
    error: string | null;
    exportJson: () => Promise<string>;
    hasPublishedThisSession: boolean;
    importJson: (json: string, mode: ImportMode) => Promise<void>;
    isDirty: boolean;
    isSharedConfigured: boolean;
    lastSavedAt: string | null;
    message: string | null;
    refetch: () => Promise<void>;
    saveCountryOverlay: (overlay: CountryOverlay) => Promise<void>;
    saveSharedDataset: () => Promise<void>;
    saveTag: (tag: MapTag) => Promise<void>;
    status: AtlasDataStatus;
}



/**
 * Converts an unknown persistence failure into a concise safe user message.
 * Used by every shared dataset operation.
 * Returns an Error message without exposing imported payload contents.
 */
function describeError(error: unknown): string
{
    return error instanceof Error ? error.message : 'The shared data operation failed.';
}



/**
 * Replaces or appends one record by identifier without mutating React state.
 * Used by visitor-local university, company, note, and overlay updates.
 * Returns a stable array containing the saved record once.
 */
function upsertRecord<TRecord extends { id: string }>(
    records: readonly TRecord[],
    savedRecord: TRecord,
): TRecord[]
{
    const existingIndex = records.findIndex((record) => record.id === savedRecord.id);

    if (existingIndex < 0)
    {
        return [...records, savedRecord];
    }

    return records.map((record, index) => index === existingIndex ? savedRecord : record);
}



/**
 * Merges records by identifier with incoming import records taking precedence.
 * Used by non-destructive working-copy imports for every entity collection.
 * Returns a new collection without mutating the current published snapshot.
 */
function mergeRecords<TRecord extends { id: string }>(
    existingRecords: readonly TRecord[],
    incomingRecords: readonly TRecord[],
): TRecord[]
{
    const recordsByIdentifier = new Map(existingRecords.map((record) => [record.id, record]));

    for (const record of incomingRecords)
    {
        recordsByIdentifier.set(record.id, record);
    }

    return [...recordsByIdentifier.values()];
}



/**
 * Creates one schema-valid merge of a current bundle and imported bundle.
 * Used by the local import workflow before an optional administrator publish.
 * Preserves current records unless an imported identifier replaces them.
 */
function mergeBundles(current: AppDataBundle, imported: AppDataBundle): AppDataBundle
{
    return parseAppDataBundle({
        version: CURRENT_DATA_VERSION,
        exportedAt: new Date().toISOString(),
        universities: mergeRecords(current.universities, imported.universities),
        companies: mergeRecords(current.companies, imported.companies),
        notes: mergeRecords(current.notes ?? [], imported.notes ?? []),
        countryOverlays: mergeRecords(current.countryOverlays, imported.countryOverlays),
    });
}



/**
 * Owns the public shared snapshot plus a visitor-local working copy.
 * Used by the root application controller for CRUD, import, export, and publishing.
 * Returns draft actions and explicit loading, dirty, saving, success, and error state.
 */
export function useAtlasData(canPublish = false): UseAtlasDataResult
{
    const publishedBundleReference = useRef<AppDataBundle>(EMPTY_BUNDLE);
    const operationInFlightReference = useRef(false);
    const [bundle, setBundle] = useState<AppDataBundle>(EMPTY_BUNDLE);
    const [status, setStatus] = useState<AtlasDataStatus>('loading');
    const [error, setError] = useState<string | null>(null);
    const [hasPublishedThisSession, setHasPublishedThisSession] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

    const loadSharedDataset = useCallback(async (): Promise<void> =>
    {
        setStatus('loading');
        setError(null);
        setMessage(null);

        try
        {
            const snapshot = await sharedDatasetClient.loadDataset();
            const synchronizedBundle = synchronizeBundleRatings(snapshot.bundle);

            publishedBundleReference.current = synchronizedBundle;
            setBundle(synchronizedBundle);
            setIsDirty(false);
            setHasPublishedThisSession(false);
            setLastSavedAt(snapshot.updatedAt);
            setStatus('ready');
        }
        catch (loadError)
        {
            if (!sharedDatasetClient.isConfigured())
            {
                publishedBundleReference.current = CONFIGURATION_FALLBACK_BUNDLE;
                setBundle(CONFIGURATION_FALLBACK_BUNDLE);
                setIsDirty(false);
                setHasPublishedThisSession(false);
                setMessage('Local mode: configure Supabase to load and publish the shared base dataset.');
                setStatus('ready');
                return;
            }

            setError(describeError(loadError));
            setStatus('error');
        }
    }, []);

    useEffect(() =>
    {
        void loadSharedDataset();
    }, [loadSharedDataset]);

    const requireAvailableOperation = useCallback((): void =>
    {
        if (operationInFlightReference.current)
        {
            throw new Error('Another shared data operation is still in progress.');
        }
    }, []);

    const updateDraft = useCallback((updater: (current: AppDataBundle) => AppDataBundle): void =>
    {
        requireAvailableOperation();
        setBundle((current) => parseAppDataBundle(updater(current)));
        setIsDirty(true);
        setError(null);
        setMessage(canPublish
            ? 'Local changes are ready. Click Save to publish them as the shared base.'
            : 'Local changes affect only this browser unless an administrator publishes them.');
        setStatus('ready');
    }, [canPublish, requireAvailableOperation]);

    const saveTag = useCallback((tag: MapTag): Promise<void> =>
    {
        updateDraft((current) =>
        {
            if (tag.type === 'university')
            {
                return { ...current, universities: upsertRecord(current.universities, tag) };
            }

            if (tag.type === 'company')
            {
                return { ...current, companies: upsertRecord(current.companies, tag) };
            }

            return { ...current, notes: upsertRecord(current.notes ?? [], tag) };
        });
        return Promise.resolve();
    }, [updateDraft]);

    const deleteTag = useCallback((tag: MapTag): Promise<void> =>
    {
        updateDraft((current) => ({
            ...current,
            universities: current.universities.filter((item) => item.id !== tag.id),
            companies: current.companies.filter((item) => item.id !== tag.id),
            notes: (current.notes ?? []).filter((item) => item.id !== tag.id),
        }));
        return Promise.resolve();
    }, [updateDraft]);

    const saveCountryOverlay = useCallback((overlay: CountryOverlay): Promise<void> =>
    {
        updateDraft((current) => ({
            ...current,
            countryOverlays: upsertRecord(current.countryOverlays, overlay),
        }));
        return Promise.resolve();
    }, [updateDraft]);

    const deleteCountryOverlay = useCallback((overlayId: string): Promise<void> =>
    {
        updateDraft((current) => ({
            ...current,
            countryOverlays: current.countryOverlays.filter((item) => item.id !== overlayId),
        }));
        return Promise.resolve();
    }, [updateDraft]);

    const importJson = useCallback((json: string, mode: ImportMode): Promise<void> =>
    {
        requireAvailableOperation();
        const importedBundle = prepareImportedBundle(parseImportJson(json), parseAppDataBundle);
        const nextBundle = mode === 'merge' ? mergeBundles(bundle, importedBundle) : importedBundle;

        setBundle(nextBundle);
        setIsDirty(true);
        setError(null);
        setMessage(canPublish
            ? 'The import is in your working copy. Click Save to publish it as the shared base.'
            : 'The import is in your local working copy and has not changed the shared base.');
        setStatus('ready');
        return Promise.resolve();
    }, [bundle, canPublish, requireAvailableOperation]);

    const exportJson = useCallback((): Promise<string> =>
    {
        return Promise.resolve(serializeBundle(bundle, true));
    }, [bundle]);

    const clearAll = useCallback((): Promise<void> =>
    {
        updateDraft((current) => ({
            ...current,
            exportedAt: new Date().toISOString(),
            universities: [],
            companies: [],
            notes: [],
            countryOverlays: [],
        }));
        return Promise.resolve();
    }, [updateDraft]);

    const saveSharedDataset = useCallback(async (): Promise<void> =>
    {
        if (!canPublish)
        {
            throw new Error('Administrator login is required to publish the shared base dataset.');
        }

        requireAvailableOperation();
        operationInFlightReference.current = true;
        setStatus('saving');
        setError(null);
        setMessage(null);

        try
        {
            const bundleToSave = parseAppDataBundle({
                ...bundle,
                exportedAt: new Date().toISOString(),
            });
            const snapshot = await sharedDatasetClient.saveDataset(bundleToSave);

            publishedBundleReference.current = snapshot.bundle;
            setBundle(snapshot.bundle);
            setIsDirty(false);
            setHasPublishedThisSession(true);
            setLastSavedAt(snapshot.updatedAt);
            setMessage('Shared dataset saved successfully. Everyone will see it after reload or refresh.');
            setStatus('ready');
        }
        catch (saveError)
        {
            setError(describeError(saveError));
            setStatus('error');
            throw saveError;
        }
        finally
        {
            operationInFlightReference.current = false;
        }
    }, [bundle, canPublish, requireAvailableOperation]);

    return {
        bundle,
        clearAll,
        deleteCountryOverlay,
        deleteTag,
        error,
        exportJson,
        hasPublishedThisSession,
        importJson,
        isDirty,
        isSharedConfigured: sharedDatasetClient.isConfigured(),
        lastSavedAt,
        message,
        refetch: loadSharedDataset,
        saveCountryOverlay,
        saveSharedDataset,
        saveTag,
        status,
    };
}
