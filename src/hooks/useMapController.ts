import { useCallback, useEffect, useRef, type RefObject } from "react";
import {
    AttributionControl,
    Map as MapLibreMap,
    NavigationControl,
    ScaleControl,
    type ErrorEvent,
} from "maplibre-gl";
import type { Coordinates, CountryOverlay, MapTag } from "../types";
import { CountryOverlayManager } from "../map/CountryOverlayManager";
import { MapInteractionManager } from "../map/MapInteractionManager";
import { getMapStyle, type MapStyleId } from "../map/mapStyles";
import { createMapOptions } from "../map/mapOptions";
import { TagLayerManager } from "../map/TagLayerManager";
import type { MapCameraTarget, MapControlInsets, MapErrorDetails, MapInteractionCallbacks, MapViewport } from "../map/types";
import { normalizeCoordinates } from "../utils/geoCoordinates";
import { createLocationCameraOptions } from "../map/camera";
import { TagPreviewManager, type TagPreviewSource } from "../map/TagPreviewManager";
import { TAG_POINT_LAYER_ID } from "../map/layerIds";
import { getStringFeatureProperty } from "../map/featureProperties";
import { createDraftMarker, type DraftMarker } from "../map/draftMarker";

export interface UseMapControllerOptions extends MapInteractionCallbacks
{
    tags: readonly MapTag[];
    countryOverlays: readonly CountryOverlay[];
    clusteringEnabled: boolean;
    styleId: MapStyleId;
    selectedTagId: string | null;
    selectedCountryCode: string | null;
    countrySelectionEnabled: boolean;
    highlightedCountryInteractionEnabled: boolean;
    cameraTarget: MapCameraTarget | null;
    controlInsets: Partial<MapControlInsets>;
    previewCoordinates: Coordinates | null;
    openTagIds: readonly string[];
    initialViewport: MapViewport;
    onViewportChange?: ((viewport: MapViewport) => void) | undefined;
    onError?: ((details: MapErrorDetails) => void) | undefined;
    onUnclusteredTagIdsChange?: ((tagIds: string[]) => void) | undefined;
}

export interface UseMapControllerResult
{
    containerRef: RefObject<HTMLDivElement | null>;
    mapRef: RefObject<MapLibreMap | null>;
    hideTagPreview: (source?: TagPreviewSource) => void;
    showTagPreview: (tagId: string, source: TagPreviewSource) => void;
}



/**
 * Reports a MapLibre error through the current React callback without throwing from events.
 * Used by the map controller's stable error listener.
 * Produces a concise message and retains the original error as its cause.
 */
function reportMapError(errorEvent: ErrorEvent, callback?: (details: MapErrorDetails) => void): void
{
    const cause = errorEvent.error;
    const message = cause instanceof Error ? cause.message : "A map resource could not be loaded.";

    callback?.({ message, cause });
}



/**
 * Creates and synchronizes one MapLibre instance with React-owned map data.
 * Used by the full-screen WorldMap component.
 * Returns stable container and map refs while cleaning controls and listeners on unmount.
 */
