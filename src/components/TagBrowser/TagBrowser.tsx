import { useMemo, useState } from "react";
import type { Coordinates, MapTag, ResolvedLocation } from "../../types";
import { Button } from "../Button/Button";
import { LocationSearch } from "../LocationSearch/LocationSearch";
import { TextField } from "../forms/TextField";
import styles from "./TagBrowser.module.css";
import { formatRating } from "../../utils/ratingFormat";

export interface TagBrowserProps
{
    disabled?: boolean;
    locale?: string;
    onCreate: (coordinates: Coordinates) => void;
    onLocationPreview?: ((coordinates: Coordinates | null) => void) | undefined;
    onSelect: (tag: MapTag) => void;
    tags: readonly MapTag[];
}



/**
 * Provides searchable tag access and coordinate-based creation without a pointer.
 * Used beside tag visibility controls as the map canvas keyboard alternative.
 * Emits canonical coordinates and complete selected tag records.
 */
export function TagBrowser({
    disabled = false,
    locale,
    onCreate,
    onLocationPreview,
    onSelect,
    tags,
}: TagBrowserProps)
{
    const [query, setQuery] = useState("");
    const [location, setLocation] = useState<ResolvedLocation | null>(null);
    const canCreate = location !== null;
    const matchingTags = useMemo(() =>
    {
        const normalizedQuery = query.trim().toLocaleLowerCase();

        if (normalizedQuery.length === 0)
        {
            return tags;
        }

        return tags.filter((tag) =>
        {
            return [tag.name, tag.city, tag.country, tag.type]
                .some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
        });
    }, [query, tags]);

    /**
     * Starts the standard tag-type workflow from validated numeric coordinates.
     * Used by the keyboard-accessible create button.
     */
    function handleCreate(): void
    {
        if (!canCreate || location === null)
        {
            return;
        }

        onCreate(location.coordinates);
    }

    return (
        <section aria-labelledby="tag-browser-title" className={styles.browser}>
            <div>
                <h3 id="tag-browser-title">Browse and create tags</h3>
                <p>Open any saved record, or search for a location to create one without clicking the map.</p>
            </div>

            <div className={styles.coordinates}>
                <LocationSearch
                    disabled={disabled}
                    onResolve={(resolvedLocation) =>
                    {
                        setLocation(resolvedLocation);
                        onLocationPreview?.(resolvedLocation.coordinates);
                    }}
                    value={location}
                />
                <Button disabled={disabled || !canCreate} onClick={handleCreate} variant="secondary">
                    Create tag here
                </Button>
            </div>

            <TextField
                disabled={disabled}
                label="Search all tags"
                onChange={setQuery}
                placeholder="Name, city, country, or type"
                type="search"
                value={query}
            />

            {matchingTags.length === 0
                ? <p className={styles.empty}>No tags match this search.</p>
                : (
                    <ul className={styles.list}>
                        {matchingTags.map((tag) => (
                            <li key={tag.id}>
                                <button disabled={disabled} onClick={() => onSelect(tag)} type="button">
                                    <span aria-hidden="true" className={styles.icon} data-type={tag.type}>
                                        {tag.type === "university" ? "U" : tag.type === "company" ? "C" : "N"}
                                    </span>
                                    <span className={styles.tagText}>
                                        <strong>{tag.name}</strong>
                                        <small>{tag.city}, {tag.country}</small>
                                    </span>
                                    {tag.type === "note" ? null : (
                                        <span className={styles.rating}>
                                            {formatRating(tag.finalRating, locale)} <span aria-hidden="true">★</span>
                                        </span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
        </section>
    );
}
