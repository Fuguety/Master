let fallbackSequence = 0;

/**
 * Creates a collision-resistant identifier with a readable entity prefix.
 * Used by tag, note, source, and country-overlay factories.
 * Accepts a short prefix and returns a storage-safe identifier.
 */
export function createId(prefix: string): string
{
    const safePrefix = prefix.replace(/[^a-z0-9-]/giu, '').toLowerCase() || 'entity';

    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    {
        return `${safePrefix}-${crypto.randomUUID()}`;
    }

    const randomBytes = new Uint32Array(4);

    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function')
    {
        crypto.getRandomValues(randomBytes);
    }
    else
    {
        const timestamp = Date.now();

        fallbackSequence += 1;
        randomBytes.set([timestamp, timestamp >>> 8, timestamp >>> 16, fallbackSequence]);
    }

    return `${safePrefix}-${Array.from(randomBytes, (value) => value.toString(16)).join('')}`;
}
