import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Button } from "../Button/Button";
import { SelectField } from "../forms/SelectField";
import styles from "./DataManagerPanel.module.css";

export type ImportMode = "merge" | "replace";
export type ExportScope = "all" | "universities" | "companies" | "country-overlays";
export type ConnectionMode = "local" | "shared";
export type PersistenceStatus = "loading" | "ready" | "saving" | "error";

export interface DataManagerPanelProps
{
    busy?: boolean;
    canImport?: boolean;
    connectionMode?: ConnectionMode;
    isAdmin?: boolean;
    isDirty?: boolean;
    lastExportedAt?: string;
    lastSavedAt?: string;
    onExport: (scope: ExportScope) => void;
    onImport: (file: File, mode: ImportMode) => void;
    onRefresh: () => void;
    persistenceStatus?: PersistenceStatus;
    statusMessage?: string;
    wasPublished?: boolean;
}

const importModeOptions = [
    { value: "merge", label: "Merge with current data" },
    { value: "replace", label: "Replace current data" },
] as const;

const exportScopeOptions = [
    { value: "all", label: "All application data" },
    { value: "universities", label: "Universities only" },
    { value: "companies", label: "Companies only" },
    { value: "country-overlays", label: "Country overlays only" },
] as const;

/**
 * Renders controlled JSON import and export workflows with explicit scope choices.
 * Used by the data tools panel while validation and file serialization stay external.
 * Emits the selected file/mode or export scope to the data-access layer.
 */
export function DataManagerPanel({
    busy = false,
    canImport = true,
    connectionMode = "local",
    isAdmin = false,
    isDirty = false,
    lastExportedAt,
    lastSavedAt,
    onExport,
    onImport,
    onRefresh,
    persistenceStatus = "ready",
    statusMessage,
    wasPublished = false,
}: DataManagerPanelProps)
{
    const fileInputReference = useRef<HTMLInputElement>(null);
    const [importMode, setImportMode] = useState<ImportMode>("merge");
    const [exportScope, setExportScope] = useState<ExportScope>("all");
    const activeWorkspaceMode = connectionMode === "local"
        ? "local"
        : isAdmin ? "publisher" : "shared";
    const dataState = persistenceStatus === "loading"
        ? { label: "Loading", description: "Fetching the latest shared base dataset." }
        : persistenceStatus === "saving"
            ? { label: "Publishing", description: "Saving this working copy as the shared base." }
            : persistenceStatus === "error"
                ? { label: "Sync problem", description: "The last online load or publish operation failed." }
                : isDirty
                    ? {
                        label: isAdmin ? "Changes ready to publish" : "Local changes",
                        description: isAdmin
                            ? "This working copy differs from the shared base. Use Save to publish it."
                            : "This working copy differs from the shared base and is not published.",
                    }
                    : wasPublished
                        ? { label: "Saved", description: `Shared base published ${lastSavedAt}.` }
                        : {
                            label: "Unedited",
                            description: lastSavedAt
                                ? `Your working copy matches the shared base published ${lastSavedAt}.`
                                : "Your working copy matches the bundled base dataset.",
                        };
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void =>
    {
        const file = event.currentTarget.files?.[0];

        if (file !== undefined)
        {
            onImport(file, importMode);
            event.currentTarget.value = "";
        }
    };

    return (
        <div className={styles.panel}>
            <section className={styles.workspaceStatus}>
                <div>
                    <h3>Workspace mode</h3>
                    <p>The highlighted mode shows where data comes from and whether this browser can publish it.</p>
                </div>
                <div className={styles.modeList} aria-label="Current workspace mode">
                    <div className={styles.mode} data-active={activeWorkspaceMode === "local"}>
                        <strong>Local only</strong>
                        <span>Bundled data; no shared connection</span>
                    </div>
                    <div className={styles.mode} data-active={activeWorkspaceMode === "shared"}>
                        <strong>Shared online</strong>
                        <span>Shared base with a personal working copy</span>
                    </div>
                    <div className={styles.mode} data-active={activeWorkspaceMode === "publisher"}>
                        <strong>Publisher online</strong>
                        <span>Administrator publishing is enabled</span>
                    </div>
                </div>
                <div className={styles.dataState} data-state={persistenceStatus === "error" ? "error" : isDirty ? "dirty" : "current"}>
                    <span aria-hidden="true" />
                    <div>
                        <strong>{dataState.label}</strong>
                        <p>{dataState.description}</p>
                    </div>
                </div>
            </section>

            {canImport ? <section>
                <div className={styles.heading}>
                    <span aria-hidden="true">⇧</span>
                    <div>
                        <h3>Import JSON</h3>
                        <p>Load a validated bundle into your local working copy. Only an administrator can publish it as the shared base.</p>
                    </div>
                </div>
                <SelectField
                    disabled={busy}
                    label="Import behavior"
                    onChange={setImportMode}
                    options={importModeOptions}
                    required
                    value={importMode}
                />
                {importMode === "replace" ? (
                    <p className={styles.warning} role="note">Replace mode overwrites your complete local working copy after confirmation.</p>
                ) : null}
                <input
                    accept="application/json,.json"
                    className={styles.hiddenInput}
                    onChange={handleFileChange}
                    ref={fileInputReference}
                    type="file"
                />
                <Button disabled={busy} onClick={() => fileInputReference.current?.click()} variant="secondary">
                    Choose JSON file
                </Button>
            </section> : null}

            <section>
                <div className={styles.heading}>
                    <span aria-hidden="true">↻</span>
                    <div>
                        <h3>Refresh shared data</h3>
                        <p>Fetch the latest dataset currently published for every visitor.</p>
                    </div>
                </div>
                <Button disabled={busy} onClick={onRefresh} variant="secondary">
                    Refresh
                </Button>
            </section>

            <section>
                <div className={styles.heading}>
                    <span aria-hidden="true">⇩</span>
                    <div>
                        <h3>Export JSON</h3>
                        <p>Create a portable, versioned backup from your current working copy.</p>
                    </div>
                </div>
                <SelectField
                    disabled={busy}
                    label="Export scope"
                    onChange={setExportScope}
                    options={exportScopeOptions}
                    required
                    value={exportScope}
                />
                <Button disabled={busy} onClick={() => onExport(exportScope)} variant="primary">
                    Export JSON
                </Button>
                {lastExportedAt ? <p className={styles.meta}>Last export: {lastExportedAt}</p> : null}
            </section>

            {statusMessage ? <p aria-live="polite" className={styles.status}>{statusMessage}</p> : null}
        </div>
    );
}

