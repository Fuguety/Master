import { findCountry } from "../../data/countries";
import type { Coordinates, ResolvedLocation } from "../../types";
import { normalizeCoordinates } from "../../utils/geoCoordinates";
import type { GeocodingService } from "./types";

interface NominatimAddress
{
    city?: string;
    country?: string;
    country_code?: string;
    municipality?: string;
    town?: string;
    village?: string;
}

interface NominatimResult
{
    address?: NominatimAddress;
    lat: string;
    lon: string;
    display_name?: string;
}

const DEFAULT_ENDPOINT = "https://nominatim.openstreetmap.org";

/**
 * Converts one provider response into the application's synchronized location shape.
 * Used internally by forward and reverse Nominatim requests.
 */
function parseResult(result: NominatimResult): ResolvedLocation | null
{
    const longitude = Number(result.lon);
    const latitude = Number(result.lat);
    const address = result.address;

    if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || address === undefined)
    {
        return null;
    }

    const country = address.country?.trim() ?? "";
    const countryRecord = findCountry(address.country_code ?? country);

    return {
        city: address.city ?? address.town ?? address.village ?? address.municipality ?? "",
        country,
        countryCode: countryRecord?.code ?? "",
        coordinates: normalizeCoordinates({ longitude, latitude }),
        displayName: result.display_name,
    };
}



/**
 * Implements key-free, configurable browser geocoding through OpenStreetMap Nominatim.
 * Used by the location synchronization workflow without exposing private credentials.
 */
export class NominatimGeocodingService implements GeocodingService
{
    private readonly endpoint: string;

    public constructor(endpoint?: string)
    {
        const environment = import.meta.env as Record<string, unknown>;
        const configuredEndpoint = environment["VITE_GEOCODING_ENDPOINT"];
        const resolvedEndpoint = endpoint
            ?? (typeof configuredEndpoint === "string" ? configuredEndpoint : DEFAULT_ENDPOINT);
        this.endpoint = resolvedEndpoint.replace(/\/$/u, "");
    }

    /**
     * Resolves clicked map coordinates into a city and country when available.
     * Used immediately after click-to-create and returns null on provider failure.
     */
    public async reverse(coordinates: Coordinates, signal?: AbortSignal): Promise<ResolvedLocation | null>
    {
        const parameters = new URLSearchParams({
            format: "jsonv2",
            lat: coordinates.latitude.toString(),
            lon: coordinates.longitude.toString(),
            addressdetails: "1",
        });

        try
        {
            const response = await fetch(`${this.endpoint}/reverse?${parameters}`, {
                headers: { Accept: "application/json" },
                signal,
            });

            if (!response.ok)
            {
                return null;
            }

            return parseResult(await response.json() as NominatimResult);
        }
        catch
        {
            return null;
        }
    }

    /**
     * Searches city candidates after the user pauses typing.
     * Used by CityAutocomplete and returns a deduplicated, bounded result list.
     */
    public async searchCities(
        query: string,
        countryCode?: string,
        signal?: AbortSignal,
    ): Promise<ResolvedLocation[]>
    {
        if (query.trim().length < 2)
        {
            return [];
        }

        const country = countryCode === undefined ? undefined : findCountry(countryCode);
        const parameters = new URLSearchParams({
            format: "jsonv2",
            q: country === undefined ? query.trim() : `${query.trim()}, ${country.name}`,
            addressdetails: "1",
            limit: "8",
        });

        try
        {
            const response = await fetch(`${this.endpoint}/search?${parameters}`, {
                headers: { Accept: "application/json" },
                signal,
            });

            if (!response.ok)
            {
                return [];
            }

            const parsed = (await response.json() as NominatimResult[])
                .map(parseResult)
                .filter((location): location is ResolvedLocation => location !== null && location.city.length > 0);
            const uniqueLocations = new Map<string, ResolvedLocation>();

            for (const location of parsed)
            {
                uniqueLocations.set(`${location.city}|${location.countryCode}|${location.coordinates.longitude}`, location);
            }

            return [...uniqueLocations.values()].slice(0, 8);
        }
        catch
        {
            return [];
        }
    }
}
