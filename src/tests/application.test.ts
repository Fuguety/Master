import { describe, expect, it, vi } from 'vitest';
import {
    addTagNote,
    addTagSource,
    createCompanyTag,
    createUniversityTag,
    deleteTagNote,
    updateTagNote,
    validateAndScoreTag,
} from '@/application';

describe('application tag workflows', () =>
{
    it('creates complete missing-safe drafts from map coordinates', () =>
    {
        const university = createUniversityTag({ longitude: -46.63, latitude: -23.55 });
        const company = createCompanyTag({ longitude: 2.35, latitude: 48.86 });

        expect(university.type).toBe('university');
        expect(university.locationScore).toBeNull();
        expect(university.coordinates.longitude).toBe(-46.63);
        expect(company.type).toBe('company');
        expect(company.workModel).toBe('hybrid');
        expect(company.internshipAvailability).toBeNull();
    });

    it('normalizes unsafe creation coordinates before a draft reaches the map', () =>
    {
        const company = createCompanyTag({ longitude: 550, latitude: 95 });
        const university = createUniversityTag({ longitude: Number.NaN, latitude: Number.POSITIVE_INFINITY });

        expect(company.coordinates.longitude).toBe(-170);
        expect(company.coordinates.latitude).toBeCloseTo(85.051129);
        expect(university.coordinates).toEqual({ longitude: 0, latitude: 0 });
    });

    it('returns field-indexed errors for incomplete clicked drafts', () =>
    {
        const result = validateAndScoreTag(createCompanyTag({ longitude: 0, latitude: 0 }));

        expect(result.success).toBe(false);

        if (!result.success)
        {
            expect(result.errors.name).toBeTruthy();
            expect(result.errors.countryCode).toBeUndefined();
            expect(result.rating.rating).toBeGreaterThanOrEqual(0);
        }
    });

    it('scores and validates a completed university before persistence', () =>
    {
        const draft = createUniversityTag({ longitude: -0.1276, latitude: 51.5072 });
        const completed = {
            ...draft,
            name: 'Example University',
            city: 'London',
            country: 'United Kingdom',
            countryCode: 'GBR',
            locationScore: 4,
            qualityOfLife: 4.5,
            affordability: 2.5,
            jobOpportunities: 4.4,
            jobPlacementSupport: true,
            regionalCompanies: 4.6,
            globalReputation: 4.2,
            localReputation: 4.5,
            globalRanking: 75,
            localRanking: 8,
            commuteQuality: 3.8,
        };
        const result = validateAndScoreTag(completed);

        expect(result.success).toBe(true);

        if (result.success && result.tag.type !== 'note')
        {
            expect(result.tag.finalRating).toBe(result.rating.rating);
            expect(Number.isInteger(result.tag.finalRating * 10)).toBe(true);
            expect(result.rating.breakdown.length).toBeGreaterThan(5);
        }
    });

    it('refreshes the record timestamp when a valid tag is saved', () =>
    {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-08-05T15:30:00.000Z'));

        const completed = {
            ...createUniversityTag({ longitude: -0.1276, latitude: 51.5072 }),
            name: 'Timestamp University',
            city: 'London',
            country: 'United Kingdom',
            countryCode: 'GBR',
        };
        const result = validateAndScoreTag(completed);

        expect(result.success).toBe(true);

        if (result.success)
        {
            expect(result.tag.updatedAt).toBe('2026-08-05T15:30:00.000Z');
        }

        vi.useRealTimers();
    });

    it('immutably adds, edits, and deletes notes and sources', () =>
    {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-08-05T12:00:00.000Z'));

        const initial = createCompanyTag({ longitude: 10, latitude: 20 });
        const withNote = addTagNote(initial, '  Research hiring cycle  ');
        const noteId = withNote.notes[0]?.id ?? '';
        const edited = updateTagNote(withNote, noteId, 'Updated hiring cycle');
        const withSource = addTagSource(edited, {
            title: 'Official careers page',
            url: 'https://example.com/careers',
        });
        const withoutNote = deleteTagNote(withSource, noteId);

        expect(initial.notes).toHaveLength(0);
        expect(withNote.notes[0]?.text).toBe('Research hiring cycle');
        expect(edited.notes[0]?.text).toBe('Updated hiring cycle');
        expect(withSource.sources[0]?.url).toBe('https://example.com/careers');
        expect(withoutNote.notes).toHaveLength(0);

        vi.useRealTimers();
    });
});
