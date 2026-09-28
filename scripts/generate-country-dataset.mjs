import { writeFile } from "node:fs/promises";
import worldCountries from "world-countries";

const COUNTRY_FACTS_ENDPOINT = "https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries.json";
const NATO_COUNTRY_CODES = new Set([
    "ALB", "BEL", "BGR", "CAN", "HRV", "CZE", "DNK", "EST", "FIN", "FRA", "DEU",
    "GRC", "HUN", "ISL", "ITA", "LVA", "LTU", "LUX", "MNE", "NLD", "MKD", "NOR",
    "POL", "PRT", "ROU", "SVK", "SVN", "ESP", "SWE", "TUR", "GBR", "USA",
]);
const MINIMUM_WAGE_OVERRIDES = new Map([
    ["BRA", { value: 1518, currency: "BRL" }],
]);
const SNAPSHOT_DATE = "2026-08-05";

/**
 * Chooses the first native common name from maintained country metadata.
 * Used by the country dataset generator and falls back to the English common name.
 */
function getNativeName(country)
{
    return Object.values(country.name.native ?? {})[0]?.common ?? country.name.common;
}



/**
 * Converts source country records into the stable Atlas bundled schema.
 * Used only by the explicit maintenance script and never fetched by the application runtime.
 */
function createAtlasCountry(country, facts)
{
    const currencyCode = facts?.currency ?? Object.keys(country.currencies ?? {})[0];
    const sourceCurrency = currencyCode === undefined ? undefined : country.currencies[currencyCode];

    return {
        iso2: country.cca2,
        iso3: country.cca3,
        englishName: country.name.common,
        nativeName: facts?.native ?? getNativeName(country),
        officialName: country.name.official,
        alternativeNames: country.altSpellings,
        capital: facts?.capital ?? country.capital[0] ?? null,
        population: facts?.population ?? null,
        areaKm2: facts?.area_sq_km ?? country.area ?? null,
        currency: currencyCode === undefined ? null : {
            code: currencyCode,
            name: facts?.currency_name ?? sourceCurrency?.name ?? currencyCode,
            symbol: facts?.currency_symbol ?? sourceCurrency?.symbol ?? null,
        },
        languages: Object.values(country.languages ?? {}),
        continent: facts?.region ?? country.region,
        region: facts?.region ?? country.region,
        subregion: facts?.subregion ?? country.subregion,
        countryTier: null,
        natoMember: NATO_COUNTRY_CODES.has(country.cca3),
        minimumMonthlyWage: MINIMUM_WAGE_OVERRIDES.get(country.cca3) ?? null,
        coordinates: {
            latitude: Number(facts?.latitude ?? country.latlng[0]),
            longitude: Number(facts?.longitude ?? country.latlng[1]),
        },
        lastUpdated: SNAPSHOT_DATE,
        dataSource: "Bundled Atlas Dataset (world-countries 5.1.0 and countries-states-cities snapshot)",
    };
}



/**
 * Refreshes the checked-in sovereign-country snapshot from public maintenance sources.
 * Run manually when updating facts; the browser application reads only the generated JSON.
 */
async function generateCountryDataset()
{
    const response = await fetch(COUNTRY_FACTS_ENDPOINT);

    if (!response.ok)
    {
        throw new Error(`Country source request failed with ${response.status}.`);
    }

    const countryFacts = await response.json();
    const factsByCode = new Map(countryFacts.map((country) => [country.iso3, country]));
    const sovereignCountries = worldCountries.filter((country) =>
        country.independent === true || country.unMember === true || country.cca3 === "PSE");
    const dataset = sovereignCountries
        .map((country) => createAtlasCountry(country, factsByCode.get(country.cca3)))
        .sort((left, right) => left.englishName.localeCompare(right.englishName));

    await writeFile(new URL("../src/data/countries.json", import.meta.url), `${JSON.stringify(dataset, null, 4)}\n`, "utf8");
    console.log(`Wrote ${dataset.length} sovereign-country records.`);
}

await generateCountryDataset();
