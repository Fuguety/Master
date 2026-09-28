import type {
    Map as MapLibreMap,
    MapGeoJSONFeature,
    MapMouseEvent,
    MapTouchEvent,
    PointLike,
} from "maplibre-gl";
import type { Coordinates } from "../types";
import {
    getNearestWrappedLongitude,
    normalizeCoordinates,
} from "../utils/geoCoordinates";
import {
    COUNTRY_HIT_LAYER_ID,
    TAG_CLUSTER_LAYER_ID,
    TAG_POINT_LAYER_ID,
} from "./layerIds";
import type { CountryOverlayManager } from "./CountryOverlayManager";
import type { MapInteractionCallbacks } from "./types";
import type { TagLayerManager } from "./TagLayerManager";
import { getStringFeatureProperty } from "./featureProperties";
import { canDragMapTag } from "./noteMarker";
import type { TagPreviewManager } from "./TagPreviewManager";

/**
 * Owns the map's pointer listeners and marker-drag lifecycle.
 * Used once per live map to avoid repeated listeners and stale React callbacks.
 */
export class MapInteractionManager
{
    private readonly map: MapLibreMap;
    private readonly tagLayers: TagLayerManager;
    private readonly countryLayers: CountryOverlayManager;
    private readonly previews: TagPreviewManager;
    private callbacks: MapInteractionCallbacks = {};
    private countryInteractionEnabled = false;
    private countryHoverEnabled = false;
    private draggedTagId: string | null = null;
    private latestDragCoordinates: Coordinates | null = null;
    private markerMoved = false;
    private suppressedClick: { coordinates: Coordinates; expiresAt: number } | null = null;
    private dragPanWasEnabled = true;
    private dragAnchorOffset: { x: number; y: number } | null = null;
    private dragStartPoint: { x: number; y: number } | null = null;
    private dragInputType: "mouse" | "touch" = "mouse";
    private moveIsPending = false;
    private isDestroyed = false;

    /**
     * Creates a coordinated interaction manager for tag and country layers.
     * Used by the map controller hook before registering listeners.
     */
    public constructor(
        map: MapLibreMap,
        tagLayers: TagLayerManager,
        countryLayers: CountryOverlayManager,
        previews: TagPreviewManager,
    )
    {
        this.map = map;
        this.tagLayers = tagLayers;
        this.countryLayers = countryLayers;
        this.previews = previews;
    }

    /**
     * Registers all map listeners exactly once.
     * Used after map creation and paired with destroy during React cleanup.
     */
    public initialize(): void
    {
        this.map.on("click", this.handleClick);
        this.map.on("mousedown", this.handleMouseDown);
        this.map.on("mousemove", this.handleMouseMove);
        this.map.on("mouseup", this.handlePointerEnd);
        this.map.on("touchstart", this.handleTouchStart);
        this.map.on("touchmove", this.handleTouchMove);
        this.map.on("touchend", this.handlePointerEnd);
        this.map.on("mouseout", this.handleMouseOut);
        window.addEventListener("mouseup", this.handleWindowPointerEnd);
        window.addEventListener("touchend", this.handleWindowPointerEnd);
        window.addEventListener("touchcancel", this.handleWindowPointerCancel);
    }

    /**
     * Removes every listener and restores drag-pan state.
     * Used when the map component unmounts to prevent memory leaks.
     */
    public destroy(): void
    {
        this.map.off("click", this.handleClick);
        this.map.off("mousedown", this.handleMouseDown);
        this.map.off("mousemove", this.handleMouseMove);
        this.map.off("mouseup", this.handlePointerEnd);
        this.map.off("touchstart", this.handleTouchStart);
        this.map.off("touchmove", this.handleTouchMove);
        this.map.off("touchend", this.handlePointerEnd);
        this.map.off("mouseout", this.handleMouseOut);
        window.removeEventListener("mouseup", this.handleWindowPointerEnd);
        window.removeEventListener("touchend", this.handleWindowPointerEnd);
        window.removeEventListener("touchcancel", this.handleWindowPointerCancel);
        void this.finishMarkerDrag(false);
        this.previews.hide();
        this.isDestroyed = true;
    }

