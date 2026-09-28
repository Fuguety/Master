import type { CSSProperties } from "react";
import type { Coordinates, CountryOverlay, MapTag } from "../types";
import type { MapStyleId } from "./mapStyles";

export interface MapViewport
{
    longitude: number;
    latitude: number;
    zoom: number;
}

export interface MapControlInsets
{
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface MapCameraTarget
{
    coordinates: Coordinates;
    intent: "detail" | "draft";
    requestId: number;
}

export interface CountrySelection
{
    countryCode: string;
    countryName: string;
    coordinates?: Coordinates;
}

export interface MapErrorDetails
{
    message: string;
    cause?: unknown;
}

export interface MapInteractionCallbacks
{
    onMapClick?: ((coordinates: Coordinates) => void) | undefined;
    onTagClick?: ((tag: MapTag) => void) | undefined;
    onTagMove?: ((tagId: string, coordinates: Coordinates) => boolean | Promise<boolean>) | undefined;
    onCountryClick?: ((selection: CountrySelection) => void) | undefined;
}

export interface WorldMapProps
{
    tags: readonly MapTag[];
    countryOverlays: readonly CountryOverlay[];
    clusteringEnabled?: boolean;
    className?: string;
    initialViewport?: Partial<MapViewport>;
    initialStyleId?: MapStyleId;
    interactionDisabled?: boolean;
    cameraTarget?: MapCameraTarget | null;
    previewCoordinates?: Coordinates | null;
    styleId?: MapStyleId;
    selectedTagId?: string | null;
    selectedCountryCode?: string | null;
    countrySelectionEnabled?: boolean;
    createTagMode?: boolean;
    highlightedCountryInteractionEnabled?: boolean;
    openTagIds?: readonly string[];
    controlInsets?: Partial<MapControlInsets>;
    onMapClick?: (coordinates: { longitude: number; latitude: number }) => void;
    onTagClick?: (tag: MapTag) => void;
    onTagMove?: (
        tagId: string,
        coordinates: { longitude: number; latitude: number },
    ) => boolean | Promise<boolean>;
    onCountryClick?: (selection: CountrySelection) => void;
    onStyleChange?: (styleId: MapStyleId) => void;
    onViewportChange?: (viewport: MapViewport) => void;
    onError?: (details: MapErrorDetails) => void;
}

export interface MapStyleSwitcherProps
{
    activeStyleId: MapStyleId;
    onChange: (styleId: MapStyleId) => void;
}

export type MapInsetStyle = CSSProperties &
{
    "--map-inset-top": string;
    "--map-inset-right": string;
    "--map-inset-bottom": string;
    "--map-inset-left": string;
};
