import type { CompanyFilters, UniversityFilters } from '@/types';

export interface FilterOption
{
    label: string;
    value: string;
}



/**
 * Counts meaningful values in a filter object, including bounded ranges once.
 * Used by both filter tool badges and reset summaries.
 * Returns the number of independently active filter dimensions.
 */
function countActiveValues(filters: Record<string, unknown>): number
{
    let count = 0;

    for (const value of Object.values(filters))
    {
        if (Array.isArray(value))
        {
            count += value.length > 0 ? 1 : 0;
        }
        else if (typeof value === 'object' && value !== null)
        {
            count += Object.values(value).some((entry) => entry !== undefined) ? 1 : 0;
        }
        else if (value !== undefined)
        {
            count += 1;
        }
    }

    return count;
}



/**
 * Counts active university filter dimensions.
 * Used by the university filter panel and tool-rail badge.
 * Returns zero for the reset filter state.
 */
export function countUniversityFilters(filters: UniversityFilters): number
{
    return countActiveValues(filters as Record<string, unknown>);
}



/**
 * Counts active company filter dimensions.
 * Used by the company filter panel and tool-rail badge.
 * Returns zero for the reset filter state.
 */
export function countCompanyFilters(filters: CompanyFilters): number
{
    return countActiveValues(filters as Record<string, unknown>);
}



/**
 * Builds sorted unique options from plain text record values.
 * Used by country, city, industry, and specialization filters.
 * Returns value-label pairs compatible with controlled select fields.
 */
export function createFilterOptions(values: readonly (string | undefined)[], locale?: string): FilterOption[]
{
    const uniqueValues = [...new Set(values
        .filter((value): value is string => value !== undefined)
        .map((value) => value.trim())
        .filter(Boolean))];

    uniqueValues.sort((left, right) => left.localeCompare(right, locale, { sensitivity: 'base' }));

    return uniqueValues.map((value) => ({ label: value, value }));
}
