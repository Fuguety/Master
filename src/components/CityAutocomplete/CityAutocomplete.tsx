import { useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { NominatimGeocodingService } from "../../services";
import type { ResolvedLocation } from "../../types";
import { Autocomplete } from "../Autocomplete/Autocomplete";

export interface CityAutocompleteProps
{
    countryCode?: string;
    disabled?: boolean;
    error?: string;
    onChange: (value: string) => void;
    onSelect: (location: ResolvedLocation) => void;
    label?: string;
    required?: boolean;
    value: string;
}

const geocodingService = new NominatimGeocodingService();

/**
 * Renders a debounced provider-backed city search and returns complete locations.
 * Used by both tag forms to synchronize city, country, code, coordinates, and camera.
 */
export function CityAutocomplete({
    countryCode,
    disabled = false,
    error,
    onChange,
    onSelect,
    label = "City",
    required = false,
    value,
}: CityAutocompleteProps)
{
    const debouncedValue = useDebouncedValue(value, 350);
    const [results, setResults] = useState<ResolvedLocation[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() =>
    {
        const controller = new AbortController();

        if (debouncedValue.trim().length < 2)
        {
            setResults([]);
            return () => controller.abort();
        }

        setLoading(true);
        void geocodingService.searchCities(debouncedValue, countryCode, controller.signal)
            .then(setResults)
            .finally(() => setLoading(false));

        return () => controller.abort();
    }, [countryCode, debouncedValue]);

    const options = useMemo(() => results.map((location, index) => ({
        ...location,
        id: `${location.coordinates.longitude}-${location.coordinates.latitude}-${index}`,
        label: label === "City" ? location.city : location.displayName ?? location.city,
        description: location.country,
    })), [label, results]);

    return (
        <Autocomplete
            disabled={disabled}
            emptyMessage={debouncedValue.trim().length < 2 ? "Type at least two characters" : "No cities found"}
            error={error}
            label={label}
            loading={loading}
            onInputChange={onChange}
            onSelect={onSelect}
            options={options}
            placeholder="Search cities"
            required={required}
            value={value}
        />
    );
}
