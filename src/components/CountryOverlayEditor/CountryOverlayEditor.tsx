import type { FormEvent } from "react";
import type { CountryOverlay } from "../../types";
import { useFieldUpdater } from "../../hooks/useFieldUpdater";
import { Button } from "../Button/Button";
import { CheckboxField } from "../forms/CheckboxField";
import { ColorField } from "../forms/ColorField";
import { RangeField } from "../forms/RangeField";
import { TextAreaField } from "../forms/TextAreaField";
import styles from "./CountryOverlayEditor.module.css";

export interface CountryOverlayErrors
{
    color?: string;
    notes?: string;
    opacity?: string;
}

export interface CountryOverlayEditorProps
{
    busy?: boolean;
    errors?: CountryOverlayErrors;
    onCancel: () => void;
    onChange: (overlay: CountryOverlay) => void;
    onDelete?: (overlayId: string) => void;
    onSave: () => void;
    value: CountryOverlay;
}

/**
 * Renders the controlled color, opacity, visibility, and note editor for a country.
 * Used after a country boundary is selected on the map.
 * Emits overlay changes while geographic selection and storage remain external.
 */
export function CountryOverlayEditor({
    busy = false,
    errors = {},
    onCancel,
    onChange,
    onDelete,
    onSave,
    value,
}: CountryOverlayEditorProps)
{
    const updateField = useFieldUpdater(value, onChange);
    const handleSubmit = (event: FormEvent<HTMLFormElement>): void =>
    {
        event.preventDefault();
        onSave();
    };

    return (
        <form className={styles.editor} onSubmit={handleSubmit}>
            <header className={styles.header}>
                <svg aria-hidden="true" className={styles.swatch} viewBox="0 0 48 48">
                    <circle cx="24" cy="24" fill={value.color} r="22" />
                    <circle cx="24" cy="24" fill="none" r="22" stroke="currentColor" strokeWidth="2" />
                </svg>
                <div>
                    <p>Country highlight</p>
                    <h2>{value.countryName}</h2>
                    <span>{value.countryCode}</span>
                </div>
            </header>
            <div className={styles.body}>
                <ColorField
                    disabled={busy}
                    error={errors.color}
                    hint="Choose a color with enough contrast against the active base map."
                    label="Overlay color"
                    onChange={(color) => updateField("color", color)}
                    value={value.color}
                />
                <RangeField
                    disabled={busy}
                    error={errors.opacity}
                    hint="Lower opacity preserves roads and satellite details beneath the highlight."
                    label="Opacity"
                    max={1}
                    min={0.05}
                    onChange={(opacity) => updateField("opacity", opacity ?? 0.35)}
                    step={0.05}
                    value={value.opacity}
                />
                <CheckboxField
                    checked={value.isVisible}
                    disabled={busy}
                    label="Show this country overlay"
                    onChange={(isVisible) => updateField("isVisible", isVisible)}
                />
                <TextAreaField
                    disabled={busy}
                    error={errors.notes}
                    hint="Optional plain-text context for why this country is highlighted."
                    label="Overlay note"
                    maxLength={2000}
                    onChange={(notes) => updateField("notes", notes)}
                    value={value.notes}
                />
            </div>
            <footer className={styles.actions}>
                {onDelete ? (
                    <Button disabled={busy} onClick={() => onDelete(value.id)} variant="danger">Delete overlay</Button>
                ) : null}
                <span />
                <Button disabled={busy} onClick={onCancel} variant="quiet">Cancel</Button>
                <Button disabled={busy} type="submit" variant="primary">{busy ? "Saving…" : "Save overlay"}</Button>
            </footer>
        </form>
    );
}
