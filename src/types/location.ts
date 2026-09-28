import type { Coordinates } from "./common";

/**
 * Describes a country selection with its ISO code and representative center.
 * Used by country autocomplete, geocoding, overlays, and tag location forms.
 */
export interface CountryLocation
{
    name: string;
    code: string;
    coordinates: Coordinates;
    originalName?: string | undefined;
}



/**
 * Describes a resolved city or reverse-geocoded map location.
 * Used by location synchronization to update every related tag field together.
 */
export interface ResolvedLocation
{
    city: string;
    country: string;
    countryCode: string;
    coordinates: Coordinates;
    displayName?: string | undefined;
}
