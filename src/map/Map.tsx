import { useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMapController } from "../hooks/useMapController";
import type { MapInsetStyle, MapViewport, WorldMapProps } from "./types";
import { MapStyleSwitcher } from "./MapStyleSwitcher";
import type { MapStyleId } from "./mapStyles";
import styles from "./Map.module.css";
import { KeyboardMarkerNavigator } from "./KeyboardMarkerNavigator";

const DEFAULT_VIEWPORT: MapViewport =
{
    longitude: 8,
    latitude: 20,
    zoom: 1.65,
};



/**
 * Resolves partial initial camera values into a complete stable viewport.
 * Used before constructing MapLibre so absent values receive world-map defaults.
 */
function resolveInitialViewport(initialViewport: WorldMapProps["initialViewport"]): MapViewport
{
    return {
        longitude: initialViewport?.longitude ?? DEFAULT_VIEWPORT.longitude,
        latitude: initialViewport?.latitude ?? DEFAULT_VIEWPORT.latitude,
        zoom: initialViewport?.zoom ?? DEFAULT_VIEWPORT.zoom,
    };
}



/**
 * Converts panel-safe-area props into CSS custom properties for map controls.
 * Used by the map shell to avoid collisions with surrounding application panels.
 */
function resolveInsetStyle(controlInsets: WorldMapProps["controlInsets"]): MapInsetStyle
{
    return {
        "--map-inset-top": `${controlInsets?.top ?? 0}px`,
        "--map-inset-right": `${controlInsets?.right ?? 0}px`,
        "--map-inset-bottom": `${controlInsets?.bottom ?? 0}px`,
        "--map-inset-left": `${controlInsets?.left ?? 0}px`,
    };
}



/**
 * Renders the full-screen flat world map and its accessible style control.
 * Used as the primary geographic canvas for clustered tags and country overlays.
 */
export function WorldMap(props: WorldMapProps)
{
    const [localStyleId, setLocalStyleId] = useState<MapStyleId>(props.initialStyleId ?? "cartographic");
    const activeStyleId = props.styleId ?? localStyleId;
    const initialViewport = resolveInitialViewport(props.initialViewport);
    const [unclusteredTagIds, setUnclusteredTagIds] = useState<string[]>([]);
    const { containerRef, hideTagPreview, showTagPreview } = useMapController(
    {
        tags: props.tags,
        countryOverlays: props.countryOverlays,
        clusteringEnabled: props.clusteringEnabled ?? true,
        styleId: activeStyleId,
        selectedTagId: props.selectedTagId ?? null,
        selectedCountryCode: props.selectedCountryCode ?? null,
        countrySelectionEnabled: props.countrySelectionEnabled ?? false,
        highlightedCountryInteractionEnabled: props.highlightedCountryInteractionEnabled ?? true,
        cameraTarget: props.cameraTarget ?? null,
        controlInsets: props.controlInsets ?? {},
        previewCoordinates: props.previewCoordinates ?? null,
        openTagIds: props.openTagIds ?? [],
        initialViewport,
        onMapClick: props.onMapClick,
        onTagClick: props.onTagClick,
        onTagMove: props.onTagMove,
        onCountryClick: props.onCountryClick,
        onViewportChange: props.onViewportChange,
        onError: props.onError,
        onUnclusteredTagIdsChange: setUnclusteredTagIds,
    });

    /**
     * Updates uncontrolled style state and informs controlled parent consumers.
     * Used by the map style switcher.
     */
    function handleStyleChange(styleId: MapStyleId): void
    {
        setLocalStyleId(styleId);
        props.onStyleChange?.(styleId);
    }

    const rootClassName = props.className
        ? `${styles.root} ${props.className}`
        : styles.root;

    return (
        <section
            aria-busy={props.interactionDisabled ?? false}
            className={rootClassName}
            data-create-tag-mode={props.createTagMode ?? false}
            data-interaction-disabled={props.interactionDisabled ?? false}
            style={resolveInsetStyle(props.controlInsets)}
            aria-label="Interactive world map"
        >
            <div
                ref={containerRef}
                className={styles.canvas}
                role="application"
                aria-label="Map. Use arrow keys to pan and plus or minus to zoom."
            />
            <div className={styles.styleControl}>
                <MapStyleSwitcher activeStyleId={activeStyleId} onChange={handleStyleChange} />
            </div>
            <KeyboardMarkerNavigator
                onBlur={() => hideTagPreview("keyboard")}
                onFocus={(tagId) => showTagPreview(tagId, "keyboard")}
                onSelect={(tag) =>
                {
                    hideTagPreview();
                    props.onTagClick?.(tag);
                }}
                tags={props.tags}
                visibleTagIds={unclusteredTagIds}
            />
            {props.createTagMode ? (
                <p aria-live="polite" className={styles.creationIndicator}>Create Tag Mode · Click the map to place · Esc to cancel</p>
            ) : null}
        </section>
    );
}
