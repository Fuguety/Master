import type { Coordinates, ResolvedLocation } from "../../types";

/**
 * Defines one configurable provider boundary for forward and reverse geocoding.
 * Used by tag creation and reusable location autocomplete controls.
 */
export interface GeocodingService
{
    reverse(coordinates: Coordinates, signal?: AbortSignal): Promise<ResolvedLocation | null>;
    searchCities(query: string, countryCode?: string, signal?: AbortSignal): Promise<ResolvedLocation[]>;
}

