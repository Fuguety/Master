import { useCallback, useEffect, useRef, useState } from 'react';
import { exampleCompanies, exampleCountryOverlays, exampleNotes, exampleUniversities } from '@/data';
import { createDataAccess, type AtlasDataAccess, type ImportMode } from '@/storage';
import { synchronizeBundleRatings } from '@/scoring';
import type { AppDataBundle, CountryOverlay, MapTag } from '@/types';

const EMPTY_BUNDLE: AppDataBundle = {
    version: 1,
    exportedAt: new Date(0).toISOString(),
    universities: [],
    companies: [],
    notes: [],
    countryOverlays: [],
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
    importJson: (json: string, mode: ImportMode) => Promise<void>;
    saveCountryOverlay: (overlay: CountryOverlay) => Promise<void>;
    saveTag: (tag: MapTag) => Promise<void>;
    status: AtlasDataStatus;
}



/**
 * Converts an unknown persistence failure into a concise safe user message.
 * Used by every application data operation.
 * Returns an Error message without exposing imported payload contents.
 */
function describeError(error: unknown): string
{
    return error instanceof Error ? error.message : 'The local data operation failed.';
}



/**
 * Loads a fresh bundle and synchronizes derived ratings with active configuration.
 * Used after startup, imports, and clear operations.
 * Returns the current repository snapshot and persists only changed derived scores.
 */
async function loadCurrentBundle(dataAccess: AtlasDataAccess): Promise<AppDataBundle>
{
    const storedBundle = await dataAccess.loadBundle();
    const synchronizedBundle = synchronizeBundleRatings(storedBundle);
    const changedUniversities = synchronizedBundle.universities.filter((university, index) =>
    {
        return university.finalRating !== storedBundle.universities[index]?.finalRating;
    });
    const changedCompanies = synchronizedBundle.companies.filter((company, index) =>
    {
        return company.finalRating !== storedBundle.companies[index]?.finalRating;
    });

    await Promise.all([
        dataAccess.universities.saveMany(changedUniversities),
        dataAccess.companies.saveMany(changedCompanies),
    ]);

    return synchronizedBundle;
}



/**
 * Replaces or appends one record by identifier without mutating React state.
 * Used by optimistic university, company, and overlay collection updates.
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
 * Owns the swappable persistence facade and synchronized React data snapshot.
 * Used by the root application controller for all CRUD, import, and export workflows.
 * Returns async actions plus loading, saving, and error state.
 */
