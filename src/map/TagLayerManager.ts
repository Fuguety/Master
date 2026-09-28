import { GeoJSONSource, type Map as MapLibreMap, type MapGeoJSONFeature } from "maplibre-gl";
import type { Point } from "geojson";
import type { Coordinates, MapTag } from "../types";
import { tagsToFeatureCollection } from "../utils/geoJson";
import { getNearestWrappedLongitude } from "../utils/geoCoordinates";
import {
    COMPANY_ICON_ID,
    TAG_CLUSTER_COUNT_LAYER_ID,
    TAG_CLUSTER_LAYER_ID,
    TAG_POINT_LAYER_ID,
    TAG_SELECTED_LAYER_ID,
    TAG_SOURCE_ID,
    UNIVERSITY_ICON_ID,
    NOTE_ICON_ID,
    NOTE_LOCKED_LAYER_ID,
} from "./layerIds";
import { createTagIcon } from "./tagIcons";

/**
 * Owns the clustered tag source and its visual layers.
 * Used by the map hook so tag updates and style reloads share one implementation.
 */
export class TagLayerManager
{
    private readonly map: MapLibreMap;
    private tags: readonly MapTag[] = [];
    private readonly tagsById = new globalThis.Map<string, MapTag>();
    private selectedTagId: string | null = null;
    private clusteringEnabled = true;

    /**
     * Creates a layer manager for one live MapLibre instance.
     * Used once by the map controller hook.
     */
    public constructor(map: MapLibreMap)
    {
        this.map = map;
    }

    /**
     * Installs images, the clustered source, and tag layers after a style loads.
     * Used during initial load and every cartographic or satellite style switch.
     */
    public install(): void
    {
        this.installImages();

        if (!this.map.getSource(TAG_SOURCE_ID))
        {
            this.map.addSource(TAG_SOURCE_ID,
            {
                type: "geojson",
                data: tagsToFeatureCollection(this.tags),
                cluster: this.clusteringEnabled,
                clusterMaxZoom: 13,
                clusterRadius: 52,
            });
        }

        this.installClusterLayers();
        this.installPointLayers();
        this.updateSelectedStyle();
    }

    /**
     * Replaces the visible tag dataset and refreshes fast identifier lookup.
     * Used when filters, edits, imports, or scoring updates change visible tags.
     */
    public setTags(tags: readonly MapTag[]): void
    {
        this.tags = tags;
        this.tagsById.clear();

        for (const tag of tags)
        {
            this.tagsById.set(tag.id, tag);
        }

        this.updateSource();
    }

    /**
     * Enables or disables source-level marker clustering without recreating the map.
     * Used by presentation settings while preserving the current tag collection.
     * Rebuilds only application-owned tag layers when the value changes.
     */
    public setClusteringEnabled(clusteringEnabled: boolean): void
    {
        if (this.clusteringEnabled === clusteringEnabled)
        {
            return;
        }

        this.clusteringEnabled = clusteringEnabled;

        if (this.map.getSource(TAG_SOURCE_ID))
        {
            this.removeLayersAndSource();
            this.install();
        }
    }

    /**
     * Returns the complete domain record represented by a rendered point.
     * Used by click and drag interaction handlers.
     */
    public getTag(tagId: string): MapTag | undefined
    {
        return this.tagsById.get(tagId);
    }

    /**
     * Updates the selected marker halo without rebuilding the source.
     * Used when tag details open or close.
     */
    public setSelectedTagId(tagId: string | null): void
    {
        this.selectedTagId = tagId;
        this.updateSelectedStyle();
    }

    /**
     * Temporarily moves a marker in the map source during a pointer drag.
     * Used for immediate visual feedback before the parent persists the final coordinate.
     */
    public previewTagCoordinates(tagId: string, coordinates: Coordinates): void
    {
        const collection = tagsToFeatureCollection(this.tags);
        const feature = collection.features.find((candidate) => candidate.properties.id === tagId);

        if (feature)
        {
            feature.geometry.coordinates = [coordinates.longitude, coordinates.latitude];
            this.setSourceData(collection);
        }
    }

