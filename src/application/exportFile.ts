import type { AppDataBundle } from '@/types';
import { createBundleBlob, serializeBundle } from '@/storage';
import type { ExportScope } from '@/components';

/**
 * Selects a valid versioned subset for one export scope.
 * Used by the data-management panel before JSON serialization.
 * Returns empty non-selected collections so every file retains one schema.
 */
export function createScopedExport(
    bundle: AppDataBundle,
    scope: ExportScope,
): AppDataBundle
{
    return {
        version: bundle.version,
        exportedAt: new Date().toISOString(),
        universities: scope === 'all' || scope === 'universities' ? bundle.universities : [],
        companies: scope === 'all' || scope === 'companies' ? bundle.companies : [],
        notes: scope === 'all' ? bundle.notes ?? [] : [],
        countryOverlays: scope === 'all' || scope === 'country-overlays'
            ? bundle.countryOverlays
            : [],
    };
}



/**
 * Starts a browser download and promptly releases its temporary object URL.
 * Used by JSON export without sending private local data to a server.
 * Accepts trusted JSON and a conservative filename.
 */
export function downloadJson(json: string, filename: string): void
{
    const objectUrl = URL.createObjectURL(createBundleBlob(json));
    const link = document.createElement('a');

    link.href = objectUrl;
    link.download = filename;
    link.rel = 'noopener';
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}



/**
 * Serializes and downloads one scoped application backup.
 * Used by the root data workflow to keep DOM mechanics out of React components.
 * Returns the export timestamp shown to the user.
 */
export function exportBundleFile(bundle: AppDataBundle, scope: ExportScope): string
{
    const scopedBundle = createScopedExport(bundle, scope);
    const dateStamp = scopedBundle.exportedAt.slice(0, 10);

    downloadJson(serializeBundle(scopedBundle, true), `atlas-notebook-${scope}-${dateStamp}.json`);

    return scopedBundle.exportedAt;
}
