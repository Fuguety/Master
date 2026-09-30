import { useMemo, useState } from "react";
import type { CountryLocation, CountryOverlay } from "../../types";
import { Button } from "../Button/Button";
import { CountryAutocomplete } from "../CountryAutocomplete/CountryAutocomplete";
import { CheckboxField } from "../forms/CheckboxField";
import styles from "./CountryOverlayList.module.css";

export interface CountryOverlayListProps
{
    disabled?: boolean;
    editable?: boolean;
    onCreate: (countryCode: string, countryName: string) => void;
    onSelect: (overlayId: string) => void;
    onVisibilityChange: (overlayId: string, isVisible: boolean) => void;
    overlays: readonly CountryOverlay[];
    selectedOverlayId?: string | null;
}

/**
 * Renders a searchable controlled list of existing country highlight overlays.
 * Used by the country tool before opening an individual overlay editor.
 * Emits selection and visibility intents without mutating geographic data.
 */
export function CountryOverlayList({
    disabled = false,
    editable = true,
    onCreate,
    onSelect,
    onVisibilityChange,
    overlays,
    selectedOverlayId = null,
}: CountryOverlayListProps)
{
    const [query, setQuery] = useState("");
    const [selectedCountry, setSelectedCountry] = useState<CountryLocation | null>(null);
    const visibleOverlays = useMemo(() =>
    {
        const normalizedQuery = query.trim().toLocaleLowerCase();

        if (normalizedQuery.length === 0)
        {
            return overlays;
        }

        return overlays.filter((overlay) =>
        {
            return overlay.countryName.toLocaleLowerCase().includes(normalizedQuery)
                || overlay.countryCode.toLocaleLowerCase().includes(normalizedQuery);
        });
    }, [overlays, query]);

    /**
     * Opens a country overlay draft from keyboard-entered country identity.
     * Used as the non-pointer alternative to selecting a country polygon.
     */
    function handleCreate(): void
    {
        if (selectedCountry === null)
        {
            return;
        }

        onCreate(selectedCountry.code, selectedCountry.name);
        setSelectedCountry(null);
    }

    return (
        <section aria-labelledby="country-overlays-title" className={styles.listPanel}>
            <header>
                <p>Map canvas</p>
                <h2 id="country-overlays-title">Country highlights</h2>
                <span>{editable
                    ? "Select the map or enter an ISO alpha-3 code to add a highlight."
                    : "Browse the country highlights in the shared dataset."}</span>
            </header>
            {editable ? <div className={styles.createForm}>
                <CountryAutocomplete
                    disabled={disabled}
                    onChange={(countryName) =>
                    {
                        setQuery(countryName);
                        setSelectedCountry(null);
                    }}
                    onSelect={(country) =>
                    {
                        setQuery(country.name);
                        setSelectedCountry(country);
                    }}
                    required
                    value={selectedCountry?.name ?? query}
                />
                <Button disabled={disabled || selectedCountry === null} onClick={handleCreate} variant="secondary">
                    Create country highlight
                </Button>
            </div> : null}
            <CountryAutocomplete
                disabled={disabled}
                label="Search highlighted countries"
                onChange={setQuery}
                onSelect={(country) => setQuery(country.name)}
                value={query}
            />
            {visibleOverlays.length > 0 ? (
                <ul className={styles.list}>
                    {visibleOverlays.map((overlay) => (
                        <li data-selected={selectedOverlayId === overlay.id} key={overlay.id}>
                            <button className={styles.selectButton} disabled={disabled} onClick={() => onSelect(overlay.id)} type="button">
                                <svg aria-hidden="true" className={styles.swatch} viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" fill={overlay.color} fillOpacity={overlay.opacity} r="10" />
                                    <circle cx="12" cy="12" fill="none" r="10" stroke="currentColor" />
                                </svg>
                                <span>
                                    <strong>{overlay.countryName}</strong>
                                    <small>{overlay.countryCode}</small>
                                </span>
                            </button>
                            {editable ? <CheckboxField
                                checked={overlay.isVisible}
                                disabled={disabled}
                                label={`Show ${overlay.countryName}`}
                                onChange={(isVisible) => onVisibilityChange(overlay.id, isVisible)}
                            /> : null}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className={styles.empty}>{overlays.length === 0 ? "No countries highlighted yet." : "No highlights match this search."}</p>
            )}
        </section>
    );
}
