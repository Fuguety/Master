import type { TagType } from "../../types";
import { CompanyIcon } from "../../tags/icons/CompanyIcon";
import { UniversityIcon } from "../../tags/icons/UniversityIcon";
import { NoteIcon } from "../../tags/icons/NoteIcon";
import styles from "./TagVisibilityControl.module.css";

export interface TagVisibilityControlProps
{
    companyCount: number;
    disabled?: boolean;
    onChange: (visibleTypes: TagType[]) => void;
    noteCount: number;
    universityCount: number;
    value: readonly TagType[];
}

/**
 * Renders independent university and company visibility toggles with counts.
 * Used by map filtering controls before the detailed type-specific filters.
 * Emits the complete array of tag discriminants that should remain visible.
 */
export function TagVisibilityControl({
    companyCount,
    disabled = false,
    onChange,
    noteCount,
    universityCount,
    value,
}: TagVisibilityControlProps)
{
    const toggleType = (tagType: TagType, isVisible: boolean): void =>
    {
        const nextValue = isVisible
            ? Array.from(new Set([...value, tagType]))
            : value.filter((currentType) => currentType !== tagType);
        onChange(nextValue);
    };

    return (
        <fieldset className={styles.control} disabled={disabled}>
            <legend>Visible tag types</legend>
            <div className={styles.options}>
                <label data-type="university">
                    <input
                        checked={value.includes("university")}
                        onChange={(event) => toggleType("university", event.currentTarget.checked)}
                        type="checkbox"
                    />
                    <UniversityIcon />
                    <span>
                        <strong>Universities</strong>
                        <small>{universityCount} tags</small>
                    </span>
                </label>
                <label data-type="company">
                    <input
                        checked={value.includes("company")}
                        onChange={(event) => toggleType("company", event.currentTarget.checked)}
                        type="checkbox"
                    />
                    <CompanyIcon />
                    <span>
                        <strong>Companies</strong>
                        <small>{companyCount} tags</small>
                    </span>
                </label>
                <label data-type="note">
                    <input
                        checked={value.includes("note")}
                        onChange={(event) => toggleType("note", event.currentTarget.checked)}
                        type="checkbox"
                    />
                    <NoteIcon />
                    <span>
                        <strong>Notes</strong>
                        <small>{noteCount} tags</small>
                    </span>
                </label>
            </div>
        </fieldset>
    );
}
