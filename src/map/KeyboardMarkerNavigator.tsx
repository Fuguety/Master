import type { MapTag } from "../types";
import styles from "./TagPreview.module.css";

export interface KeyboardMarkerNavigatorProps
{
    onBlur: (tagId: string) => void;
    onFocus: (tagId: string) => void;
    onSelect: (tag: MapTag) => void;
    tags: readonly MapTag[];
    visibleTagIds: readonly string[];
}

/**
 * Provides focusable equivalents for currently rendered unclustered map symbols.
 * Used by WorldMap without creating duplicate visual or React marker instances.
 */
export function KeyboardMarkerNavigator({
    onBlur,
    onFocus,
    onSelect,
    tags,
    visibleTagIds,
}: KeyboardMarkerNavigatorProps)
{
    const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
    const visibleTags = visibleTagIds
        .map((tagId) => tagsById.get(tagId))
        .filter((tag): tag is MapTag => tag !== undefined);

    if (visibleTags.length === 0)
    {
        return null;
    }

    return (
        <nav aria-label="Visible map markers" className={styles.navigator}>
            {visibleTags.map((tag) => (
                <button
                    key={tag.id}
                    onBlur={() => onBlur(tag.id)}
                    onClick={() => onSelect(tag)}
                    onFocus={() => onFocus(tag.id)}
                    type="button"
                >
                    {tag.type === "note" ? `Note: ${tag.name}` : `${tag.type}: ${tag.name}`}
                </button>
            ))}
        </nav>
    );
}
