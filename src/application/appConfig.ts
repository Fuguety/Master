import type { AtlasDataStatus } from './useAtlasData';
import type { MapStyleId } from '@/map';
import type { GeographicNameMode, MapTag, TagType } from '@/types';

export type ToolPanelId =
    | 'navigation'
    | 'visibility'
    | 'university-filters'
    | 'company-filters'
    | 'countries'
    | 'data'
    | 'settings';

export type ActivePanelId = ToolPanelId | 'tag-type' | 'tag-editor' | 'country-editor' | 'country-info' | null;

export interface ToolDefinition
{
    description: string;
    icon: string;
    id: Exclude<ToolPanelId, 'navigation' | 'settings'>;
    label: string;
}

export interface PanelMetadata
{
    description: string;
    title: string;
}

export const TOOL_DEFINITIONS: readonly ToolDefinition[] = [
    { id: 'visibility', label: 'Tags', icon: '◆', description: 'Browse, create, show, or hide tags' },
    { id: 'university-filters', label: 'Universities', icon: 'U', description: 'Filter university research' },
    { id: 'company-filters', label: 'Companies', icon: 'C', description: 'Filter company research' },
    { id: 'countries', label: 'Countries', icon: '◇', description: 'Highlight country boundaries' },
    { id: 'data', label: 'Data', icon: '⇅', description: 'Import or export JSON' },
];

export const PANEL_METADATA: Record<Exclude<ActivePanelId, null>, PanelMetadata> = {
    navigation: { title: 'Atlas tools', description: 'Choose a map workspace tool.' },
    visibility: { title: 'Tag workspace', description: 'Browse, create, and independently show or hide tag types.' },
    'university-filters': { title: 'University filters', description: 'Combine research criteria to narrow visible universities.' },
    'company-filters': { title: 'Company filters', description: 'Combine career criteria to narrow visible companies.' },
    countries: { title: 'Country highlights', description: 'Select a country on the map or edit an existing overlay.' },
    data: { title: 'Data management', description: 'Keep a portable versioned backup of local research.' },
    settings: { title: 'Settings', description: 'Change presentation without changing application data.' },
    'tag-type': { title: 'Create a map tag', description: 'Choose the record type for this location.' },
    'tag-editor': { title: 'Tag editor', description: 'Complete fields, notes, sources, and scoring inputs.' },
    'country-editor': { title: 'Country overlay', description: 'Customize this selected country highlight.' },
    'country-info': { title: 'Country information', description: 'Browse bundled facts and records in this highlighted country.' },
};



/**
 * Validates a stored MapLibre style preference.
 * Used by the persistent presentation preference hook.
 * Narrows unknown JSON to one supported flat-map style.
 */
export function isMapStyle(value: unknown): value is MapStyleId
{
    return value === 'cartographic' || value === 'satellite';
}



/**
 * Validates a stored Boolean presentation preference.
 * Used by the marker-clustering preference.
 * Narrows unknown JSON to boolean.
 */
export function isBoolean(value: unknown): value is boolean
{
    return typeof value === 'boolean';
}



/**
 * Validates a persisted desktop panel width within map-safe bounds.
 * Used by the resizable responsive panel preference.
 */
export function isPanelWidth(value: unknown): value is number
{
    return typeof value === 'number' && Number.isFinite(value) && value >= 340 && value <= 720;
}



/**
 * Validates a stored geographic-name presentation mode.
 * Used by the shared country and city display preference.
 */
export function isGeographicNameMode(value: unknown): value is GeographicNameMode
{
    return value === 'english' || value === 'original' || value === 'english-original';
}



/**
 * Validates a stored collection of visible tag discriminants.
 * Used by the tag visibility preference.
 * Returns true only for unique supported University and Company values.
 */
export function isTagTypeList(value: unknown): value is TagType[]
{
    return Array.isArray(value)
        && value.every((item) => item === 'university' || item === 'company' || item === 'note')
        && new Set(value).size === value.length;
}



/**
 * Finds one university or company across the normalized data bundle.
 * Used by popup, edit, delete, and marker-drag workflows.
 * Returns undefined when an identifier has been removed or imported away.
 */
export function findTag(
    universities: readonly MapTag[],
    companies: readonly MapTag[],
    tagId: string,
    notes: readonly MapTag[] = [],
): MapTag | undefined
{
    return universities.find((tag) => tag.id === tagId)
        ?? companies.find((tag) => tag.id === tagId)
        ?? notes.find((tag) => tag.id === tagId);
}



/**
 * Maps persistence state into the compact header status vocabulary.
 * Used by AppHeader's live save indicator.
 * Returns saved, saving, or error.
 */
export function getHeaderSaveStatus(status: AtlasDataStatus): 'error' | 'saved' | 'saving'
{
    if (status === 'error')
    {
        return 'error';
    }

    return status === 'loading' || status === 'saving' ? 'saving' : 'saved';
}
