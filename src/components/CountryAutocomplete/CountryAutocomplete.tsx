import { useMemo } from "react";
import { countries } from "../../data/countries";
import type { CountryLocation } from "../../types";
import { Autocomplete } from "../Autocomplete/Autocomplete";
import { formatGeographicName, getGeographicNameMode } from "../../services";

export interface CountryAutocompleteProps
{
    disabled?: boolean;
    error?: string;
    label?: string;
    onChange: (value: string) => void;
    onSelect: (country: CountryLocation) => void;
    required?: boolean;
    value: string;
}

/**
 * Renders the shared local country search with ISO code and representative center output.
 * Used by university, company, overlay, and country-search workflows.
 */
export function CountryAutocomplete({
    disabled = false,
    error,
    label = "Country",
    onChange,
    onSelect,
    required = false,
    value,
}: CountryAutocompleteProps)
{
    const options = useMemo(() =>
    {
        const query = value.trim().toLocaleLowerCase();
        const mode = getGeographicNameMode();

        return countries
            .filter((country) => query.length === 0
                || country.name.toLocaleLowerCase().includes(query)
                || country.originalName?.toLocaleLowerCase().includes(query)
                || country.code.toLocaleLowerCase().includes(query))
            .slice(0, 12)
            .map((country) => ({
                ...country,
                id: country.code,
                label: formatGeographicName(country.name, country.originalName, mode),
                description: country.code,
            }));
    }, [value]);

    return (
        <Autocomplete
            disabled={disabled}
            error={error}
            label={label}
            onInputChange={onChange}
            onSelect={onSelect}
            options={options}
            placeholder="Search countries"
            required={required}
            value={value}
        />
    );
}
