import { StarRatingInput } from "../StarRatingInput/StarRatingInput";

export interface RangeFieldProps
{
    disabled?: boolean;
    error?: string;
    hint?: string;
    label: string;
    max?: number;
    min?: number;
    name?: string;
    onChange: (value: number | null) => void;
    step?: number;
    value: number | null;
}

/**
 * Adapts the shared half-star selector to the established score-field API.
 * Used by score entry and minimum-rating filter controls.
 * Emits a zero-to-five value or null for the unassessed state.
 */
export function RangeField({
    disabled = false,
    error,
    hint,
    label,
    max = 5,
    min = 0,
    name,
    onChange,
    step = 0.5,
    value,
}: RangeFieldProps)
{
    return (
        <StarRatingInput
            clearLabel={label === "Minimum rating" ? "Any rating" : "Clear"}
            disabled={disabled || max !== 5 || min !== 0 || step > 0.5}
            error={error}
            hint={hint}
            label={label}
            name={name}
            onChange={onChange}
            value={value}
        />
    );
}
