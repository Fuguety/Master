import type { ExpressionSpecification, Map as MapLibreMap, MapGeoJSONFeature } from "maplibre-gl";
import type { CountryOverlay } from "../types";
import type { CountrySelection } from "./types";
import {
    COUNTRY_FILL_LAYER_ID,
    COUNTRY_HIT_LAYER_ID,
    COUNTRY_HOVER_FILL_LAYER_ID,
    COUNTRY_HOVER_OUTLINE_LAYER_ID,
    COUNTRY_OUTLINE_LAYER_ID,
    COUNTRY_SELECTED_LAYER_ID,
    COUNTRY_SOURCE_ID,
} from "./layerIds";

const OPEN_COUNTRY_DATA_URL =
    "https://cdn.jsdelivr.net/gh/datasets/geo-countries@185beb1137f6e9f5d916c91916f0159c20fbab30/data/countries.geojson";
const FALLBACK_OVERLAY_COLOR = "#4f7cff";

const COUNTRY_CODE_BY_NAME: Readonly<Record<string, string>> =
{
    "Dhekelia Sovereign Base Area": "GBR",
    Somaliland: "SOM",
    France: "FRA",
    Norway: "NOR",
    Kosovo: "XKX",
    "US Naval Base Guantanamo Bay": "CUB",
    "Brazilian Island": "BRA",
    "Northern Cyprus": "CYP",
    "Cyprus No Mans Area": "CYP",
    "Baykonur Cosmodrome": "KAZ",
    "Akrotiri Sovereign Base Area": "GBR",
    "Indian Ocean Territories": "IOT",
    "Coral Sea Islands": "AUS",
    "Clipperton Island": "FRA",
    "Ashmore and Cartier Islands": "AUS",
};

const PROVIDER_COUNTRY_CODE_EXPRESSION: ExpressionSpecification =
[
    "upcase",
    [
        "coalesce",
        ["get", "ISO3166-1-Alpha-3"],
        ["get", "ISO_A3"],
        ["get", "iso_a3"],
        ["get", "ADM0_A3"],
        ["get", "countryCode"],
        "",
    ],
];

const COUNTRY_NAME_CODE_EXPRESSION =
[
    "match",
    ["get", "name"],
    ...Object.entries(COUNTRY_CODE_BY_NAME).flatMap(([name, countryCode]) => [name, countryCode]),
    "",
] as unknown as ExpressionSpecification;

const COUNTRY_CODE_EXPRESSION: ExpressionSpecification =
[
    "let",
    "providerCountryCode",
    PROVIDER_COUNTRY_CODE_EXPRESSION,
    [
        "case",
        ["in", ["var", "providerCountryCode"], ["literal", ["", "-99"]]],
        COUNTRY_NAME_CODE_EXPRESSION,
        ["var", "providerCountryCode"],
    ],
];

/**
 * Converts an arbitrary country color into a safe MapLibre paint value.
 * Used when imported overlay settings are translated into style expressions.
 * Returns a conservative blue when a value is not a supported CSS hex color.
 */
function sanitizeOverlayColor(color: string): string
{
    return /^#[0-9a-f]{6}$/iu.test(color) ? color : FALLBACK_OVERLAY_COLOR;
}



/**
 * Restricts imported overlay opacity to the valid MapLibre interval.
 * Used by country fill expression generation.
 * Returns a finite number from zero through one.
 */
function sanitizeOverlayOpacity(opacity: number): number
{
    if (!Number.isFinite(opacity))
    {
        return 0.35;
    }

    return Math.max(0, Math.min(1, opacity));
}



/**
 * Builds a data-driven match expression for one country-overlay property.
 * Used by country fill color and opacity paint configuration.
 * The provided selector extracts the desired value from each visible overlay.
 */
function createCountryMatchExpression<T extends string | number>(
    overlays: readonly CountryOverlay[],
    selectValue: (overlay: CountryOverlay) => T,
    fallback: T,
): ExpressionSpecification
{
    if (overlays.length === 0)
    {
        return ["match", COUNTRY_CODE_EXPRESSION, "__atlas_no_country__", fallback, fallback];
    }

    const expression: unknown[] = ["match", COUNTRY_CODE_EXPRESSION];

    for (const overlay of overlays)
    {
        expression.push(overlay.countryCode.toUpperCase(), selectValue(overlay));
    }

    expression.push(fallback);

    return expression as ExpressionSpecification;
}

/**
 * Owns open country geometry and user-configurable highlight layers.
 * Used by the map controller to preserve overlay behavior across base-style switches.
 */
export class CountryOverlayManager
{
    private readonly map: MapLibreMap;
    private overlays: readonly CountryOverlay[] = [];
    private selectedCountryCode: string | null = null;
    private selectionEnabled = false;
    private highlightInteractionEnabled = true;
    private hoveredCountryCode: string | null = null;

    /**
     * Creates an overlay manager for one live MapLibre instance.
     * Used once by the map controller hook.
     */
    public constructor(map: MapLibreMap)
    {
        this.map = map;
    }

