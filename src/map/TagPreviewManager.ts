import { Popup, type Map as MapLibreMap } from "maplibre-gl";
import type { MapTag } from "../types";
import { getNearestWrappedLongitude } from "../utils/geoCoordinates";
import { formatRating, formatRatingStars } from "../utils/ratingFormat";

export type TagPreviewSource = "keyboard" | "pointer";

interface PreviewPopup
{
    addTo: (map: MapLibreMap) => PreviewPopup;
    remove: () => PreviewPopup;
    setDOMContent: (element: Node) => PreviewPopup;
    setLngLat: (coordinates: [number, number]) => PreviewPopup;
}

type PreviewPopupFactory = () => PreviewPopup;

/**
 * Creates safe DOM content for one compact marker preview.
 * Used by the MapLibre popup manager and unit tests without rendering user HTML.
 */
export function createTagPreviewElement(tag: MapTag, locale?: string): HTMLElement
{
    const container = document.createElement("div");
    container.className = "atlas-tag-preview__body";
    const title = document.createElement("strong");
    title.className = "atlas-tag-preview__title";
    title.textContent = tag.name;
    container.append(title);

    if (tag.type !== "note")
    {
        const details = document.createElement("span");
        details.className = "atlas-tag-preview__details";
        const typeLabel = tag.type === "university" ? "University" : "Company";
        details.textContent = `${typeLabel} · ${formatRatingStars(tag.finalRating)} ${formatRating(tag.finalRating, locale)}/5`;
        container.append(details);
    }

    return container;
}



/**
 * Owns the single collision-aware MapLibre popup used for marker hover and focus previews.
 * Used by existing map listeners and hides itself when records or interaction state change.
 */
export class TagPreviewManager
{
    private readonly map: MapLibreMap;
    private readonly getTag: (tagId: string) => MapTag | undefined;
    private readonly popup: PreviewPopup;
    private currentSource: TagPreviewSource | null = null;
    private currentTagId: string | null = null;
    private suppressedTagIds = new Set<string>();

    /**
     * Creates one reusable popup for a live map.
     * Used once by the map controller; the optional factory supports isolated tests.
     */
    public constructor(
        map: MapLibreMap,
        getTag: (tagId: string) => MapTag | undefined,
        popupFactory: PreviewPopupFactory = () => new Popup({
            anchor: undefined,
            className: "atlas-tag-preview",
            closeButton: false,
            closeOnClick: false,
            focusAfterOpen: false,
            maxWidth: "none",
            offset: 18,
        }),
    )
    {
        this.map = map;
        this.getTag = getTag;
        this.popup = popupFactory();
    }

    /**
     * Shows a typed record preview on the wrapped marker nearest the current camera.
     * Used by pointer hover and the accessible keyboard marker navigator.
     */
    public show(tagId: string, source: TagPreviewSource): void
    {
        const tag = this.getTag(tagId);

        if (tag === undefined || this.suppressedTagIds.has(tagId))
        {
            this.hide();
            return;
        }

        if (this.currentTagId === tagId && this.currentSource === source)
        {
            return;
        }

        const longitude = getNearestWrappedLongitude(tag.coordinates.longitude, this.map.getCenter().lng);
        this.popup
            .setDOMContent(createTagPreviewElement(tag))
            .setLngLat([longitude, tag.coordinates.latitude])
            .addTo(this.map);
        this.currentTagId = tagId;
        this.currentSource = source;
    }

    /**
     * Hides the current preview, optionally only when it came from one interaction source.
     * Used by pointer leave, keyboard blur, drag, style, clustering, and detail-open cleanup.
     */
    public hide(source?: TagPreviewSource): void
    {
        if (source !== undefined && source !== this.currentSource)
        {
            return;
        }

        this.popup.remove();
        this.currentTagId = null;
        this.currentSource = null;
    }

    /**
     * Prevents previews for records whose complete detail window is already open.
     * Used whenever floating-window state changes and immediately cleans stale previews.
     */
    public setSuppressedTagIds(tagIds: readonly string[]): void
    {
        this.suppressedTagIds = new Set(tagIds);

        if (this.currentTagId !== null && this.suppressedTagIds.has(this.currentTagId))
        {
            this.hide();
        }
    }

    /**
     * Removes a preview whose backing record disappeared after deletion or filtering.
     * Used after the typed tag lookup is refreshed.
     */
    public reconcile(): void
    {
        if (this.currentTagId !== null && this.getTag(this.currentTagId) === undefined)
        {
            this.hide();
        }
    }

    /**
     * Releases the reusable popup during map teardown.
     * Used by the map controller cleanup path.
     */
    public destroy(): void
    {
        this.hide();
    }
}