    /**
     * Replaces React callbacks without re-registering map listeners.
     * Used whenever parent props change.
     */
    public setCallbacks(callbacks: MapInteractionCallbacks): void
    {
        this.callbacks = callbacks;
    }

    /**
     * Changes whether clicks select countries instead of creating tags.
     * Used by the map's explicit country-selection mode.
     */
    public setCountryInteractionEnabled(enabled: boolean): void
    {
        this.countryInteractionEnabled = enabled;
    }

    /**
     * Enables discoverability hover only for highlighted-country browsing.
     * Used by the map controller and disabled during creation or highlight editing.
     */
    public setCountryHoverEnabled(enabled: boolean): void
    {
        this.countryHoverEnabled = enabled;

        if (!enabled)
        {
            this.countryLayers.setHoveredCountryCode(null);
        }
    }

    /**
     * Resolves cluster expansion, tag details, country selection, or map creation clicks.
     * Used by the single global MapLibre click listener.
     */
    private readonly handleClick = (event: MapMouseEvent): void =>
    {
        if (this.shouldSuppressClick(event))
        {
            return;
        }

        this.previews.hide();

        const clusterFeature = this.queryFirstFeature(event.point, TAG_CLUSTER_LAYER_ID);

        if (clusterFeature)
        {
            void this.tagLayers.expandCluster(clusterFeature);
            return;
        }

        const tagFeature = this.queryFirstFeature(event.point, TAG_POINT_LAYER_ID);
        const tagId = getStringFeatureProperty(tagFeature, "id");

        if (typeof tagId === "string")
        {
            const tag = this.tagLayers.getTag(tagId);

            if (tag)
            {
                this.callbacks.onTagClick?.(tag);
                return;
            }
        }

        if (this.countryInteractionEnabled)
        {
            const countryFeature = this.queryFirstFeature(event.point, COUNTRY_HIT_LAYER_ID);
            const selection = countryFeature ? this.countryLayers.getSelection(countryFeature) : null;

            if (selection)
            {
                this.callbacks.onCountryClick?.({
                    ...selection,
                    coordinates: normalizeCoordinates({ longitude: event.lngLat.lng, latitude: event.lngLat.lat }),
                });
                return;
            }
        }

        this.callbacks.onMapClick?.(normalizeCoordinates(
        {
            longitude: event.lngLat.lng,
            latitude: event.lngLat.lat,
        }));
    };

    /**
     * Starts a mouse marker drag only for the primary button over an unclustered tag.
     * Used by the global mousedown listener.
     */
    private readonly handleMouseDown = (event: MapMouseEvent): void =>
    {
        if (event.originalEvent.button !== 0)
        {
            return;
        }

        this.tryStartMarkerDrag(event.point, "mouse");
    };

    /**
     * Updates marker drag preview or hover cursor for mouse input.
     * Used by the global mousemove listener.
     */
    private readonly handleMouseMove = (event: MapMouseEvent): void =>
    {
        if (this.draggedTagId !== null)
        {
            this.updateMarkerDrag(event.point);
            return;
        }

        const tagFeature = this.queryFirstFeature(event.point, TAG_POINT_LAYER_ID);
        const hoveredTagId = getStringFeatureProperty(tagFeature, "id");

        if (typeof hoveredTagId === "string")
        {
            this.previews.show(hoveredTagId, "pointer");
        }
        else
        {
            this.previews.hide("pointer");
        }

        const countryFeature = this.countryInteractionEnabled
            ? this.queryFirstFeature(event.point, COUNTRY_HIT_LAYER_ID)
            : null;
        const countrySelection = countryFeature === null ? null : this.countryLayers.getSelection(countryFeature);

        this.countryLayers.setHoveredCountryCode(
            this.countryHoverEnabled ? countrySelection?.countryCode ?? null : null,
        );

        const isInteractive = tagFeature !== null
            || this.queryFirstFeature(event.point, TAG_CLUSTER_LAYER_ID) !== null
            || countrySelection !== null;

        this.map.getCanvas().style.cursor = isInteractive ? "pointer" : "";
    };

