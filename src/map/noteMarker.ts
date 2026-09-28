import type { MapTag } from "../types";

/**
 * Determines whether a map tag may enter the marker-drag lifecycle.
 * Used by map interactions so locked Notes remain fixed while all other tags can move.
 */
export function canDragMapTag(tag: MapTag | undefined): boolean
{
    return tag !== undefined && (tag.type !== "note" || !tag.locked);
}
