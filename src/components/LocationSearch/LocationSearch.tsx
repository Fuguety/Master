import { useState } from "react";
import type { Coordinates, CountryLocation, ResolvedLocation } from "../../types";
import { CityAutocomplete } from "../CityAutocomplete/CityAutocomplete";
import { CountryAutocomplete } from "../CountryAutocomplete/CountryAutocomplete";
import { CoordinateFields } from "../../tags/CoordinateFields/CoordinateFields";
import styles from "./LocationSearch.module.css";

export interface LocationSearchProps
{
    disabled?: boolean;
    onResolve: (location: ResolvedLocation) => void;
    value: ResolvedLocation | null;
}

/**
 * Replaces coordinate-first quick creation with country, city, and place search.
 * Used by Tag Workspace while retaining manual corrections in an advanced section.
 */
export function LocationSearch({ disabled = false, onResolve, value }: LocationSearchProps)
{
    const [countryQuery, setCountryQuery] = useState(value?.country ?? "");
    const [cityQuery, setCityQuery] = useState(value?.city ?? "");
    const [placeQuery, setPlaceQuery] = useState("");
    const selectCountry = (country: CountryLocation): void =>
    {
        setCountryQuery(country.name);
        onResolve({ city: "", country: country.name, countryCode: country.code, coordinates: country.coordinates });
    };
    const selectLocation = (location: ResolvedLocation): void =>
    {
        setCountryQuery(location.country);
        setCityQuery(location.city);
        onResolve(location);
    };
    const updateCoordinates = (coordinates: Coordinates): void =>
    {
        if (value !== null)
        {
            onResolve({ ...value, coordinates });
        }
    };

    return (
        <div className={styles.search}>
            <CountryAutocomplete
                disabled={disabled}
                onChange={setCountryQuery}
                onSelect={selectCountry}
                value={countryQuery}
            />
            <CityAutocomplete
                countryCode={value?.countryCode}
                disabled={disabled}
                onChange={setCityQuery}
                onSelect={selectLocation}
                value={cityQuery}
            />
            <CityAutocomplete
                countryCode={value?.countryCode}
                disabled={disabled}
                label="Precise place (optional)"
                onChange={setPlaceQuery}
                onSelect={selectLocation}
                value={placeQuery}
            />
            <details className={styles.advanced}>
                <summary>Advanced coordinate correction</summary>
                <CoordinateFields disabled={disabled || value === null} onChange={updateCoordinates} value={value?.coordinates ?? { longitude: 0, latitude: 0 }} />
            </details>
        </div>
    );
}

