import { NoteListEditor } from "../../components/NoteListEditor/NoteListEditor";
import { RatingSummary } from "../../components/RatingSummary/RatingSummary";
import { SourceListEditor } from "../../components/SourceListEditor/SourceListEditor";
import { CityAutocomplete } from "../../components/CityAutocomplete/CityAutocomplete";
import { CountryAutocomplete } from "../../components/CountryAutocomplete/CountryAutocomplete";
import { BooleanSelectField } from "../../components/forms/BooleanSelectField";
import { NumberField } from "../../components/forms/NumberField";
import { RangeField } from "../../components/forms/RangeField";
import { SelectField } from "../../components/forms/SelectField";
import { TextField } from "../../components/forms/TextField";
import { useFieldUpdater } from "../../hooks/useFieldUpdater";
import { CoordinateFields } from "../CoordinateFields/CoordinateFields";
import { FormSection } from "../FormSection/FormSection";
import { TagFormShell } from "../TagFormShell/TagFormShell";
import { countryTierOptions, scoreFieldHint } from "../formOptions";
import type { UniversityFormProps } from "../formTypes";
import { UniversityIcon } from "../icons/UniversityIcon";
import { synchronizeCountry, synchronizeResolvedLocation } from "../../services";
import styles from "./UniversityForm.module.css";

/**
 * Renders the complete controlled university tag editor.
 * Used by map-click creation and existing university edit workflows.
 * Emits domain-safe values while scoring, validation, and persistence stay external.
 */
export function UniversityForm({
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
    submitLabel = "Save university",
    value,
}: UniversityFormProps)
{
    const updateField = useFieldUpdater(value, onChange);

    return (
        <div className={styles.universityForm}>
            <TagFormShell
                busy={busy}
                description="Capture comparable study, life, career, reputation, and travel factors."
                disabled={disabled}
                eyebrow="University tag"
                icon={<UniversityIcon />}
                onCancel={onCancel}
                onSubmit={onSubmit}
                submitLabel={submitLabel}
                title={value.name.trim() || "New university"}
            >
                <FormSection description="Name the institution and place it precisely on the map." title="Identity and location">
                    <TextField
                        disabled={disabled}
                        error={errors.name}
                        label="University name"
                        maxLength={180}
                        name="university-name"
                        onChange={(name) => updateField("name", name)}
                        placeholder="University name"
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
                        name="university-country-code"
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
                        name="university-country-tier"
                        onChange={(countryTier) => updateField("countryTier", countryTier)}
                        options={countryTierOptions}
                        required
                        value={value.countryTier}
                    />
                    <RangeField
                        disabled={disabled}
                        error={errors.locationScore}
                        hint={scoreFieldHint}
                        label="Location score"
                        name="university-location-score"
                        onChange={(locationScore) => updateField("locationScore", locationScore)}
                        value={value.locationScore}
                    />
                </FormSection>

                <FormSection description="Assess day-to-day living and post-study opportunity on the common 0–5 scale." title="Student life and opportunity">
                    <RangeField
                        disabled={disabled}
                        error={errors.qualityOfLife}
                        hint={scoreFieldHint}
                        label="Quality of life"
                        name="university-quality-of-life"
                        onChange={(qualityOfLife) => updateField("qualityOfLife", qualityOfLife)}
                        value={value.qualityOfLife}
                    />
                    <RangeField
                        disabled={disabled}
                        error={errors.affordability}
                        hint="0 is least affordable; 5 is most affordable."
                        label="Price / affordability"
                        name="university-affordability"
                        onChange={(affordability) => updateField("affordability", affordability)}
                        value={value.affordability}
                    />
                    <RangeField
                        disabled={disabled}
                        error={errors.jobOpportunities}
                        hint={scoreFieldHint}
                        label="Job opportunities"
                        name="university-job-opportunities"
                        onChange={(jobOpportunities) => updateField("jobOpportunities", jobOpportunities)}
                        value={value.jobOpportunities}
                    />
                    <BooleanSelectField
                        disabled={disabled}
                        error={errors.jobPlacementSupport}
                        hint="The configured boolean mapping converts this answer to a score."
                        label="University helps students find jobs"
                        name="university-placement-support"
                        onChange={(jobPlacementSupport) => updateField("jobPlacementSupport", jobPlacementSupport)}
                        value={value.jobPlacementSupport}
                    />
                    <RangeField
                        disabled={disabled}
                        error={errors.regionalCompanies}
                        hint="Rate the strength of good companies in the region."
                        label="Regional companies"
                        name="university-regional-companies"
                        onChange={(regionalCompanies) => updateField("regionalCompanies", regionalCompanies)}
                        value={value.regionalCompanies}
                    />
                    <RangeField
                        disabled={disabled}
                        error={errors.commuteQuality}
                        hint={scoreFieldHint}
                        label="Commute quality"
                        name="university-commute-quality"
                        onChange={(commuteQuality) => updateField("commuteQuality", commuteQuality)}
                        value={value.commuteQuality}
                    />
                </FormSection>

                <FormSection description="Keep global and local signals separate so the configured weights remain transparent." title="Reputation and ranking">
                    <RangeField
                        disabled={disabled}
                        error={errors.globalReputation}
                        hint={scoreFieldHint}
                        label="Global reputation"
                        name="university-global-reputation"
                        onChange={(globalReputation) => updateField("globalReputation", globalReputation)}
                        value={value.globalReputation}
                    />
                    <RangeField
                        disabled={disabled}
                        error={errors.localReputation}
                        hint={scoreFieldHint}
                        label="Local reputation"
                        name="university-local-reputation"
                        onChange={(localReputation) => updateField("localReputation", localReputation)}
                        value={value.localReputation}
                    />
                    <NumberField
                        disabled={disabled}
                        error={errors.globalRanking}
                        hint="Use the published rank; lower values score higher after normalization."
                        label="Global ranking"
                        min={1}
                        name="university-global-ranking"
                        onChange={(globalRanking) => updateField("globalRanking", globalRanking)}
                        value={value.globalRanking}
                    />
                    <NumberField
                        disabled={disabled}
                        error={errors.localRanking}
                        hint="Use the published rank; lower values score higher after normalization."
                        label="Local ranking"
                        min={1}
                        name="university-local-ranking"
                        onChange={(localRanking) => updateField("localRanking", localRanking)}
                        value={value.localRanking}
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
