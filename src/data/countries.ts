import countryRecords from "./countries.json";
import type { CountryLocation } from "../types/location";

/**
 * Provides the complete searchable ISO 3166-1 alpha-3 country catalog and centers.
 * Used by autocomplete controls without requiring a network request while typing.
 */
export const countries: readonly CountryLocation[] = countryRecords
    .filter((country) => country.iso3.length === 3)
    .map((country) => ({
        name: country.englishName,
        code: country.iso3,
        coordinates: country.coordinates,
        originalName: country.nativeName,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));



/**
 * Finds a country by common name, official name alias, or ISO alpha-3 code.
 * Used by location synchronization, geocoding, and imported tag editing.
 */
export function findCountry(value: string): CountryLocation | undefined
{
    const normalizedValue = value.trim().toLocaleLowerCase();
    const directMatch = countries.find((country) =>
        country.name.toLocaleLowerCase() === normalizedValue
        || country.code.toLocaleLowerCase() === normalizedValue);

    if (directMatch !== undefined)
    {
        return directMatch;
    }

    const sourceMatch = countryRecords.find((country) =>
        country.iso2.toLocaleLowerCase() === normalizedValue
        || country.nativeName.toLocaleLowerCase() === normalizedValue
        || country.officialName.toLocaleLowerCase() === normalizedValue
        || country.alternativeNames.some((spelling) => spelling.toLocaleLowerCase() === normalizedValue));

    return sourceMatch === undefined
        ? undefined
        : countries.find((country) => country.code === sourceMatch.iso3);
}