    /**
     * Installs open country GeoJSON and all fill, outline, selection, and hit layers.
     * Used after every base map style load.
     */
    public install(): void
    {
        if (!this.map.getSource(COUNTRY_SOURCE_ID))
        {
            this.map.addSource(COUNTRY_SOURCE_ID,
            {
                type: "geojson",
                data: OPEN_COUNTRY_DATA_URL,
                generateId: true,
            });
        }

        this.installOverlayLayers();
        this.installSelectionLayers();
        this.updatePaintExpressions();
        this.updateSelectionStyle();
        this.updateInteractionStyle();
    }

    /**
     * Replaces country presentation settings without reloading country geometry.
     * Used by edits, imports, and visibility toggles.
     */
    public setOverlays(overlays: readonly CountryOverlay[]): void
    {
        this.overlays = overlays;
        this.updatePaintExpressions();
        this.updateInteractionStyle();
    }

    /**
     * Changes the country emphasized by the high-contrast selection outline.
     * Used by country lists and map clicks.
     */
    public setSelectedCountryCode(countryCode: string | null): void
    {
        this.selectedCountryCode = countryCode?.toUpperCase() ?? null;
        this.updateSelectionStyle();
    }

    /**
     * Enables or disables the transparent country hit target layer.
     * Used to keep ordinary click-to-create behavior independent from country selection mode.
     */
    public setSelectionEnabled(selectionEnabled: boolean): void
    {
        this.selectionEnabled = selectionEnabled;
        this.updateSelectionStyle();
        this.updateInteractionStyle();
    }

    /**
     * Enables ordinary browsing clicks only for currently visible highlights.
     * Used outside Create Tag Mode without exposing unhighlighted country hit targets.
     */
    public setHighlightInteractionEnabled(enabled: boolean): void
    {
        this.highlightInteractionEnabled = enabled;
        this.updateInteractionStyle();
    }

    /**
     * Emphasizes one highlighted country under the browsing pointer.
     * Used by map interactions and cleared during creation and highlight editing.
     */
    public setHoveredCountryCode(countryCode: string | null): void
    {
        const normalizedCode = countryCode?.toUpperCase() ?? null;

        if (this.hoveredCountryCode === normalizedCode)
        {
            return;
        }

        this.hoveredCountryCode = normalizedCode;

        for (const layerId of [COUNTRY_HOVER_FILL_LAYER_ID, COUNTRY_HOVER_OUTLINE_LAYER_ID])
        {
            if (this.map.getLayer(layerId))
            {
                this.map.setFilter(layerId, ["==", COUNTRY_CODE_EXPRESSION, normalizedCode ?? ""]);
            }
        }
    }

    /**
     * Extracts normalized country identity from a rendered open-data feature.
     * Used by map click interaction callbacks.
     */
    public getSelection(feature: MapGeoJSONFeature): CountrySelection | null
    {
        const rawProperties: unknown = feature.properties;

        if (typeof rawProperties !== "object" || rawProperties === null)
        {
            return null;
        }

        const properties = rawProperties as Record<string, unknown>;
        const rawCountryCode = properties["ISO3166-1-Alpha-3"]
            ?? properties.ISO_A3
            ?? properties.iso_a3
            ?? properties.ADM0_A3
            ?? properties.countryCode;
        const rawCountryName = properties.ADMIN ?? properties.name ?? properties.NAME;

        const providerCountryCode = typeof rawCountryCode === "string"
            ? rawCountryCode.toUpperCase()
            : "";
        const normalizedCountryCode = providerCountryCode === "" || providerCountryCode === "-99"
            ? typeof rawCountryName === "string"
                ? COUNTRY_CODE_BY_NAME[rawCountryName] ?? ""
                : ""
            : providerCountryCode;

        if (!/^[A-Z]{3}$/u.test(normalizedCountryCode))
        {
            return null;
        }

        return {
            countryCode: normalizedCountryCode,
            countryName: typeof rawCountryName === "string" ? rawCountryName : normalizedCountryCode,
        };
    }

    /**
     * Adds user-colored country fill and boundary layers beneath tag markers.
     * Used internally during style installation.
     */
    private installOverlayLayers(): void
    {
        if (!this.map.getLayer(COUNTRY_FILL_LAYER_ID))
        {
            this.map.addLayer(
            {
                id: COUNTRY_FILL_LAYER_ID,
                type: "fill",
                source: COUNTRY_SOURCE_ID,
                paint:
                {
                    "fill-color": FALLBACK_OVERLAY_COLOR,
                    "fill-opacity": 0,
                },
            });
        }

        if (!this.map.getLayer(COUNTRY_OUTLINE_LAYER_ID))
        {
            this.map.addLayer(
            {
                id: COUNTRY_OUTLINE_LAYER_ID,
                type: "line",
                source: COUNTRY_SOURCE_ID,
                paint:
                {
                    "line-color": "#ffffff",
                    "line-opacity": 0.8,
                    "line-width": ["interpolate", ["linear"], ["zoom"], 0, 0.5, 6, 1.5],
                },
            });
        }

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (!this.map.getLayer(COUNTRY_HOVER_FILL_LAYER_ID))
        {
            this.map.addLayer({
                id: COUNTRY_HOVER_FILL_LAYER_ID,
                type: "fill",
                source: COUNTRY_SOURCE_ID,
                filter: ["==", COUNTRY_CODE_EXPRESSION, ""],
                paint: {
                    "fill-color": "#ffffff",
                    "fill-opacity": 0.14,
                    "fill-opacity-transition": { duration: reducedMotion ? 0 : 180 },
                },
            });
        }

        if (!this.map.getLayer(COUNTRY_HOVER_OUTLINE_LAYER_ID))
        {
            this.map.addLayer({
                id: COUNTRY_HOVER_OUTLINE_LAYER_ID,
                type: "line",
                source: COUNTRY_SOURCE_ID,
                filter: ["==", COUNTRY_CODE_EXPRESSION, ""],
                paint: {
                    "line-color": "#ffffff",
                    "line-opacity": 0.95,
                    "line-width": ["interpolate", ["linear"], ["zoom"], 0, 1.5, 8, 4],
                    "line-width-transition": { duration: reducedMotion ? 0 : 180 },
                },
            });
        }
    }

