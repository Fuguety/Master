import { NoteListEditor } from "../../components/NoteListEditor/NoteListEditor";
import { RatingSummary } from "../../components/RatingSummary/RatingSummary";
import { SourceListEditor } from "../../components/SourceListEditor/SourceListEditor";
import { CityAutocomplete } from "../../components/CityAutocomplete/CityAutocomplete";
import { CountryAutocomplete } from "../../components/CountryAutocomplete/CountryAutocomplete";
import { BooleanSelectField } from "../../components/forms/BooleanSelectField";
import { RangeField } from "../../components/forms/RangeField";
import { SelectField } from "../../components/forms/SelectField";
import { TextField } from "../../components/forms/TextField";
import { useFieldUpdater } from "../../hooks/useFieldUpdater";
import { CoordinateFields } from "../CoordinateFields/CoordinateFields";
import { FormSection } from "../FormSection/FormSection";
import { TagFormShell } from "../TagFormShell/TagFormShell";
import { countryTierOptions, scoreFieldHint, workModelOptions } from "../formOptions";
import type { CompanyFormProps } from "../formTypes";
import { CompanyIcon } from "../icons/CompanyIcon";
import { synchronizeCountry, synchronizeResolvedLocation } from "../../services";
import styles from "./CompanyForm.module.css";

/**
 * Renders the complete controlled company tag editor.
 * Used by map-click creation and existing company edit workflows.
 * Emits domain-safe values while scoring, validation, and persistence stay external.
 */
export function CompanyForm({
    busy = false,
    disabled = false,
    errors = {},
    onAddNote,
    onAddSource,
    onCancel,
    onChange,
    onDeleteNote,
    onDeleteSource,
    onLocationResolved,
    onSubmit,
    onUpdateNote,
    onUpdateSource,
    ratingResult,
    submitLabel = "Save company",
    value,
}: CompanyFormProps)
{
    const updateField = useFieldUpdater(value, onChange);

    return (
        <div className={styles.companyForm}>
            <TagFormShell
                busy={busy}
                description="Compare compensation, development, location, flexibility, and early-career access."
                disabled={disabled}
                eyebrow="Company tag"
                icon={<CompanyIcon />}
                onCancel={onCancel}
                onSubmit={onSubmit}
                submitLabel={submitLabel}
                title={value.name.trim() || "New company"}
            >
                <FormSection description="Name the company and place this opportunity precisely on the map." title="Identity and location">
                    <TextField
                        disabled={disabled}
                        error={errors.name}
                        label="Company name"
                        maxLength={180}
                        name="company-name"
                        onChange={(name) => updateField("name", name)}
                        placeholder="Company name"
                        required
                        value={value.name}
                    />
                    <CityAutocomplete
                        countryCode={value.countryCode}
                        disabled={disabled}
                        error={errors.city}
                        onChange={(city) => updateField("city", city)}
                        onSelect={(location) =>
                        {
                            onChange(synchronizeResolvedLocation(value, location));
                            onLocationResolved?.(location.coordinates);
                        }}
                        required
                        value={value.city}
                    />
                    <CountryAutocomplete
                        disabled={disabled}
                        error={errors.country}
                        onChange={(country) => updateField("country", country)}
                        onSelect={(country) =>
                        {
                            onChange(synchronizeCountry(value, country));
                            onLocationResolved?.(country.coordinates);
                        }}
                        required
                        value={value.country}
                    />
                    <TextField
                        disabled={disabled}
                        error={errors.countryCode}
                        hint="Optional. ISO 3166-1 alpha-3 code is derived from the selected location when possible."
                        label="Country code"
                        maxLength={3}
                        name="company-country-code"
                        onChange={(countryCode) => updateField("countryCode", countryCode.trim().length === 0
                            ? undefined
                            : countryCode.toUpperCase())}
                        value={value.countryCode ?? ""}
                    />
                    <CoordinateFields
                        disabled={disabled}
                        latitudeError={errors.latitude}
                        longitudeError={errors.longitude}
                        onChange={(coordinates) => updateField("coordinates", coordinates)}
                        value={value.coordinates}
                    />
                    <SelectField
                        disabled={disabled}
                        error={errors.countryTier}
                        hint="Tier scoring is defined in scoring-config.json."
                        label="Country tier"
                        name="company-country-tier"
                        onChange={(countryTier) => updateField("countryTier", countryTier)}
                        options={countryTierOptions}
                        required
                        value={value.countryTier}
                    />
                    <RangeField
                        disabled={disabled}
                        error={errors.locationScore}
                        hint={scoreFieldHint}
                        label="Location"
                        name="company-location-score"
                        onChange={(locationScore) => updateField("locationScore", locationScore)}
                        value={value.locationScore}
                    />
                </FormSection>

                <FormSection description="Evaluate the role and working arrangement on consistent scales." title="Career and work">
                    <RangeField
                        disabled={disabled}
                        error={errors.payment}
                        hint={scoreFieldHint}
                        label="Payment"
                        name="company-payment"
                        onChange={(payment) => updateField("payment", payment)}
                        value={value.payment}
                    />
                    <RangeField
                        disabled={disabled}
                        error={errors.careerGrowth}
                        hint={scoreFieldHint}
                        label="Career growth"
                        name="company-career-growth"
                        onChange={(careerGrowth) => updateField("careerGrowth", careerGrowth)}
                        value={value.careerGrowth}
                    />
                    <SelectField
                        disabled={disabled}
                        error={errors.workModel}
                        hint="The configured categorical mapping converts this model to a score."
                        label="Work model"
                        name="company-work-model"
                        onChange={(workModel) => updateField("workModel", workModel)}
                        options={workModelOptions}
                        required
                        value={value.workModel}
                    />
                    <BooleanSelectField
                        disabled={disabled}
                        error={errors.internshipAvailability}
                        hint="The configured boolean mapping converts this answer to a score."
                        label="Internship availability"
                        name="company-internships"
                        onChange={(internshipAvailability) => updateField("internshipAvailability", internshipAvailability)}
                        value={value.internshipAvailability}
                    />
                    <TextField
                        disabled={disabled}
                        error={errors.industry}
                        label="Company industry"
                        maxLength={120}
                        name="company-industry"
                        onChange={(industry) => updateField("industry", industry.trim().length === 0 ? undefined : industry)}
                        placeholder="Technology, health care, energy…"
                        value={value.industry ?? ""}
                    />
                    <TextField
                        disabled={disabled}
                        error={errors.companyArea}
                        label="Area / specialization"
                        maxLength={160}
                        name="company-area"
                        onChange={(companyArea) => updateField("companyArea", companyArea.trim().length === 0 ? undefined : companyArea)}
                        placeholder="Machine learning, finance, operations…"
                        value={value.companyArea ?? ""}
                    />
                </FormSection>

                <RatingSummary fallbackRating={value.finalRating} result={ratingResult} />

                <FormSection description="Keep observations separate and attach evidence for later review." title="Research record">
                    <NoteListEditor
                        disabled={disabled}
                        notes={value.notes}
                        onAdd={onAddNote}
                        onDelete={onDeleteNote}
                        onUpdate={onUpdateNote}
                    />
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
