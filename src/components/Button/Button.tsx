import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "danger" | "quiet";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>
{
    children: ReactNode;
    fullWidth?: boolean;
    variant?: ButtonVariant;
}

/**
 * Renders the shared accessible action button used throughout panels and forms.
 * Used by all presentation features to keep action hierarchy consistent.
 * Accepts native button attributes plus visual variant and width options.
 */
export function Button({
    children,
    className = "",
    fullWidth = false,
    type = "button",
    variant = "secondary",
    ...buttonProperties
}: ButtonProps)
{
    const classes = [
        styles.button,
        styles[variant],
        fullWidth ? styles.fullWidth : "",
        className,
    ].filter(Boolean).join(" ");

    return (
        <button className={classes} type={type} {...buttonProperties}>
            {children}
        </button>
    );
}

