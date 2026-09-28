import sourceCountries from "../../data/countries.json";

export interface CountryInformation
{
    alpha2Code: string;
    alpha3Code: string;
    area: number;
    capital?: string;
    continent: string;
    countryTier?: string;
    currencies: Array<{ code: string; name: string; symbol?: string }>;
    dataSource: string;
    englishName: string;
    languages: string[];
    lastUpdated?: string;
    minimumMonthlyWage?: { amount: number; currency: string; rateDate: string };
    natoMember?: boolean;
    originalName?: string;
    population?: number;
    region: string;
    subregion: string;
}

/**
 * Resolves bundled, canonical country facts by ISO alpha-3 code.
 * Used by the Country Information panel and never invents unavailable values.
 */
export function getCountryInformation(alpha3Code: string): CountryInformation | undefined
{
    const country = sourceCountries.find((candidate) => candidate.iso3 === alpha3Code.toUpperCase());

    if (country === undefined)
    {
        return undefined;
    }

    return {
        alpha2Code: country.iso2,
        alpha3Code: country.iso3,
        area: country.areaKm2 ?? 0,
        capital: country.capital ?? undefined,
        continent: country.continent,
        countryTier: country.countryTier ?? undefined,
        currencies: country.currency === null ? [] : [{
            code: country.currency.code,
            name: country.currency.name,
            symbol: country.currency.symbol ?? undefined,
        }],
        dataSource: country.dataSource,
        englishName: country.englishName,
        languages: country.languages,
        lastUpdated: country.lastUpdated,
        minimumMonthlyWage: country.minimumMonthlyWage === null ? undefined : {
            amount: country.minimumMonthlyWage.value,
            currency: country.minimumMonthlyWage.currency,
            rateDate: country.lastUpdated,
        },
        natoMember: country.natoMember,
        originalName: country.nativeName,
        population: country.population ?? undefined,
        region: country.region,
        subregion: country.subregion,
    };
}