export function useAtlasData(): UseAtlasDataResult
{
    const dataAccessRef = useRef<AtlasDataAccess | null>(null);
    const operationInFlightRef = useRef(false);
    const [bundle, setBundle] = useState<AppDataBundle>(EMPTY_BUNDLE);
    const [status, setStatus] = useState<AtlasDataStatus>('loading');
    const [error, setError] = useState<string | null>(null);

    useEffect(() =>
    {
        let isActive = true;

        /**
         * Initializes IndexedDB with example records on a genuine first run.
         * Used once per mounted application data service.
         * Updates state only while the owning effect remains active.
         */
        async function initialize(): Promise<void>
        {
            try
            {
                const dataAccess = await createDataAccess();

                if (!isActive)
                {
                    dataAccess.close();
                    return;
                }

                dataAccessRef.current = dataAccess;
                await dataAccess.initialize({
                    universities: exampleUniversities,
                    companies: exampleCompanies,
                    notes: exampleNotes,
                    countryOverlays: exampleCountryOverlays,
                });
                const loadedBundle = await loadCurrentBundle(dataAccess);

                if (isActive)
                {
                    setBundle(loadedBundle);
                    setStatus('ready');
                }
            }
            catch (initializationError)
            {
                if (isActive)
                {
                    setError(describeError(initializationError));
                    setStatus('error');
                }
            }
        }

        void initialize();

        return () =>
        {
            isActive = false;
            dataAccessRef.current?.close();
            dataAccessRef.current = null;
        };
    }, []);

    const requireDataAccess = useCallback((): AtlasDataAccess =>
    {
        const dataAccess = dataAccessRef.current;

        if (dataAccess === null)
        {
            throw new Error('Local storage is still starting. Please try again.');
        }

        return dataAccess;
    }, []);

    const runOperation = useCallback(async (operation: () => Promise<void>): Promise<void> =>
    {
        if (operationInFlightRef.current)
        {
            throw new Error('Another local data operation is still in progress.');
        }

        operationInFlightRef.current = true;
        setStatus('saving');
        setError(null);

        try
        {
            await operation();
            setStatus('ready');
        }
        catch (operationError)
        {
            setError(describeError(operationError));
            setStatus('error');
            throw operationError;
        }
        finally
        {
            operationInFlightRef.current = false;
        }
    }, []);

    const saveTag = useCallback(async (tag: MapTag): Promise<void> =>
    {
        await runOperation(async () =>
        {
            const dataAccess = requireDataAccess();

            if (tag.type === 'university')
            {
                await dataAccess.universities.save(tag);
                setBundle((current) => ({
                    ...current,
                    universities: upsertRecord(current.universities, tag),
                }));
            }
            else if (tag.type === 'company')
            {
                await dataAccess.companies.save(tag);
                setBundle((current) => ({
                    ...current,
                    companies: upsertRecord(current.companies, tag),
                }));
            }
            else
            {
                await dataAccess.notes.save(tag);
                setBundle((current) => ({
                    ...current,
                    notes: upsertRecord(current.notes ?? [], tag),
                }));
            }
        });
    }, [requireDataAccess, runOperation]);

    const deleteTag = useCallback(async (tag: MapTag): Promise<void> =>
    {
        await runOperation(async () =>
        {
            const dataAccess = requireDataAccess();

            if (tag.type === 'university')
            {
                await dataAccess.universities.delete(tag.id);
                setBundle((current) => ({
                    ...current,
                    universities: current.universities.filter((item) => item.id !== tag.id),
                }));
            }
            else if (tag.type === 'company')
            {
                await dataAccess.companies.delete(tag.id);
                setBundle((current) => ({
                    ...current,
                    companies: current.companies.filter((item) => item.id !== tag.id),
                }));
            }
            else
            {
                await dataAccess.notes.delete(tag.id);
                setBundle((current) => ({
                    ...current,
                    notes: (current.notes ?? []).filter((item) => item.id !== tag.id),
                }));
            }
        });
    }, [requireDataAccess, runOperation]);

    const saveCountryOverlay = useCallback(async (overlay: CountryOverlay): Promise<void> =>
    {
        await runOperation(async () =>
        {
            const dataAccess = requireDataAccess();
            await dataAccess.countryOverlays.save(overlay);
            setBundle((current) => ({
                ...current,
                countryOverlays: upsertRecord(current.countryOverlays, overlay),
            }));
        });
    }, [requireDataAccess, runOperation]);

    const deleteCountryOverlay = useCallback(async (overlayId: string): Promise<void> =>
    {
        await runOperation(async () =>
        {
            const dataAccess = requireDataAccess();
            await dataAccess.countryOverlays.delete(overlayId);
            setBundle((current) => ({
                ...current,
                countryOverlays: current.countryOverlays.filter((item) => item.id !== overlayId),
            }));
        });
    }, [requireDataAccess, runOperation]);

    const importJson = useCallback(async (json: string, mode: ImportMode): Promise<void> =>
    {
        await runOperation(async () =>
        {
            const dataAccess = requireDataAccess();
            await dataAccess.importJson(json, { mode });
            setBundle(await loadCurrentBundle(dataAccess));
        });
    }, [requireDataAccess, runOperation]);

    const exportJson = useCallback(async (): Promise<string> =>
    {
        return requireDataAccess().exportJson(true);
    }, [requireDataAccess]);

    const clearAll = useCallback(async (): Promise<void> =>
    {
        await runOperation(async () =>
        {
            const dataAccess = requireDataAccess();
            await dataAccess.clearAll();
            setBundle(await loadCurrentBundle(dataAccess));
        });
    }, [requireDataAccess, runOperation]);

    return {
        bundle,
        clearAll,
        deleteCountryOverlay,
        deleteTag,
        error,
        exportJson,
        importJson,
        saveCountryOverlay,
        saveTag,
        status,
    };
}
