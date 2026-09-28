import type { Map as MapLibreMap, MapGeoJSONFeature } from "maplibre-gl";
import { describe, expect, it } from "vitest";
import { CountryOverlayManager } from "../map/CountryOverlayManager";



/**
 * Creates the minimal rendered-feature shape needed by country selection tests.
 * Used to verify provider-property normalization without constructing WebGL.
 */
function createCountryFeature(properties: Record<string, unknown>): MapGeoJSONFeature
{
    return { properties } as unknown as MapGeoJSONFeature;
}

describe("country provider normalization", () =>
{
    const manager = new CountryOverlayManager({} as MapLibreMap);

    it("reads the pinned provider alpha-3 property", () =>
    {
        const selection = manager.getSelection(createCountryFeature({
            name: "Indonesia",
            "ISO3166-1-Alpha-3": "IDN",
        }));

        expect(selection).toEqual({ countryCode: "IDN", countryName: "Indonesia" });
    });

    it("normalizes known provider sentinel codes for sovereign countries", () =>
    {
        const france = manager.getSelection(createCountryFeature({
            name: "France",
            "ISO3166-1-Alpha-3": "-99",
        }));
        const norway = manager.getSelection(createCountryFeature({
            name: "Norway",
            "ISO3166-1-Alpha-3": "-99",
        }));

        expect(france?.countryCode).toBe("FRA");
        expect(norway?.countryCode).toBe("NOR");
    });

    it("does not invent a country identity for unassigned disputed geometry", () =>
    {
        const selection = manager.getSelection(createCountryFeature({
            name: "Bir Tawil",
            "ISO3166-1-Alpha-3": "-99",
        }));

        expect(selection).toBeNull();
    });
});
