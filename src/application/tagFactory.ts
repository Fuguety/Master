import type { CompanyTag, Coordinates, MapTag, NoteTag, UniversityTag } from '@/types';
import { createId } from '@/utils/createId';
import { normalizeCoordinates } from '@/utils/geoCoordinates';

/**
 * Builds the common persisted fields for a new tag at clicked coordinates.
 * Used by both concrete tag factories in the create-tag workflow.
 * Returns a draft-safe base whose required text fields are completed in the form.
 */
function createBaseTag(coordinates: Coordinates)
{
    const timestamp = new Date().toISOString();

    return {
        coordinates: normalizeCoordinates(coordinates),
        name: '',
        city: '',
        country: '',
        countryTier: 'tier-2' as const,
        notes: [],
        sources: [],
        finalRating: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
    };
}



/**
 * Creates an editable university record at a selected map position.
 * Used after the user chooses University in the tag-type chooser.
 * Returns every university field with explicit missing-safe defaults.
 */
export function createUniversityTag(coordinates: Coordinates): UniversityTag
{
    return {
        ...createBaseTag(coordinates),
        id: createId('university'),
        type: 'university',
        locationScore: null,
        qualityOfLife: null,
        affordability: null,
        jobOpportunities: null,
        jobPlacementSupport: null,
        regionalCompanies: null,
        globalReputation: null,
        localReputation: null,
        globalRanking: null,
        localRanking: null,
        commuteQuality: null,
    };
}



/**
 * Creates an editable company record at a selected map position.
 * Used after the user chooses Company in the tag-type chooser.
 * Returns every company field with explicit missing-safe defaults.
 */
export function createCompanyTag(coordinates: Coordinates): CompanyTag
{
    return {
        ...createBaseTag(coordinates),
        id: createId('company'),
        type: 'company',
        payment: null,
        careerGrowth: null,
        locationScore: null,
        workModel: 'hybrid',
        internshipAvailability: null,
    };
}



/**
 * Creates an editable sticky-note record at a selected map position.
 * Used after the user chooses Note in the tag-type chooser.
 */
export function createNoteTag(coordinates: Coordinates): NoteTag
{
    const timestamp = new Date().toISOString();

    return {
        id: createId('note'),
        type: 'note',
        name: '',
        content: '',
        color: '#f4c95d',
        country: '',
        city: '',
        coordinates: normalizeCoordinates(coordinates),
        sources: [],
        locked: false,
        createdAt: timestamp,
        updatedAt: timestamp,
    };
}



/**
 * Creates the selected concrete tag draft from a shared map coordinate.
 * Used by the application controller after the accessible type-choice dialog.
 * Returns the discriminated tag union consumed by the editor.
 */
export function createTag(type: MapTag['type'], coordinates: Coordinates): MapTag
{
    if (type === 'university')
    {
        return createUniversityTag(coordinates);
    }

    return type === 'company' ? createCompanyTag(coordinates) : createNoteTag(coordinates);
}
