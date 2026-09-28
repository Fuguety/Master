import { useState } from "react";
import type { CompanyFilters, CountryTier, WorkModel } from "../../../types";
import { useFieldUpdater } from "../../../hooks/useFieldUpdater";
import { countryTierOptions, workModelOptions } from "../../../tags/formOptions";
import { BooleanSelectField } from "../../forms/BooleanSelectField";
import { MultiSelectField } from "../../forms/MultiSelectField";
import { NumericRangeField } from "../../forms/NumericRangeField";
import { RangeField } from "../../forms/RangeField";
import type { SelectOption } from "../../forms/SelectField";
import { FilterGroup } from "../FilterGroup/FilterGroup";
import { FilterPanelShell } from "../FilterPanelShell/FilterPanelShell";
import { FilterSearch } from "../FilterSearch/FilterSearch";

const COMPANY_FILTER_ENTRIES = [
    { category: "Place and rating", label: "Countries" }, { category: "Place and rating", label: "Cities" },
    { category: "Place and rating", label: "Country tiers" }, { category: "Place and rating", label: "Minimum rating" },
    { category: "Career and work", label: "Payment" }, { category: "Career and work", label: "Career growth" },
    { category: "Career and work", label: "Location" }, { category: "Career and work", label: "Work models" },
    { category: "Career and work", label: "Internship availability" },
    { category: "Organization", label: "Industries" }, { category: "Organization", label: "Company areas" },
];

export interface CompanyFilterPanelProps
{
    activeCount: number;
    areaOptions: readonly SelectOption[];
    cityOptions: readonly SelectOption[];
    countryOptions: readonly SelectOption[];
    disabled?: boolean;
    industryOptions: readonly SelectOption[];
    onChange: (filters: CompanyFilters) => void;
    onReset: () => void;
    value: CompanyFilters;
}

/**
 * Renders every independent and combinable company filter dimension.
 * Used by the company filter tool without evaluating tag records itself.
 * Emits immutable CompanyFilters objects to the optimized filtering service.
 */
export function CompanyFilterPanel({
    activeCount,
    areaOptions,
    cityOptions,
    countryOptions,
    disabled = false,
    industryOptions,
    onChange,
    onReset,
    value,
}: CompanyFilterPanelProps)
{
    const updateField = useFieldUpdater(value, onChange);
    const [searchQuery, setSearchQuery] = useState("");
    const hasMatches = searchQuery.trim().length === 0 || COMPANY_FILTER_ENTRIES.some((entry) =>
        `${entry.category} ${entry.label}`.toLocaleLowerCase().includes(searchQuery.trim().toLocaleLowerCase()));

    return (
        <FilterPanelShell activeCount={activeCount} disabled={disabled} onReset={onReset} title="Company filters">
            <FilterSearch entries={COMPANY_FILTER_ENTRIES} onChange={setSearchQuery} query={searchQuery} />
            {!hasMatches ? <p role="status">No matching filters</p> : null}
            <FilterGroup description="Choose any number of places. Empty selections include all places." searchQuery={searchQuery} searchTerms={["Countries", "Cities", "Country tiers", "Minimum rating"]} title="Place and rating">
                <MultiSelectField
                    disabled={disabled}
                    label="Countries"
                    onChange={(countries) => updateField("countries", countries.length > 0 ? countries : undefined)}
                    options={countryOptions}
                    value={value.countries ?? []}
                />
                <MultiSelectField
                    disabled={disabled}
                    label="Cities"
                    onChange={(cities) => updateField("cities", cities.length > 0 ? cities : undefined)}
                    options={cityOptions}
                    value={value.cities ?? []}
                />
                <MultiSelectField<CountryTier>
                    disabled={disabled}
                    label="Country tiers"
                    onChange={(countryTiers) => updateField("countryTiers", countryTiers.length > 0 ? countryTiers : undefined)}
                    options={countryTierOptions}
                    value={value.countryTiers ?? []}
                />
                <RangeField
                    disabled={disabled}
                    hint="Only show companies at or above this final score."
                    label="Minimum rating"
                    onChange={(minimumRating) => updateField("minimumRating", minimumRating ?? undefined)}
                    step={0.1}
                    value={value.minimumRating ?? null}
                />
            </FilterGroup>

            <FilterGroup description="All score ranges are inclusive and use the common 0–5 scale." searchQuery={searchQuery} searchTerms={["Payment", "Career growth", "Location", "Work models", "Internship availability"]} title="Career and work">
                <NumericRangeField
                    disabled={disabled}
                    label="Payment"
                    onChange={(payment) => updateField("payment", payment)}
                    value={value.payment}
                />
                <NumericRangeField
                    disabled={disabled}
                    label="Career growth"
                    onChange={(careerGrowth) => updateField("careerGrowth", careerGrowth)}
                    value={value.careerGrowth}
                />
                <NumericRangeField
                    disabled={disabled}
                    label="Location"
                    onChange={(locationScore) => updateField("locationScore", locationScore)}
                    value={value.locationScore}
                />
                <MultiSelectField<WorkModel>
                    disabled={disabled}
                    label="Work models"
                    onChange={(workModels) => updateField("workModels", workModels.length > 0 ? workModels : undefined)}
                    options={workModelOptions}
                    value={value.workModels ?? []}
                />
                <BooleanSelectField
                    disabled={disabled}
                    label="Internship availability"
                    nullLabel="Any internship status"
                    onChange={(internshipAvailability) => updateField("internshipAvailability", internshipAvailability ?? undefined)}
                    value={value.internshipAvailability ?? null}
                />
            </FilterGroup>

            <FilterGroup description="Multiple industries and specializations combine as inclusive selections." searchQuery={searchQuery} searchTerms={["Industries", "Company areas"]} title="Organization">
                <MultiSelectField
                    disabled={disabled}
                    label="Industries"
                    onChange={(industries) => updateField("industries", industries.length > 0 ? industries : undefined)}
                    options={industryOptions}
                    value={value.industries ?? []}
                />
                <MultiSelectField
                    disabled={disabled}
                    label="Company areas"
                    onChange={(companyAreas) => updateField("companyAreas", companyAreas.length > 0 ? companyAreas : undefined)}
                    options={areaOptions}
                    value={value.companyAreas ?? []}
                />
            </FilterGroup>
        </FilterPanelShell>
    );
}