    /**
     * Makes a successfully persisted drag coordinate canonical in the live source.
     * Used after the parent data layer confirms a marker move.
     */
    public commitTagCoordinates(tagId: string, coordinates: Coordinates): void
    {
        this.setTags(this.tags.map((tag) => tag.id === tagId
            ? { ...tag, coordinates }
            : tag));
    }

    /**
     * Reapplies the canonical tag collection after a drag is rejected or fails.
     * Used by marker interaction rollback to prevent unsaved visual positions.
     */
    public restoreTagCoordinates(): void
    {
        this.updateSource();
    }

    /**
     * Expands a clicked marker cluster using the source's calculated expansion zoom.
     * Used by the map click handler and returns after the smooth camera transition starts.
     */
    public async expandCluster(feature: MapGeoJSONFeature): Promise<void>
    {
        const clusterId = Number(feature.properties?.cluster_id);
        const geometry = feature.geometry as Point;
        const source = this.map.getSource(TAG_SOURCE_ID);
        const longitude = geometry.coordinates[0];
        const latitude = geometry.coordinates[1];

        if (
            !Number.isFinite(clusterId)
            || !(source instanceof GeoJSONSource)
            || !Number.isFinite(longitude)
            || !Number.isFinite(latitude)
        )
        {
            return;
        }

        const zoom = await source.getClusterExpansionZoom(clusterId);
        const displayedLongitude = getNearestWrappedLongitude(
            longitude ?? 0,
            this.map.getCenter().lng,
        );

        this.map.easeTo(
        {
            center: [displayedLongitude, latitude ?? 0],
            zoom,
            duration: 450,
        });
    }

    /**
     * Registers programmatically drawn icons with the current style.
     * Used after every style replacement because style images do not persist.
     */
    private installImages(): void
    {
        if (!this.map.hasImage(UNIVERSITY_ICON_ID))
        {
            this.map.addImage(UNIVERSITY_ICON_ID, createTagIcon("university"), { pixelRatio: 2 });
        }

        if (!this.map.hasImage(COMPANY_ICON_ID))
        {
            this.map.addImage(COMPANY_ICON_ID, createTagIcon("company"), { pixelRatio: 2 });
        }

        if (!this.map.hasImage(NOTE_ICON_ID))
        {
            this.map.addImage(NOTE_ICON_ID, createTagIcon("note"), { pixelRatio: 2 });
        }
    }

    /**
     * Adds cluster bubbles and collision-aware count labels.
     * Used internally by style installation.
     */
    private installClusterLayers(): void
    {
        if (!this.map.getLayer(TAG_CLUSTER_LAYER_ID))
        {
            this.map.addLayer(
            {
                id: TAG_CLUSTER_LAYER_ID,
                type: "circle",
                source: TAG_SOURCE_ID,
                filter: ["has", "point_count"],
                paint:
                {
                    "circle-color": ["step", ["get", "point_count"], "#4768df", 25, "#7755bd", 100, "#bb3e70"],
                    "circle-radius": ["step", ["get", "point_count"], 18, 25, 23, 100, 29],
                    "circle-stroke-color": "#ffffff",
                    "circle-stroke-width": 2,
                },
            });
        }

        if (!this.map.getLayer(TAG_CLUSTER_COUNT_LAYER_ID))
        {
            this.map.addLayer(
            {
                id: TAG_CLUSTER_COUNT_LAYER_ID,
                type: "symbol",
                source: TAG_SOURCE_ID,
                filter: ["has", "point_count"],
                layout:
                {
                    "text-field": ["get", "point_count_abbreviated"],
                    "text-font": ["Noto Sans Regular"],
                    "text-size": 12,
                    "text-allow-overlap": false,
                },
                paint:
                {
                    "text-color": "#ffffff",
                },
            });
        }
    }

