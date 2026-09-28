import type { FeatureCollection, Polygon } from "geojson";
import {
    calculateGeometryBounds,
    clampLatitude,
    getNearestWrappedLongitude,
    isPointInsideGeometry,
    normalizeCoordinates,
    wrapLongitude,
} from "../utils/geoCoordinates";

const SQUARE_COLLECTION: FeatureCollection<Polygon> =
{
    type: "FeatureCollection",
    features:
    [
        {
            type: "Feature",
            properties: {},
            geometry:
            {
                type: "Polygon",
                coordinates:
                [
                    [[-10, -5], [20, -5], [20, 15], [-10, 15], [-10, -5]],
                ],
            },
        },
    ],
};

describe("map geographic coordinates", () =>
{
    it("wraps longitudes and clamps Web Mercator latitudes", () =>
    {
        expect(wrapLongitude(540)).toBe(-180);
        expect(wrapLongitude(-190)).toBe(170);
        expect(getNearestWrappedLongitude(-170, 540)).toBe(550);
        expect(getNearestWrappedLongitude(170, -540)).toBe(-550);
        expect(getNearestWrappedLongitude(25, Number.NaN)).toBe(25);
        expect(clampLatitude(90)).toBeCloseTo(85.051129);
        expect(normalizeCoordinates({ longitude: 190, latitude: -90 })).toEqual(
        {
            longitude: -170,
            latitude: -85.051129,
        });
    });

    it("calculates polygon bounds and point containment through Turf", () =>
    {
        expect(calculateGeometryBounds(SQUARE_COLLECTION)).toEqual([[-10, -5], [20, 15]]);
        expect(isPointInsideGeometry(
            { longitude: 0, latitude: 0 },
            SQUARE_COLLECTION.features[0]!,
        )).toBe(true);
        expect(isPointInsideGeometry(
            { longitude: 30, latitude: 0 },
            SQUARE_COLLECTION.features[0]!,
        )).toBe(false);
    });
});
