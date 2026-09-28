import type { SVGProps } from "react";

/**
 * Renders the original mortarboard-style university symbol.
 * Used by university forms, markers, filters, and detail cards.
 * Accepts standard SVG properties for sizing and accessible decoration.
 */
export function UniversityIcon(properties: SVGProps<SVGSVGElement>)
{
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...properties}>
            <path d="M3 9.1 12 4l9 5.1-9 5.1-9-5.1Z" fill="currentColor" />
            <path d="M6.5 11.2v5.1c2.9 2.2 8.1 2.2 11 0v-5.1M21 9.2v6.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
    );
}

