import type { CountryOverlay } from '@/types';
import { createId } from '@/utils/createId';

/**
 * Creates a visible country highlight from a map selection.
 * Used by country-selection mode before the overlay color editor opens.
 * Returns a valid overlay with a readable default color and opacity.
 */
export function createCountryOverlay(countryCode: string, countryName: string): CountryOverlay
{
    return {
        id: createId('country-overlay'),
        countryCode: countryCode.toUpperCase(),
        countryName,
        color: '#4f7cff',
        opacity: 0.34,
        isVisible: true,
        notes: '',
        updatedAt: new Date().toISOString(),
    };
}
