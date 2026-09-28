/**
 * Stores a user's presentation settings for one highlighted country.
 * Used by the country-overlay map layer and persistence adapter.
 */
export interface CountryOverlay
{
    id: string;
    countryCode: string;
    countryName: string;
    color: string;
    opacity: number;
    isVisible: boolean;
    notes: string;
    updatedAt: string;
}
