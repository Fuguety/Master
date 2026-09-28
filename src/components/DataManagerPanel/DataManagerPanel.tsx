import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Button } from "../Button/Button";
import { SelectField } from "../forms/SelectField";
import styles from "./DataManagerPanel.module.css";

export type ImportMode = "merge" | "replace";
export type ExportScope = "all" | "universities" | "companies" | "country-overlays";

export interface DataManagerPanelProps
{
    busy?: boolean;
    lastExportedAt?: string;
    onExport: (scope: ExportScope) => void;
    onImport: (file: File, mode: ImportMode) => void;
    statusMessage?: string;
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
    lastExportedAt,
    onExport,
    onImport,
    statusMessage,
}: DataManagerPanelProps)
{
    const fileInputReference = useRef<HTMLInputElement>(null);
    const [importMode, setImportMode] = useState<ImportMode>("merge");
    const [exportScope, setExportScope] = useState<ExportScope>("all");
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
            <section>
                <div className={styles.heading}>
                    <span aria-hidden="true">⇧</span>
                    <div>
                        <h3>Import JSON</h3>
                        <p>Load a previously exported bundle. Every record is validated before storage.</p>
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
                    <p className={styles.warning} role="note">Replace mode overwrites all current local records after validation.</p>
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
            </section>

            <section>
                <div className={styles.heading}>
                    <span aria-hidden="true">⇩</span>
                    <div>
                        <h3>Export JSON</h3>
                        <p>Create a portable, versioned backup from local application data.</p>
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

