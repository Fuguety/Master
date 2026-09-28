import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeProvider } from "./ThemeProvider";
import { useTheme } from "./useTheme";

/**
 * Renders a minimal consumer that changes the active theme.
 * Used by ThemeProvider tests to exercise its public context contract.
 * Displays the current theme and a control for selecting Tron.
 */
function ThemeConsumer()
{
    const { setTheme, theme } = useTheme();

    return (
        <div>
            <output>{theme}</output>
            <button onClick={() => setTheme("tron")} type="button">Use Tron</button>
        </div>
    );
}

afterEach(() =>
{
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
});

describe("ThemeProvider", () =>
{
    it("applies a selected theme to the document without changing app data", () =>
    {
        render(
            <ThemeProvider initialTheme="modern" storageKey="test-theme">
                <ThemeConsumer />
            </ThemeProvider>,
        );

        fireEvent.click(screen.getByRole("button", { name: "Use Tron" }));

        expect(screen.getByText("tron")).toBeInTheDocument();
        expect(document.documentElement.dataset.theme).toBe("tron");
        expect(window.localStorage.getItem("test-theme")).toBe("tron");
    });
});

