/**
 * Joins hint and validation-message identifiers for form controls.
 * Used by reusable inputs to expose supporting text to assistive technology.
 * Returns undefined when no descriptions are present.
 */
export function getDescriptionIds(
    controlId: string,
    hint: string | undefined,
    error: string | undefined,
): string | undefined
{
    const identifiers = [
        hint ? `${controlId}-hint` : "",
        error ? `${controlId}-error` : "",
    ].filter(Boolean);

    return identifiers.length > 0 ? identifiers.join(" ") : undefined;
}

