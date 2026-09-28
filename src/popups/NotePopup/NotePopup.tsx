import type { NoteTag } from "../../types";
import { Button } from "../../components/Button/Button";
import { NoteIcon } from "../../tags/icons/NoteIcon";
import styles from "./NotePopup.module.css";

export interface NotePopupProps
{
    busy?: boolean;
    onClose: () => void;
    onDelete: (tagId: string) => void;
    onEdit: (tagId: string) => void;
    onToggleLock: (tag: NoteTag) => void;
    tag: NoteTag;
}

/**
 * Displays a sticky Note's content, location, sources, and lock controls.
 * Used inside floating Note windows without invoking scoring presentation.
 */
export function NotePopup({ busy = false, onClose, onDelete, onEdit, onToggleLock, tag }: NotePopupProps)
{
    return (
        <article className={styles.note} style={{ "--note-color": tag.color ?? "#f4c95d" } as React.CSSProperties}>
            <header>
                <NoteIcon />
                <div>
                    <p>Sticky note {tag.locked ? "· Locked" : "· Unlocked"}</p>
                    <h2>{tag.name}</h2>
                    <span>{tag.city}, {tag.country}</span>
                </div>
                <button aria-label={`Close ${tag.name}`} onClick={onClose} type="button">×</button>
            </header>
            <div className={styles.content}>
                <p>{tag.content}</p>
                <small>Updated {new Date(tag.updatedAt).toLocaleString()}</small>
                {tag.sources.length === 0 ? null : (
                    <ul>
                        {tag.sources.map((source) => (
                            <li key={source.id}><a href={source.url} rel="noopener noreferrer" target="_blank">{source.title}</a></li>
                        ))}
                    </ul>
                )}
            </div>
            <footer>
                <Button disabled={busy} onClick={() => onToggleLock(tag)} variant="secondary">
                    {tag.locked ? "Unlock" : "Lock"}
                </Button>
                <Button disabled={busy} onClick={() => onEdit(tag.id)} variant="secondary">Edit</Button>
                <Button disabled={busy} onClick={() => onDelete(tag.id)} variant="danger">Delete</Button>
            </footer>
        </article>
    );
}

