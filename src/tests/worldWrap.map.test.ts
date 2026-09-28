import { describe, expect, it } from "vitest";
import { createMapOptions } from "../map/mapOptions";

describe("horizontal world wrapping", () =>
{
    it("enables repeated worlds without horizontal camera bounds", () =>
    {
        const options = createMapOptions(
            document.createElement("div"),
            {
                version: 8,
                sources: {},
                layers: [],
            },
            { longitude: 540, latitude: 0, zoom: 2 },
        );

        expect(options.renderWorldCopies).toBe(true);
        expect(options.maxBounds).toBeUndefined();
        expect(options.center).toEqual([-180, 0]);
    });
});
