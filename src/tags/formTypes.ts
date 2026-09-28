import type {
    CompanyTag,
    Coordinates,
    RatingResult,
    NoteTag,
    SourceReference,
    UniversityTag,
} from "../types";
import type { SourceDraft } from "../components/SourceListEditor/SourceListEditor";

export type UniversityFormErrorKey = keyof UniversityTag | "latitude" | "longitude";
export type CompanyFormErrorKey = keyof CompanyTag | "latitude" | "longitude";

export type UniversityFormErrors = Partial<Record<UniversityFormErrorKey, string>>;
export type CompanyFormErrors = Partial<Record<CompanyFormErrorKey, string>>;

export interface TagCollectionHandlers
{
    onAddNote: (text: string) => void;
    onDeleteNote: (noteId: string) => void;
    onUpdateNote: (noteId: string, text: string) => void;
    onAddSource: (source: SourceDraft) => void;
    onDeleteSource: (sourceId: string) => void;
    onUpdateSource: (sourceId: string, source: SourceDraft) => void;
}

export interface BaseTagFormProps extends TagCollectionHandlers
{
    busy?: boolean;
    disabled?: boolean;
    onCancel: () => void;
    onLocationResolved?: ((coordinates: Coordinates) => void) | undefined;
    ratingResult?: RatingResult;
    submitLabel?: string;
}

export interface UniversityFormProps extends BaseTagFormProps
{
    errors?: UniversityFormErrors;
    onChange: (value: UniversityTag) => void;
    onSubmit: () => void;
    value: UniversityTag;
}

export interface CompanyFormProps extends BaseTagFormProps
{
    errors?: CompanyFormErrors;
    onChange: (value: CompanyTag) => void;
    onSubmit: () => void;
    value: CompanyTag;
}

export type NoteFormErrors = Partial<Record<keyof NoteTag | "latitude" | "longitude", string>>;

export interface NoteFormProps extends Omit<BaseTagFormProps, "onAddNote" | "onDeleteNote" | "onUpdateNote">
{
    errors?: NoteFormErrors;
    onChange: (value: NoteTag) => void;
    onSubmit: () => void;
    value: NoteTag;
}

export type SourceUpdateHandler = (sourceId: string, source: SourceReference) => void;