    /**
     * Starts a touch drag when one finger begins directly on an unclustered tag.
     * Used by the global touchstart listener while retaining normal map gestures elsewhere.
     */
    private readonly handleTouchStart = (event: MapTouchEvent): void =>
    {
        if (event.originalEvent.touches.length !== 1)
        {
            return;
        }

        this.tryStartMarkerDrag(event.point, "touch");
    };

    /**
     * Updates a touch marker drag and prevents the page from scrolling mid-drag.
     * Used by the global touchmove listener.
     */
    private readonly handleTouchMove = (event: MapTouchEvent): void =>
    {
        if (this.draggedTagId === null)
        {
            this.previews.hide("pointer");
            return;
        }

        if (event.originalEvent.touches.length !== 1)
        {
            void this.finishMarkerDrag(false);
            return;
        }

        event.preventDefault();
        this.updateMarkerDrag(event.point);
    };

    /**
     * Commits a completed mouse or touch drag.
     * Used by mouseup and touchend listeners.
     */
    private readonly handlePointerEnd = (): void =>
    {
        if (this.draggedTagId !== null)
        {
            void this.finishMarkerDrag(true);
        }
    };

    /**
     * Commits a drag released outside the MapLibre canvas.
     * Used by window-level mouse and touch cleanup listeners.
     */
    private readonly handleWindowPointerEnd = (): void =>
    {
        if (this.draggedTagId !== null)
        {
            void this.finishMarkerDrag(true);
        }
    };

    /**
     * Cancels an interrupted touch gesture and restores canonical marker data.
     * Used when the browser emits touchcancel.
     */
    private readonly handleWindowPointerCancel = (): void =>
    {
        if (this.draggedTagId !== null)
        {
            void this.finishMarkerDrag(false);
        }
    };

    /**
     * Clears a stale hover cursor when the pointer leaves the map canvas.
     * Used by the map mouseout listener.
     */
    private readonly handleMouseOut = (): void =>
    {
        if (this.draggedTagId === null)
        {
            this.previews.hide("pointer");
            this.countryLayers.setHoveredCountryCode(null);
            this.map.getCanvas().style.cursor = "";
        }
    };

    /**
     * Attempts to resolve a tag at a screen point and enters marker drag mode.
     * Used by mouse and touch drag starts.
     */
    private tryStartMarkerDrag(
        point: { x: number; y: number },
        inputType: "mouse" | "touch",
    ): void
    {
        if (this.moveIsPending)
        {
            return;
        }

        this.previews.hide();

        const feature = this.queryFirstFeature([point.x, point.y], TAG_POINT_LAYER_ID);
        const tagId = getStringFeatureProperty(feature, "id");

        if (typeof tagId !== "string")
        {
            return;
        }

        const tag = this.tagLayers.getTag(tagId);

        if (!canDragMapTag(tag))
        {
            this.map.getCanvas().style.cursor = "not-allowed";
            return;
        }

        const geometry = feature?.geometry;

        if (geometry?.type !== "Point")
        {
            return;
        }

        const longitude = geometry.coordinates[0];
        const latitude = geometry.coordinates[1];

        if (!Number.isFinite(longitude) || !Number.isFinite(latitude))
        {
            return;
        }

        const pointerLocation = this.map.unproject([point.x, point.y]);
        const displayedLongitude = getNearestWrappedLongitude(
            longitude ?? 0,
            pointerLocation.lng,
        );
        const markerAnchor = this.map.project([displayedLongitude, latitude ?? 0]);

        this.draggedTagId = tagId;
        this.latestDragCoordinates = normalizeCoordinates({
            longitude: longitude ?? 0,
            latitude: latitude ?? 0,
        });
        this.dragAnchorOffset = {
            x: markerAnchor.x - point.x,
            y: markerAnchor.y - point.y,
        };
        this.dragStartPoint = { x: point.x, y: point.y };
        this.dragInputType = inputType;
        this.markerMoved = false;
        this.dragPanWasEnabled = this.map.dragPan.isEnabled();
        this.map.dragPan.disable();
        this.map.getCanvas().style.cursor = "grabbing";
    }

