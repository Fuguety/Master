import { useState } from "react";
import type { TagNote } from "../../types";
import { Button } from "../Button/Button";
import { TextAreaField } from "../forms/TextAreaField";
import styles from "./NoteListEditor.module.css";

export interface NoteListEditorProps
{
    disabled?: boolean;
    locale?: string;
    notes: readonly TagNote[];
    onAdd: (text: string) => void;
    onDelete: (noteId: string) => void;
    onUpdate: (noteId: string, text: string) => void;
}

/**
 * Formats an ISO note timestamp using the active display locale.
 * Used by the note list to provide readable edit history.
 * Returns a fallback label for invalid timestamps.
 */
function formatNoteDate(value: string, locale: string | undefined): string
{
    const date = new Date(value);

    if (Number.isNaN(date.getTime()))
    {
        return "Date unavailable";
    }

    return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}



/**
 * Renders controlled add, edit, and delete interactions for tag notes.
 * Used by both university and company forms without owning persistence data.
 * Emits plain-text note operations to the parent feature.
 */
export function NoteListEditor({
    disabled = false,
    locale,
    notes,
    onAdd,
    onDelete,
    onUpdate,
}: NoteListEditorProps)
{
    const [newNote, setNewNote] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState("");
    const handleAdd = (): void =>
    {
        const trimmedText = newNote.trim();

        if (trimmedText.length === 0)
        {
            return;
        }

        onAdd(trimmedText);
        setNewNote("");
    };
    const startEditing = (note: TagNote): void =>
    {
        setEditingId(note.id);
        setEditingText(note.text);
    };
    const cancelEditing = (): void =>
    {
        setEditingId(null);
        setEditingText("");
    };
    const saveEditing = (): void =>
    {
        const trimmedText = editingText.trim();

        if (editingId === null || trimmedText.length === 0)
        {
            return;
        }

        onUpdate(editingId, trimmedText);
        cancelEditing();
    };

    return (
        <section aria-labelledby="notes-editor-title" className={styles.editor}>
            <div className={styles.headingRow}>
                <div>
                    <h3 id="notes-editor-title">Notes</h3>
                    <p>{notes.length} {notes.length === 1 ? "note" : "notes"}</p>
                </div>
            </div>

            {notes.length > 0 ? (
                <ol className={styles.list}>
                    {notes.map((note) => (
                        <li className={styles.note} key={note.id}>
                            {editingId === note.id ? (
                                <div className={styles.editing}>
                                    <TextAreaField
                                        disabled={disabled}
                                        label="Edit note"
                                        maxLength={4000}
                                        onChange={setEditingText}
                                        value={editingText}
                                    />
                                    <div className={styles.actions}>
                                        <Button disabled={disabled || editingText.trim().length === 0} onClick={saveEditing} variant="primary">
                                            Save note
                                        </Button>
                                        <Button disabled={disabled} onClick={cancelEditing} variant="quiet">
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className={styles.noteText}>{note.text}</p>
                                    <div className={styles.metaRow}>
                                        <time dateTime={note.updatedAt}>
                                            {formatNoteDate(note.updatedAt, locale)}
                                        </time>
                                        <div className={styles.actions}>
                                            <Button disabled={disabled} onClick={() => startEditing(note)} variant="quiet">
                                                Edit
                                            </Button>
                                            <Button disabled={disabled} onClick={() => onDelete(note.id)} variant="quiet">
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ol>
            ) : (
                <p className={styles.empty}>No notes yet. Add research context or a reminder below.</p>
            )}

            <div className={styles.addForm}>
                <TextAreaField
                    disabled={disabled}
                    label="Add a note"
                    maxLength={4000}
                    onChange={setNewNote}
                    placeholder="Write a concise note…"
                    value={newNote}
                />
                <Button disabled={disabled || newNote.trim().length === 0} onClick={handleAdd} variant="secondary">
                    Add note
                </Button>
            </div>
        </section>
    );
}
