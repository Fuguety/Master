import { CityAutocomplete } from "../../components/CityAutocomplete/CityAutocomplete";
import { CountryAutocomplete } from "../../components/CountryAutocomplete/CountryAutocomplete";
import { SourceListEditor } from "../../components/SourceListEditor/SourceListEditor";
import { CheckboxField } from "../../components/forms/CheckboxField";
import { ColorField } from "../../components/forms/ColorField";
import { TextAreaField } from "../../components/forms/TextAreaField";
import { TextField } from "../../components/forms/TextField";
import { synchronizeCountry, synchronizeResolvedLocation } from "../../services";
import { CoordinateFields } from "../CoordinateFields/CoordinateFields";
import { FormSection } from "../FormSection/FormSection";
import { TagFormShell } from "../TagFormShell/TagFormShell";
import type { NoteFormProps } from "../formTypes";
import { NoteIcon } from "../icons/NoteIcon";
import styles from "./NoteForm.module.css";

/**
 * Renders the controlled sticky-note editor without scoring controls.
 * Used for new and existing Note records with shared location and source services.
 */
export function NoteForm({
    busy = false,
    disabled = false,
    errors = {},
    onAddSource,
    onCancel,
    onChange,
    onDeleteSource,
    onLocationResolved,
    onSubmit,
    onUpdateSource,
    submitLabel = "Save note",
    value,
}: NoteFormProps)
{
    return (
        <div className={styles.noteForm}>
            <TagFormShell
                busy={busy}
                description="Pin a flexible sticky note to a place on the map."
                disabled={disabled}
                eyebrow="Note tag"
                icon={<NoteIcon />}
                onCancel={onCancel}
                onSubmit={onSubmit}
                submitLabel={submitLabel}
                title={value.name.trim() || "New note"}
            >
                <FormSection title="Note">
                    <TextField
                        disabled={disabled}
                        error={errors.name}
                        label="Title"
                        maxLength={200}
                        onChange={(name) => onChange({ ...value, name })}
                        required
                        value={value.name}
                    />
                    <TextAreaField
                        disabled={disabled}
                        error={errors.content}
                        label="Note content"
                        maxLength={20_000}
                        onChange={(content) => onChange({ ...value, content })}
                        required
                        value={value.content}
                    />
                    <ColorField
                        disabled={disabled}
                        error={errors.color}
                        hint="Optional sticky-note color."
                        label="Color"
                        onChange={(color) => onChange({ ...value, color })}
                        value={value.color ?? "#f4c95d"}
                    />
                    <CheckboxField
                        checked={value.locked}
                        disabled={disabled}
                        label="Lock marker and window position"
                        onChange={(locked) => onChange({ ...value, locked })}
                    />
                </FormSection>
                <FormSection title="Location">
                    <CountryAutocomplete
                        disabled={disabled}
                        error={errors.country}
                        onChange={(country) => onChange({ ...value, country })}
                        onSelect={(country) =>
                        {
                            onChange(synchronizeCountry(value, country));
                            onLocationResolved?.(country.coordinates);
                        }}
                        required
                        value={value.country}
                    />
                    <CityAutocomplete
                        countryCode={value.countryCode}
                        disabled={disabled}
                        error={errors.city}
                        onChange={(city) => onChange({ ...value, city })}
                        onSelect={(location) =>
                        {
                            onChange(synchronizeResolvedLocation(value, location));
                            onLocationResolved?.(location.coordinates);
                        }}
                        required
                        value={value.city}
                    />
                    <details className={styles.advanced}>
                        <summary>Advanced coordinates</summary>
                        <CoordinateFields
                            disabled={disabled}
                            latitudeError={errors.latitude}
                            longitudeError={errors.longitude}
                            onChange={(coordinates) => onChange({ ...value, coordinates })}
                            value={value.coordinates}
                        />
                    </details>
                </FormSection>
                <FormSection title="Sources">
                    <SourceListEditor
                        disabled={disabled}
                        error={errors.sources}
                        onAdd={onAddSource}
                        onDelete={onDeleteSource}
                        onUpdate={onUpdateSource}
                        sources={value.sources}
                    />
                </FormSection>
            </TagFormShell>
        </div>
    );
}

