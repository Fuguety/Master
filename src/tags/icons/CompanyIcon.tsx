import type { SVGProps } from "react";

/**
 * Renders the original office-building company symbol.
 * Used by company forms, markers, filters, and detail cards.
 * Accepts standard SVG properties for sizing and accessible decoration.
 */
export function CompanyIcon(properties: SVGProps<SVGSVGElement>)
{
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...properties}>
            <path d="M5 21V5.2c0-.7.5-1.2 1.2-1.2h8.6c.7 0 1.2.5 1.2 1.2V21M16 9h2.8c.7 0 1.2.5 1.2 1.2V21M3 21h18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            <path d="M8 8h2M8 12h2M8 16h2M13 8h.1M13 12h.1M13 16h.1" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        </svg>
    );
}