export function useMapController(options: UseMapControllerOptions): UseMapControllerResult
{
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const tagLayersRef = useRef<TagLayerManager | null>(null);
    const countryLayersRef = useRef<CountryOverlayManager | null>(null);
    const interactionsRef = useRef<MapInteractionManager | null>(null);
    const previewsRef = useRef<TagPreviewManager | null>(null);
    const previewMarkerRef = useRef<DraftMarker | null>(null);
    const activeStyleIdRef = useRef<MapStyleId>(options.styleId);
    const lastCameraRequestIdRef = useRef<number | null>(null);
    const onErrorRef = useRef(options.onError);
    const onViewportChangeRef = useRef(options.onViewportChange);
    const onUnclusteredTagIdsChangeRef = useRef(options.onUnclusteredTagIdsChange);

    onErrorRef.current = options.onError;
    onViewportChangeRef.current = options.onViewportChange;
    onUnclusteredTagIdsChangeRef.current = options.onUnclusteredTagIdsChange;

    useEffect(() =>
    {
        const container = containerRef.current;

        if (container === null)
        {
            return undefined;
        }

        const map = new MapLibreMap(createMapOptions(
            container,
            getMapStyle(activeStyleIdRef.current),
            options.initialViewport,
        ));
        const tagLayers = new TagLayerManager(map);
        const countryLayers = new CountryOverlayManager(map);
        const previews = new TagPreviewManager(map, (tagId) => tagLayers.getTag(tagId));
        const interactions = new MapInteractionManager(map, tagLayers, countryLayers, previews);

        mapRef.current = map;
        tagLayersRef.current = tagLayers;
        countryLayersRef.current = countryLayers;
        interactionsRef.current = interactions;
        previewsRef.current = previews;

        tagLayers.setTags(options.tags);
        tagLayers.setClusteringEnabled(options.clusteringEnabled);
        tagLayers.setSelectedTagId(options.selectedTagId);
        countryLayers.setOverlays(options.countryOverlays);
        countryLayers.setSelectedCountryCode(options.selectedCountryCode);
        countryLayers.setSelectionEnabled(options.countrySelectionEnabled);
        countryLayers.setHighlightInteractionEnabled(options.highlightedCountryInteractionEnabled);
        interactions.setCallbacks(options);
        interactions.setCountryInteractionEnabled(
            options.countrySelectionEnabled || options.highlightedCountryInteractionEnabled,
        );
        interactions.setCountryHoverEnabled(
            options.highlightedCountryInteractionEnabled && !options.countrySelectionEnabled,
        );
        previews.setSuppressedTagIds(options.openTagIds);
        interactions.initialize();

        map.addControl(new NavigationControl({ showCompass: false, visualizePitch: false }), "top-right");
        map.addControl(new ScaleControl({ maxWidth: 110, unit: "metric" }), "bottom-right");
        map.addControl(new AttributionControl({ compact: true }), "bottom-left");

        /**
         * Restores application-owned layers after a base style is ready.
         * Used for initial load and each style switch.
         */
        function handleStyleLoad(): void
        {
            previews.hide();
            map.setRenderWorldCopies(true);
            countryLayers.install();
            tagLayers.install();
        }

        /**
         * Reports unique rendered unclustered symbols for keyboard marker navigation.
         * Used from one stable idle listener after clustering and collision placement settle.
         */
        function handleIdle(): void
        {
            if (!map.getLayer(TAG_POINT_LAYER_ID))
            {
                onUnclusteredTagIdsChangeRef.current?.([]);
                return;
            }

            const tagIds = [...new Set(map.queryRenderedFeatures({ layers: [TAG_POINT_LAYER_ID] })
                .map((feature) => getStringFeatureProperty(feature, "id"))
                .filter((tagId): tagId is string => typeof tagId === "string"))];
            onUnclusteredTagIdsChangeRef.current?.(tagIds);
        }

        /**
         * Emits a serializable viewport after user navigation settles.
         * Used by optional parent persistence or URL synchronization.
         */
        function handleMoveEnd(): void
        {
            const center = map.getCenter();
            const normalizedCenter = normalizeCoordinates({
                longitude: center.lng,
                latitude: center.lat,
            });

            onViewportChangeRef.current?.(
            {
                longitude: normalizedCenter.longitude,
                latitude: normalizedCenter.latitude,
                zoom: map.getZoom(),
            });
        }

        /**
         * Routes resource and style errors through the latest parent callback.
         * Used by MapLibre's error event.
         */
        function handleError(event: ErrorEvent): void
        {
            reportMapError(event, onErrorRef.current);
        }

        map.on("style.load", handleStyleLoad);
        map.on("moveend", handleMoveEnd);
        map.on("error", handleError);
        map.on("idle", handleIdle);

        return () =>
        {
            interactions.destroy();
            map.off("style.load", handleStyleLoad);
            map.off("moveend", handleMoveEnd);
            map.off("error", handleError);
            map.off("idle", handleIdle);
            previews.destroy();
            map.remove();
            mapRef.current = null;
            tagLayersRef.current = null;
            countryLayersRef.current = null;
            interactionsRef.current = null;
            previewsRef.current = null;
            previewMarkerRef.current?.remove();
            previewMarkerRef.current = null;
        };
        // Initial view is intentionally read only when constructing the map.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() =>
    {
        tagLayersRef.current?.setTags(options.tags);
        previewsRef.current?.reconcile();
    }, [options.tags]);

    useEffect(() =>
    {
        previewsRef.current?.hide();
        tagLayersRef.current?.setClusteringEnabled(options.clusteringEnabled);
    }, [options.clusteringEnabled]);

    useEffect(() =>
    {
        previewsRef.current?.setSuppressedTagIds(options.openTagIds);
    }, [options.openTagIds]);

    useEffect(() =>
    {
        tagLayersRef.current?.setSelectedTagId(options.selectedTagId);
    }, [options.selectedTagId]);

    useEffect(() =>
    {
        countryLayersRef.current?.setOverlays(options.countryOverlays);
    }, [options.countryOverlays]);

    useEffect(() =>
    {
        countryLayersRef.current?.setSelectedCountryCode(options.selectedCountryCode);
    }, [options.selectedCountryCode]);

    useEffect(() =>
    {
        countryLayersRef.current?.setSelectionEnabled(options.countrySelectionEnabled);
    }, [options.countrySelectionEnabled]);

    useEffect(() =>
    {
        countryLayersRef.current?.setHighlightInteractionEnabled(options.highlightedCountryInteractionEnabled);
        interactionsRef.current?.setCountryInteractionEnabled(
            options.countrySelectionEnabled || options.highlightedCountryInteractionEnabled,
        );
        interactionsRef.current?.setCountryHoverEnabled(
            options.highlightedCountryInteractionEnabled && !options.countrySelectionEnabled,
        );
    }, [options.countrySelectionEnabled, options.highlightedCountryInteractionEnabled]);

    useEffect(() =>
    {
        interactionsRef.current?.setCallbacks(
        {
            onMapClick: options.onMapClick,
            onTagClick: options.onTagClick,
            onTagMove: options.onTagMove,
            onCountryClick: options.onCountryClick,
        });
    }, [options.onMapClick, options.onTagClick, options.onTagMove, options.onCountryClick]);

    useEffect(() =>
    {
        const map = mapRef.current;

        if (map === null || activeStyleIdRef.current === options.styleId)
        {
            return;
        }

        activeStyleIdRef.current = options.styleId;
        previewsRef.current?.hide();
        map.setStyle(getMapStyle(options.styleId), { diff: false });
    }, [options.styleId]);

    useEffect(() =>
    {
        const map = mapRef.current;

        if (map === null)
        {
            return;
        }

        map.stop();

        if (options.cameraTarget === null)
        {
            lastCameraRequestIdRef.current = null;
            return;
        }

        const isNewRequest = lastCameraRequestIdRef.current !== options.cameraTarget.requestId;
        lastCameraRequestIdRef.current = options.cameraTarget.requestId;
        const isDraft = options.cameraTarget.intent === "draft";

        map.easeTo(createLocationCameraOptions(
            options.cameraTarget.coordinates,
            map.getCenter().lng,
            map.getZoom(),
            window.matchMedia("(prefers-reduced-motion: reduce)").matches,
            options.controlInsets,
            isDraft ? 5.5 : 7,
            isDraft && isNewRequest ? 0.8 : 0,
        ));
    }, [options.cameraTarget, options.controlInsets]);

    useEffect(() =>
    {
        const map = mapRef.current;

        if (map === null || options.previewCoordinates === null)
        {
            previewMarkerRef.current?.remove();
            previewMarkerRef.current = null;
            return;
        }

        const coordinates: [number, number] = [
            options.previewCoordinates.longitude,
            options.previewCoordinates.latitude,
        ];
        const existingMarker = previewMarkerRef.current;

        if (existingMarker !== null)
        {
            existingMarker.setLngLat(coordinates);
            return;
        }

        const marker = createDraftMarker(map, options.previewCoordinates);
        previewMarkerRef.current = marker;
    }, [options.previewCoordinates]);

    const showTagPreview = useCallback((tagId: string, source: TagPreviewSource): void =>
    {
        previewsRef.current?.show(tagId, source);
    }, []);
    const hideTagPreview = useCallback((source?: TagPreviewSource): void =>
    {
        previewsRef.current?.hide(source);
    }, []);

    return { containerRef, mapRef, hideTagPreview, showTagPreview };
}
