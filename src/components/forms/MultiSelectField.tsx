import { SearchableMultiSelect } from "../SearchableMultiSelect/SearchableMultiSelect";
import type { SelectOption } from "./SelectField";

export interface MultiSelectFieldProps<TValue extends string = string>
{
    disabled?: boolean;
    hint?: string;
    label: string;
    name?: string;
    onChange: (value: TValue[]) => void;
    options: readonly SelectOption<TValue>[];
    value: TValue[];
}

/**
 * Adapts the searchable chip-based multi-select to the existing filter field API.
 * Used by country, city, tier, model, industry, and area filters.
 * Emits all selected typed option values in display order.
 */
export function MultiSelectField<TValue extends string = string>({
    disabled = false,
    hint,
    label,
    onChange,
    options,
    value,
}: MultiSelectFieldProps<TValue>)
{
    return (
        <SearchableMultiSelect
            disabled={disabled}
            label={hint === undefined ? label : `${label} — ${hint}`}
            onChange={onChange}
            options={options}
            value={value}
        />
    );
}
