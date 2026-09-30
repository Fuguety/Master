import { useMemo, useState } from "react";
import type { Coordinates, MapTag, ResolvedLocation } from "../../types";
import { Button } from "../Button/Button";
import { LocationSearch } from "../LocationSearch/LocationSearch";
import { TextField } from "../forms/TextField";
import styles from "./TagBrowser.module.css";
import { formatRating } from "../../utils/ratingFormat";

export interface TagBrowserProps
{
    canCreate?: boolean;
    description?: string;
    disabled?: boolean;
    emptyMessage?: string;
    locale?: string;
    onCreate: (coordinates: Coordinates) => void;
    onLocationPreview?: ((coordinates: Coordinates | null) => void) | undefined;
    onSelect: (tag: MapTag) => void;
    searchLabel?: string;
    tags: readonly MapTag[];
    title?: string;
}



/**
 * Provides searchable tag access and coordinate-based creation without a pointer.
 * Used beside tag visibility controls as the map canvas keyboard alternative.
 * Emits canonical coordinates and complete selected tag records.
 */
export function TagBrowser({
    canCreate: creationEnabled = true,
    description,
    disabled = false,
    emptyMessage = "No tags match this search.",
    locale,
    onCreate,
    onLocationPreview,
    onSelect,
    searchLabel = "Search all tags",
    tags,
    title,
}: TagBrowserProps)
{
    const [query, setQuery] = useState("");
    const [location, setLocation] = useState<ResolvedLocation | null>(null);
    const canCreateAtLocation = location !== null;
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
        if (!canCreateAtLocation || location === null)
        {
            return;
        }

        onCreate(location.coordinates);
    }

    return (
        <section aria-labelledby="tag-browser-title" className={styles.browser}>
            <div>
                <h3 id="tag-browser-title">{title ?? (creationEnabled ? "Browse and create tags" : "Browse tags")}</h3>
                <p>{description ?? (creationEnabled
                    ? "Open any saved record, or search for a location to create one without clicking the map."
                    : "Open any record in the current shared dataset.")}</p>
            </div>

            {creationEnabled ? <div className={styles.coordinates}>
                <LocationSearch
                    disabled={disabled}
                    onResolve={(resolvedLocation) =>
                    {
                        setLocation(resolvedLocation);
                        onLocationPreview?.(resolvedLocation.coordinates);
                    }}
                    value={location}
                />
                <Button disabled={disabled || !canCreateAtLocation} onClick={handleCreate} variant="secondary">
                    Create tag here
                </Button>
            </div> : null}

            <TextField
                disabled={disabled}
                label={searchLabel}
                onChange={setQuery}
                placeholder="Name, city, country, or type"
                type="search"
                value={query}
            />

            {matchingTags.length === 0
                ? <p className={styles.empty}>{emptyMessage}</p>
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
