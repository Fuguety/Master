import { useCallback } from "react";

export type FieldUpdater<TValue> = <TKey extends keyof TValue>(
    field: TKey,
    nextValue: TValue[TKey],
) => void;

/**
 * Creates a stable immutable field updater for a controlled form value.
 * Used by university, company, filter, and overlay editor components.
 * Returns a typed callback that replaces exactly one property.
 */
export function useFieldUpdater<TValue extends object>(
    value: TValue,
    onChange: (nextValue: TValue) => void,
): FieldUpdater<TValue>
{
    return useCallback(
        <TKey extends keyof TValue>(field: TKey, nextValue: TValue[TKey]): void =>
        {
            onChange({ ...value, [field]: nextValue });
        },
        [onChange, value],
    );
}

