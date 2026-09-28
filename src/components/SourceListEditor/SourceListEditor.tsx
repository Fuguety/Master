import { useState } from "react";
import type { SourceReference } from "../../types";
import { Button } from "../Button/Button";
import { TextField } from "../forms/TextField";
import styles from "./SourceListEditor.module.css";

export interface SourceDraft
{
    accessedAt?: string;
    title: string;
    url: string;
}

export interface SourceListEditorProps
{
    disabled?: boolean;
    error?: string;
    onAdd: (source: SourceDraft) => void;
    onDelete: (sourceId: string) => void;
    onUpdate: (sourceId: string, source: SourceDraft) => void;
    sources: readonly SourceReference[];
}

const emptyDraft: SourceDraft = { title: "", url: "" };

/**
 * Validates whether a source draft contains a title and an HTTP-compatible URL.
 * Used by the source editor before emitting add or update operations.
 * Returns true for complete, browser-parseable HTTP or HTTPS sources.
 */
function isSourceDraftValid(source: SourceDraft): boolean
{
    if (source.title.trim().length === 0 || source.url.trim().length === 0)
    {
        return false;
    }

    try
    {
        const parsedUrl = new URL(source.url);
        return parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:";
    }
    catch
    {
        return false;
    }
}



/**
 * Renders controlled source creation, editing, safe linking, and removal.
 * Used by both tag forms to maintain research citations.
 * Emits source drafts while domain IDs and persistence remain in the parent.
 */
export function SourceListEditor({
    disabled = false,
    error,
    onAdd,
    onDelete,
    onUpdate,
    sources,
}: SourceListEditorProps)
{
    const [draft, setDraft] = useState<SourceDraft>(emptyDraft);
    const [editingId, setEditingId] = useState<string | null>(null);
    const hasPartialDraft = (draft.title.trim().length > 0) !== (draft.url.trim().length > 0);
    const handleSubmit = (): void =>
    {
        if (!isSourceDraftValid(draft))
        {
            return;
        }

        const normalizedDraft = {
            ...draft,
            title: draft.title.trim(),
            url: draft.url.trim(),
        };

        if (editingId === null)
        {
            onAdd(normalizedDraft);
        }
        else
        {
            onUpdate(editingId, normalizedDraft);
        }

        setDraft(emptyDraft);
        setEditingId(null);
    };
    const startEditing = (source: SourceReference): void =>
    {
        setEditingId(source.id);
        setDraft({
            accessedAt: source.accessedAt,
            title: source.title,
            url: source.url,
        });
    };
    const cancelEditing = (): void =>
    {
        setEditingId(null);
        setDraft(emptyDraft);
    };

    return (
        <section aria-labelledby="sources-editor-title" className={styles.editor}>
            <div className={styles.headingRow}>
                <div>
                    <h3 id="sources-editor-title">Sources</h3>
                    <p>Add public links that support your assessment.</p>
                </div>
            </div>

            {sources.length > 0 ? (
                <ul className={styles.list}>
                    {sources.map((source) => (
                        <li className={styles.source} key={source.id}>
                            <div className={styles.sourceText}>
                                <a href={source.url} rel="noopener noreferrer" target="_blank">
                                    {source.title}
                                </a>
                                <span>{source.url}</span>
                            </div>
                            <div className={styles.actions}>
                                <Button disabled={disabled} onClick={() => startEditing(source)} variant="quiet">
                                    Edit
                                </Button>
                                <Button disabled={disabled} onClick={() => onDelete(source.id)} variant="quiet">
                                    Delete
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className={styles.empty}>No sources attached.</p>
            )}

            <div className={styles.form}>
                <TextField
                    disabled={disabled}
                    label="Source title"
                    maxLength={180}
                    onChange={(title) => setDraft((current) => ({ ...current, title }))}
                    placeholder="Official ranking or company careers page"
                    value={draft.title}
                />
                <TextField
                    disabled={disabled}
                    error={error}
                    hint="Only HTTP and HTTPS links are accepted."
                    label="Source URL"
                    maxLength={2_048}
                    onChange={(url) => setDraft((current) => ({ ...current, url }))}
                    placeholder="https://example.org/report"
                    type="url"
                    value={draft.url}
                />
                <div className={styles.actions}>
                    <Button disabled={disabled || !isSourceDraftValid(draft)} onClick={handleSubmit} variant="secondary">
                        {editingId === null ? "Add source" : "Save source"}
                    </Button>
                    {editingId !== null ? (
                        <Button disabled={disabled} onClick={cancelEditing} variant="quiet">
                            Cancel
                        </Button>
                    ) : null}
                </div>
                {hasPartialDraft ? (
                    <p className={styles.validation} role="status">
                        Complete both title and HTTP/HTTPS URL, or leave both empty.
                    </p>
                ) : null}
            </div>
        </section>
    );
}
