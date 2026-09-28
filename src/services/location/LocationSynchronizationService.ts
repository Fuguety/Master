import type { CountryLocation, MapTag, ResolvedLocation } from "../../types";

/**
 * Applies a selected country to all related location fields atomically.
 * Used by both university and company country autocomplete controls.
 */
export function synchronizeCountry<TTag extends MapTag>(tag: TTag, country: CountryLocation): TTag
{
    return {
        ...tag,
        country: country.name,
        countryCode: country.code,
        coordinates: country.coordinates,
    };
}



/**
 * Applies a geocoded city or reverse result to every dependent tag field.
 * Used by click detection and city autocomplete without duplicating field updates.
 */
export function synchronizeResolvedLocation<TTag extends MapTag>(tag: TTag, location: ResolvedLocation): TTag
{
    const countryCode = location.countryCode.trim();

    return {
        ...tag,
        city: location.city,
        country: location.country,
        countryCode: countryCode.length === 0 ? undefined : countryCode,
        coordinates: location.coordinates,
    };
}
