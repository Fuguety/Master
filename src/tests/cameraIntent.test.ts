import { describe, expect, it } from "vitest";
import { createLocationCameraOptions } from "../map/camera";
import { createCameraTarget } from "../map/cameraIntent";

describe("creation camera intents", () =>
{
    it("keeps the clicked wrapped coordinate as the immediate draft target", () =>
    {
        const target = createCameraTarget({ longitude: -170, latitude: 14 }, "draft", 2);
        const options = createLocationCameraOptions(
            target.coordinates,
            175,
            3,
            false,
            { left: 420, top: 64 },
            5.5,
            0.8,
        );

        expect(target.intent).toBe("draft");
        expect(options.center).toEqual([190, 14]);
        expect(options.zoom).toBe(5.5);
        expect(options.padding).toEqual({ top: 64, right: 0, bottom: 0, left: 420 });
    });

    it("promotes the saved coordinate to normal full-detail zoom", () =>
    {
        const draft = createCameraTarget({ longitude: 30, latitude: 50 }, "draft", 7);
        const saved = createCameraTarget(draft.coordinates, "detail", 8);
        const options = createLocationCameraOptions(saved.coordinates, 30, 5.5, false);

        expect(saved.requestId).toBeGreaterThan(draft.requestId);
        expect(saved.coordinates).toEqual(draft.coordinates);
        expect(options.zoom).toBe(7);
    });

    it("does not add another draft zoom increment for inset-only recalculation", () =>
    {
        const options = createLocationCameraOptions(
            { longitude: 20, latitude: 40 },
            20,
            6.3,
            false,
            { right: 380 },
            5.5,
            0,
        );

        expect(options.zoom).toBe(6.3);
        expect(options.padding).toEqual({ top: 0, right: 380, bottom: 0, left: 0 });
    });
});
