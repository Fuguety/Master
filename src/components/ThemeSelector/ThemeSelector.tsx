import type { ThemeDefinition, ThemeId } from "../../types";
import styles from "./ThemeSelector.module.css";

export interface ThemeSelectorProps
{
    disabled?: boolean;
    onChange: (theme: ThemeId) => void;
    themes: readonly ThemeDefinition[];
    value: ThemeId;
}

/**
 * Renders five controlled, presentation-only theme choices as accessible radios.
 * Used by the settings panel independently from application business state.
 * Emits a supported theme identifier to the owning theme controller.
 */
export function ThemeSelector({ disabled = false, onChange, themes, value }: ThemeSelectorProps)
{
    return (
        <fieldset className={styles.selector} disabled={disabled}>
            <legend>Visual theme</legend>
            <div className={styles.options}>
                {themes.map((theme) => (
                    <label data-selected={theme.id === value} key={theme.id}>
                        <input
                            checked={theme.id === value}
                            name="visual-theme"
                            onChange={() => onChange(theme.id)}
                            type="radio"
                            value={theme.id}
                        />
                        <span aria-hidden="true" className={styles.swatch} data-theme-swatch={theme.id} />
                        <span className={styles.text}>
                            <strong>{theme.label}</strong>
                            <small>{theme.description}</small>
                        </span>
                    </label>
                ))}
            </div>
        </fieldset>
    );
}

