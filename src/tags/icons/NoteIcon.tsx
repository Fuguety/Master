/**
 * Renders an original sticky-note glyph without external artwork.
 * Used by Note forms, visibility controls, markers, and detail windows.
 */
export function NoteIcon()
{
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M5 3h14v13l-5 5H5z" fill="currentColor" />
            <path d="M14 16h5l-5 5z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 8h8M8 12h6" fill="none" stroke="var(--color-surface)" strokeLinecap="round" strokeWidth="1.5" />
        </svg>
    );
}

