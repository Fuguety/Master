import type { Map as MapLibreMap } from "maplibre-gl";
import { describe, expect, it, vi } from "vitest";
import { createDraftMarker } from "../map/draftMarker";

vi.mock("maplibre-gl", () => ({
    Marker: class TestMarker
    {
    },
}));

describe("Create Tag draft marker", () =>
{
    it("sets the coordinate before attaching the marker to MapLibre", () =>
    {
        const calls: string[] = [];
        const marker = {
            addTo: vi.fn(() =>
            {
                calls.push("addTo");
                return marker;
            }),
            remove: vi.fn(() => marker),
            setLngLat: vi.fn(() =>
            {
                calls.push("setLngLat");
                return marker;
            }),
        };
        const map = {} as MapLibreMap;

        const result = createDraftMarker(
            map,
            { longitude: -46.63, latitude: -23.55 },
            () => marker,
        );

        expect(result).toBe(marker);
        expect(calls).toEqual(["setLngLat", "addTo"]);
        expect(marker.setLngLat).toHaveBeenCalledWith([-46.63, -23.55]);
        expect(marker.addTo).toHaveBeenCalledWith(map);
    });
});
