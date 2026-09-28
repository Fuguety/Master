import type { Coordinates, TagType } from "../../types";
import { CompanyIcon } from "../../tags/icons/CompanyIcon";
import { UniversityIcon } from "../../tags/icons/UniversityIcon";
import { NoteIcon } from "../../tags/icons/NoteIcon";
import { Button } from "../Button/Button";
import styles from "./TagTypeChooser.module.css";

export interface TagTypeChooserProps
{
    coordinates: Coordinates;
    locale?: string;
    onCancel: () => void;
    onSelect: (tagType: TagType) => void;
}

/**
 * Formats one map coordinate for readable creation context.
 * Used by the tag-type chooser after a map click.
 * Returns a locale-aware decimal with four fractional digits.
 */
function formatCoordinate(value: number, locale: string | undefined): string
{
    return new Intl.NumberFormat(locale, {
        maximumFractionDigits: 4,
        minimumFractionDigits: 4,
    }).format(value);
}



/**
 * Lets keyboard and pointer users choose which tag type to create at a click.
 * Used immediately after the map emits new-tag coordinates.
 * Emits only the selected discriminant while preserving the coordinates outside.
 */
export function TagTypeChooser({ coordinates, locale, onCancel, onSelect }: TagTypeChooserProps)
{
    return (
        <section aria-labelledby="tag-type-title" className={styles.chooser}>
            <header>
                <p>New map tag</p>
                <h2 id="tag-type-title">What belongs here?</h2>
                <span>
                    {formatCoordinate(coordinates.latitude, locale)}, {formatCoordinate(coordinates.longitude, locale)}
                </span>
            </header>
            <div className={styles.options}>
                <button className={styles.option} data-type="university" onClick={() => onSelect("university")} type="button">
                    <UniversityIcon />
                    <strong>University</strong>
                    <span>Study, life, reputation, ranking, and career factors</span>
                </button>
                <button className={styles.option} data-type="company" onClick={() => onSelect("company")} type="button">
                    <CompanyIcon />
                    <strong>Company</strong>
                    <span>Payment, growth, work model, industry, and internships</span>
                </button>
                <button className={styles.option} data-type="note" onClick={() => onSelect("note")} type="button">
                    <NoteIcon />
                    <strong>Note</strong>
                    <span>A map-based sticky note with optional sources and locking</span>
                </button>
            </div>
            <Button onClick={onCancel} variant="quiet">Cancel</Button>
        </section>
    );
}
