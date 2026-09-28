import type { StyleSpecification } from "maplibre-gl";

export type MapStyleId = "cartographic" | "satellite";

const ENVIRONMENT: unknown = import.meta.env;



/**
 * Reads an optional Vite environment variable through an unknown-safe boundary.
 * Used by map tile and style URL configuration without allowing untyped environment data.
 * Returns a trimmed non-empty string or undefined.
 */
function readEnvironmentUrl(variableName: string): string | undefined
{
    if (typeof ENVIRONMENT !== "object" || ENVIRONMENT === null)
    {
        return undefined;
    }

    const value = (ENVIRONMENT as Record<string, unknown>)[variableName];

    if (typeof value !== "string" || value.trim().length === 0)
    {
        return undefined;
    }

    return value.trim();
}



/**
 * Reads a bounded plain-text attribution value from Vite configuration.
 * Used when deployments replace the default satellite tile provider.
 * Rejects HTML-significant characters so attribution cannot inject markup.
 */
function readEnvironmentAttribution(variableName: string): string | undefined
{
    if (typeof ENVIRONMENT !== "object" || ENVIRONMENT === null)
    {
        return undefined;
    }

    const value = (ENVIRONMENT as Record<string, unknown>)[variableName];

    if (
        typeof value !== "string"
        || value.trim().length === 0
        || value.trim().length > 500
        || /[<>&]/u.test(value)
    )
    {
        return undefined;
    }

    return value.trim();
}

const OPEN_FREE_MAP_TILEJSON_URL = "https://tiles.openfreemap.org/planet";
const OPEN_FREE_MAP_GLYPHS_URL = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";
const OPEN_STREET_MAP_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const SATELLITE_TILE_URL =
    readEnvironmentUrl("VITE_SATELLITE_TILE_URL")
    || "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SATELLITE_ATTRIBUTION = readEnvironmentAttribution("VITE_SATELLITE_ATTRIBUTION")
    || "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics and the GIS User Community";
const CONFIGURED_CARTOGRAPHIC_STYLE_URL = readEnvironmentUrl("VITE_CARTOGRAPHIC_STYLE_URL");

const CARTOGRAPHIC_STYLE: StyleSpecification =
{
    version: 8,
    name: "OpenStreetMap cartographic",
    projection: { type: "mercator" },
    glyphs: OPEN_FREE_MAP_GLYPHS_URL,
    sources:
    {
        "openstreetmap-raster":
        {
            type: "raster",
            tiles: [OPEN_STREET_MAP_TILE_URL],
            tileSize: 256,
            maxzoom: 19,
            attribution:
                "© <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap contributors</a>",
        },
    },
    layers:
    [
        {
            id: "cartographic-background",
            type: "background",
            paint:
            {
                "background-color": "#dce8ed",
            },
        },
        {
            id: "cartographic-map",
            type: "raster",
            source: "openstreetmap-raster",
            minzoom: 0,
            maxzoom: 22,
        },
    ],
};

const SATELLITE_STYLE: StyleSpecification =
{
    version: 8,
    name: "Satellite with OpenFreeMap labels",
    projection: { type: "mercator" },
    glyphs: OPEN_FREE_MAP_GLYPHS_URL,
    sources:
    {
        satellite:
        {
            type: "raster",
            tiles: [SATELLITE_TILE_URL],
            tileSize: 256,
            maxzoom: 19,
            attribution: SATELLITE_ATTRIBUTION,
        },
        openmaptiles:
        {
            type: "vector",
            url: OPEN_FREE_MAP_TILEJSON_URL,
        },
    },
    layers:
    [
        {
            id: "satellite-background",
            type: "background",
            paint:
            {
                "background-color": "#07131c",
            },
        },
        {
            id: "satellite-imagery",
            type: "raster",
            source: "satellite",
            minzoom: 0,
            maxzoom: 22,
        },
        {
            id: "satellite-country-boundaries-shadow",
            type: "line",
            source: "openmaptiles",
            "source-layer": "boundary",
            filter: ["all", ["==", ["get", "admin_level"], 2], ["!=", ["get", "maritime"], 1]],
            paint:
            {
                "line-color": "rgba(0, 0, 0, 0.8)",
                "line-width": ["interpolate", ["linear"], ["zoom"], 1, 1.5, 7, 3],
                "line-blur": 1.25,
            },
        },
        {
            id: "satellite-country-boundaries",
            type: "line",
            source: "openmaptiles",
            "source-layer": "boundary",
            filter: ["all", ["==", ["get", "admin_level"], 2], ["!=", ["get", "maritime"], 1]],
            paint:
            {
                "line-color": "rgba(255, 255, 255, 0.92)",
                "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.65, 7, 1.4],
            },
        },
        {
            id: "satellite-major-cities",
            type: "symbol",
            source: "openmaptiles",
            "source-layer": "place",
            minzoom: 2,
            filter: ["match", ["get", "class"], ["city", "town", "state_capital", "country_capital"], true, false],
            layout:
            {
                "text-field": ["coalesce", ["get", "name:latin"], ["get", "name:en"], ["get", "name"]],
                "text-font": ["Noto Sans Regular"],
                "text-size": ["interpolate", ["linear"], ["zoom"], 2, 10, 8, 14],
                "text-variable-anchor": ["top", "bottom", "left", "right"],
                "text-radial-offset": 0.45,
                "text-optional": true,
            },
            paint:
            {
                "text-color": "#ffffff",
                "text-halo-color": "rgba(0, 0, 0, 0.88)",
                "text-halo-width": 1.5,
            },
        },
    ],
};



/**
 * Returns an isolated MapLibre style definition for the requested presentation.
 * Used by the map controller when initializing or switching base maps.
 * The cloned output prevents MapLibre from mutating the shared configuration.
 */
export function getMapStyle(styleId: MapStyleId): StyleSpecification | string
{
    if (styleId === "cartographic" && CONFIGURED_CARTOGRAPHIC_STYLE_URL)
    {
        return CONFIGURED_CARTOGRAPHIC_STYLE_URL;
    }

    const selectedStyle = styleId === "satellite" ? SATELLITE_STYLE : CARTOGRAPHIC_STYLE;

    return structuredClone(selectedStyle);
}