    /**
     * Moves the in-map drag preview and remembers normalized final coordinates.
     * Used on every mouse or touch move during a marker drag.
     */
    private updateMarkerDrag(point: { x: number; y: number }): void
    {
        if (
            this.draggedTagId === null
            || this.dragAnchorOffset === null
            || this.dragStartPoint === null
        )
        {
            return;
        }

        const movementDistance = Math.hypot(
            point.x - this.dragStartPoint.x,
            point.y - this.dragStartPoint.y,
        );
        const movementThreshold = this.dragInputType === "touch" ? 10 : 4;

        if (!this.markerMoved && movementDistance < movementThreshold)
        {
            return;
        }

        const markerLocation = this.map.unproject([
            point.x + this.dragAnchorOffset.x,
            point.y + this.dragAnchorOffset.y,
        ]);
        this.latestDragCoordinates = normalizeCoordinates({
            longitude: markerLocation.lng,
            latitude: markerLocation.lat,
        });
        this.markerMoved = true;
        this.tagLayers.previewTagCoordinates(this.draggedTagId, this.latestDragCoordinates);
    }

    /**
     * Leaves marker drag mode and optionally sends the final move to the parent.
     * Used by pointer completion and controller cleanup.
     */
    private async finishMarkerDrag(commit: boolean): Promise<void>
    {
        const tagId = this.draggedTagId;
        const coordinates = this.latestDragCoordinates;
        const shouldCommit = commit && this.markerMoved && tagId !== null && coordinates !== null;

        if (this.dragPanWasEnabled)
        {
            this.map.dragPan.enable();
        }

        this.map.getCanvas().style.cursor = "";
        this.draggedTagId = null;
        this.latestDragCoordinates = null;
        this.dragAnchorOffset = null;
        this.dragStartPoint = null;
        const clickSuppressionDuration = this.dragInputType === "touch" ? 400 : 60;
        this.suppressedClick = shouldCommit
            ? { coordinates, expiresAt: performance.now() + clickSuppressionDuration }
            : null;
        this.dragInputType = "mouse";

        if (!shouldCommit)
        {
            this.tagLayers.restoreTagCoordinates();
            return;
        }

        const moveTag = this.callbacks.onTagMove;

        if (moveTag === undefined)
        {
            this.tagLayers.restoreTagCoordinates();
            return;
        }

        this.moveIsPending = true;

        try
        {
            const didPersist = await moveTag(tagId, coordinates);

            if (!this.isDestroyed)
            {
                if (didPersist)
                {
                    this.tagLayers.commitTagCoordinates(tagId, coordinates);
                }
                else
                {
                    this.tagLayers.restoreTagCoordinates();
                }
            }
        }
        catch
        {
            if (!this.isDestroyed)
            {
                this.tagLayers.restoreTagCoordinates();
            }
        }
        finally
        {
            this.moveIsPending = false;
        }
    }

    /**
     * Suppresses only the synthetic click emitted at the completed drag location.
     * Used by click routing without swallowing a later genuine click elsewhere.
     */
    private shouldSuppressClick(event: MapMouseEvent): boolean
    {
        const suppressedClick = this.suppressedClick;
        this.suppressedClick = null;

        if (suppressedClick === null || performance.now() > suppressedClick.expiresAt)
        {
            return false;
        }

        const releasePoint = this.map.project([
            getNearestWrappedLongitude(
                suppressedClick.coordinates.longitude,
                this.map.getCenter().lng,
            ),
            suppressedClick.coordinates.latitude,
        ]);
        const horizontalDistance = event.point.x - releasePoint.x;
        const verticalDistance = event.point.y - releasePoint.y;

        return Math.hypot(horizontalDistance, verticalDistance) <= 12;
    }

    /**
     * Safely queries one rendered feature only when its style layer exists.
     * Used by all interaction routing to tolerate style transitions and network failure.
     */
    private queryFirstFeature(point: PointLike, layerId: string): MapGeoJSONFeature | null
    {
        if (!this.map.getLayer(layerId))
        {
            return null;
        }

        return this.map.queryRenderedFeatures(point, { layers: [layerId] })[0] ?? null;
    }
}