    /**
     * Adds the active-country outline and optional transparent hit layer.
     * Used internally during style installation.
     */
    private installSelectionLayers(): void
    {
        if (!this.map.getLayer(COUNTRY_SELECTED_LAYER_ID))
        {
            this.map.addLayer(
            {
                id: COUNTRY_SELECTED_LAYER_ID,
                type: "line",
                source: COUNTRY_SOURCE_ID,
                filter: ["==", COUNTRY_CODE_EXPRESSION, ""],
                paint:
                {
                    "line-color": "#ffe45e",
                    "line-width": ["interpolate", ["linear"], ["zoom"], 0, 2, 8, 5],
                    "line-opacity": 1,
                },
            });
        }

        if (!this.map.getLayer(COUNTRY_HIT_LAYER_ID))
        {
            this.map.addLayer(
            {
                id: COUNTRY_HIT_LAYER_ID,
                type: "fill",
                source: COUNTRY_SOURCE_ID,
                layout:
                {
                    visibility: "none",
                },
                paint:
                {
                    "fill-color": "#000000",
                    "fill-opacity": 0.01,
                },
            });
        }
    }

    /**
     * Applies visibility, custom colors, and opacity through source-property expressions.
     * Used after overlay settings change and after each style reload.
     */
    private updatePaintExpressions(): void
    {
        if (!this.map.getLayer(COUNTRY_FILL_LAYER_ID))
        {
            return;
        }

        const visibleOverlays = this.overlays.filter((overlay) => overlay.isVisible);
        const visibleCountryCodes = visibleOverlays.map((overlay) => overlay.countryCode.toUpperCase());
        const visibilityFilter: ExpressionSpecification =
            ["in", COUNTRY_CODE_EXPRESSION, ["literal", visibleCountryCodes]];

        this.map.setFilter(COUNTRY_FILL_LAYER_ID, visibilityFilter);
        this.map.setFilter(COUNTRY_OUTLINE_LAYER_ID, visibilityFilter);
        this.map.setPaintProperty(
            COUNTRY_FILL_LAYER_ID,
            "fill-color",
            createCountryMatchExpression(visibleOverlays, (overlay) => sanitizeOverlayColor(overlay.color), FALLBACK_OVERLAY_COLOR),
        );
        this.map.setPaintProperty(
            COUNTRY_FILL_LAYER_ID,
            "fill-opacity",
            createCountryMatchExpression(visibleOverlays, (overlay) => sanitizeOverlayOpacity(overlay.opacity), 0),
        );
    }

    /**
     * Synchronizes the selected-country emphasis independently from hit targets.
     * Used after prop changes and style reloads while browsing remains interactive.
     */
    private updateSelectionStyle(): void
    {
        if (this.map.getLayer(COUNTRY_SELECTED_LAYER_ID))
        {
            this.map.setFilter(
                COUNTRY_SELECTED_LAYER_ID,
                ["==", COUNTRY_CODE_EXPRESSION, this.selectedCountryCode ?? ""],
            );
        }
    }

    /**
     * Restricts the country hit target to all countries in edit mode or visible overlays in browse mode.
     * Used after overlay or interaction-mode changes to prevent accidental background interception.
     */
    private updateInteractionStyle(): void
    {
        if (!this.map.getLayer(COUNTRY_HIT_LAYER_ID))
        {
            return;
        }

        const visibleCountryCodes = this.overlays
            .filter((overlay) => overlay.isVisible)
            .map((overlay) => overlay.countryCode.toUpperCase());
        const browsingEnabled = this.highlightInteractionEnabled && visibleCountryCodes.length > 0;

        this.map.setFilter(
            COUNTRY_HIT_LAYER_ID,
            this.selectionEnabled
                ? ["!=", COUNTRY_CODE_EXPRESSION, ""]
                : ["in", COUNTRY_CODE_EXPRESSION, ["literal", visibleCountryCodes]],
        );
        this.map.setLayoutProperty(
            COUNTRY_HIT_LAYER_ID,
            "visibility",
            this.selectionEnabled || browsingEnabled ? "visible" : "none",
        );
    }
}
