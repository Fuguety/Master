import type { TagType } from "../types";

const ICON_WIDTH = 72;
const ICON_HEIGHT = 88;
const ICON_SCALE = 2;



/**
 * Draws the shared high-contrast map-pin silhouette.
 * Used by the programmatic university and company icon generator.
 * Returns a prepared canvas context sized for retina rendering.
 */
function drawPinBase(fillColor: string): CanvasRenderingContext2D
{
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    canvas.width = ICON_WIDTH;
    canvas.height = ICON_HEIGHT;

    if (context === null)
    {
        throw new Error("The browser could not create a canvas context for map icons.");
    }

    context.scale(ICON_SCALE, ICON_SCALE);
    context.beginPath();
    context.moveTo(18, 42);
    context.bezierCurveTo(14, 35, 3, 25, 3, 18);
    context.arc(18, 18, 15, Math.PI, 0, false);
    context.bezierCurveTo(33, 25, 22, 35, 18, 42);
    context.closePath();
    context.fillStyle = fillColor;
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = "#ffffff";
    context.stroke();

    return context;
}



/**
 * Draws a simple mortarboard pictogram without copyrighted artwork.
 * Used exclusively by university tag markers.
 * Mutates the supplied icon canvas context.
 */
function drawUniversityGlyph(context: CanvasRenderingContext2D): void
{
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.moveTo(9, 16);
    context.lineTo(18, 11);
    context.lineTo(27, 16);
    context.lineTo(18, 21);
    context.closePath();
    context.fill();
    context.fillRect(13, 20, 10, 3);
    context.fillRect(26, 16, 1.5, 8);
}



/**
 * Draws a simple office-building pictogram without brand artwork.
 * Used exclusively by company tag markers.
 * Mutates the supplied icon canvas context.
 */
function drawCompanyGlyph(context: CanvasRenderingContext2D): void
{
    context.fillStyle = "#ffffff";
    context.fillRect(11, 10, 14, 16);
    context.fillRect(8, 15, 5, 11);
    context.fillStyle = "#1c334a";

    for (let row = 0; row < 3; row += 1)
    {
        for (let column = 0; column < 3; column += 1)
        {
            context.fillRect(13 + column * 4, 12 + row * 4, 2, 2);
        }
    }
}



/**
 * Draws a folded sticky-note pictogram with a small lock indicator.
 * Used exclusively by Note tag markers.
 */
function drawNoteGlyph(context: CanvasRenderingContext2D): void
{
    context.fillStyle = "#ffffff";
    context.fillRect(10, 10, 16, 17);
    context.fillStyle = "#6b5510";
    context.fillRect(13, 14, 10, 1.5);
    context.fillRect(13, 18, 8, 1.5);
    context.beginPath();
    context.moveTo(21, 27);
    context.lineTo(26, 22);
    context.lineTo(26, 27);
    context.closePath();
    context.fill();
}



/**
 * Generates a CSP-compatible marker image for a supported tag type.
 * Used by the tag layer manager when a base-map style is loaded.
 * Returns retina ImageData accepted directly by MapLibre's image registry.
 */
export function createTagIcon(type: TagType): ImageData
{
    const context = drawPinBase(type === "university" ? "#3458eb" : type === "company" ? "#d9485f" : "#c79616");

    if (type === "university")
    {
        drawUniversityGlyph(context);
    }
    else if (type === "company")
    {
        drawCompanyGlyph(context);
    }
    else
    {
        drawNoteGlyph(context);
    }

    return context.getImageData(0, 0, ICON_WIDTH, ICON_HEIGHT);
}