    /**
     * Adds the selection halo and collision-aware university or company icons.
     * Used internally by style installation.
     */
    private installPointLayers(): void
    {
        if (!this.map.getLayer(TAG_SELECTED_LAYER_ID))
        {
            this.map.addLayer(
            {
                id: TAG_SELECTED_LAYER_ID,
                type: "circle",
                source: TAG_SOURCE_ID,
                filter: ["!", ["has", "point_count"]],
                paint:
                {
                    "circle-color": "rgba(255, 255, 255, 0.25)",
                    "circle-stroke-color": "#ffffff",
                    "circle-stroke-width": 3,
                    "circle-radius": 0,
                },
            });
        }

        if (!this.map.getLayer(TAG_POINT_LAYER_ID))
        {
            this.map.addLayer(
            {
                id: TAG_POINT_LAYER_ID,
                type: "symbol",
                source: TAG_SOURCE_ID,
                filter: ["!", ["has", "point_count"]],
                layout:
                {
                    "icon-image": [
                        "match",
                        ["get", "type"],
                        "university",
                        UNIVERSITY_ICON_ID,
                        "company",
                        COMPANY_ICON_ID,
                        NOTE_ICON_ID,
                    ],
                    "icon-size": 1,
                    "icon-anchor": "bottom",
                    "icon-allow-overlap": false,
                    "icon-ignore-placement": false,
                    "icon-padding": 3,
                },
            });
        }

        if (!this.map.getLayer(NOTE_LOCKED_LAYER_ID))
        {
            this.map.addLayer({
                id: NOTE_LOCKED_LAYER_ID,
                type: "symbol",
                source: TAG_SOURCE_ID,
                filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "type"], "note"], ["==", ["get", "locked"], true]],
                layout: {
                    "text-field": "L",
                    "text-size": 10,
                    "text-offset": [1.2, -3.4],
                    "text-allow-overlap": true,
                },
                paint: {
                    "text-color": "#ffffff",
                    "text-halo-color": "#5c4510",
                    "text-halo-width": 2,
                },
            });
        }
    }

    /**
     * Removes tag layers in dependency order before replacing clustering options.
     * Used internally when the user changes the clustering preference.
     * Leaves registered icons intact because they remain valid for the active style.
     */
    private removeLayersAndSource(): void
    {
        const layerIds = [
            NOTE_LOCKED_LAYER_ID,
            TAG_SELECTED_LAYER_ID,
            TAG_POINT_LAYER_ID,
            TAG_CLUSTER_COUNT_LAYER_ID,
            TAG_CLUSTER_LAYER_ID,
        ];

        for (const layerId of layerIds)
        {
            if (this.map.getLayer(layerId))
            {
                this.map.removeLayer(layerId);
            }
        }

        if (this.map.getSource(TAG_SOURCE_ID))
        {
            this.map.removeSource(TAG_SOURCE_ID);
        }
    }

    /**
     * Pushes the current filtered tags into the live GeoJSON source when available.
     * Used by setTags and safely does nothing while a new style is loading.
     */
    private updateSource(): void
    {
        this.setSourceData(tagsToFeatureCollection(this.tags));
    }

    /**
     * Sends already-built GeoJSON to MapLibre without exposing source casting to callers.
     * Used by regular updates and drag previews.
     */
    private setSourceData(data: ReturnType<typeof tagsToFeatureCollection>): void
    {
        const source = this.map.getSource(TAG_SOURCE_ID);

        if (source instanceof GeoJSONSource)
        {
            source.setData(data);
        }
    }

    /**
     * Applies the selected tag identifier as a data-driven halo radius expression.
     * Used after selection changes and after style reloads.
     */
    private updateSelectedStyle(): void
    {
        if (!this.map.getLayer(TAG_SELECTED_LAYER_ID))
        {
            return;
        }

        this.map.setPaintProperty(
            TAG_SELECTED_LAYER_ID,
            "circle-radius",
            this.selectedTagId === null
                ? 0
                : ["case", ["==", ["get", "id"], this.selectedTagId], 22, 0],
        );
    }
}
