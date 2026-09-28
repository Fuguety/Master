import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./IconButton.module.css";

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label">
{
    label: string;
    children: ReactNode;
    pressed?: boolean;
}

/**
 * Renders a square icon action with a mandatory accessible label.
 * Used by map rails, headers, dialogs, and compact popup actions.
 * Supports the native pressed state for toggle controls.
 */
export function IconButton({
    children,
    className = "",
    label,
    pressed,
    type = "button",
    ...buttonProperties
}: IconButtonProps)
{
    return (
        <button
            aria-label={label}
            aria-pressed={pressed}
            className={`${styles.button} ${className}`.trim()}
            title={label}
            type={type}
            {...buttonProperties}
        >
            {children}
        </button>
    );
}

