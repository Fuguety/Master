import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FloatingWindowManager } from "../components/FloatingWindowManager/FloatingWindowManager";
import { ResizablePanel } from "../components/ResizablePanel/ResizablePanel";

afterEach(() =>
{
    vi.unstubAllGlobals();
});

describe("resizable panels and floating windows", () =>
{
    it("resizes a panel within configured bounds", () =>
    {
        vi.stubGlobal("PointerEvent", MouseEvent);
        const onWidthChange = vi.fn();
        render(<ResizablePanel onWidthChange={onWidthChange} width={432}>Panel</ResizablePanel>);
        const handle = screen.getByRole("separator", { name: "Resize panel" });

        fireEvent.pointerDown(handle, { clientX: 432, pointerId: 1 });
        fireEvent.pointerMove(handle, { clientX: 600, pointerId: 1 });
        expect(onWidthChange).toHaveBeenCalledWith(600);
    });

    it("opens multiple unique windows and independently minimizes and closes them", () =>
    {
        const onClose = vi.fn();
        render(
            <FloatingWindowManager
                items={[
                    { content: <p>Alpha content</p>, id: "alpha", title: "Alpha" },
                    { content: <p>Beta content</p>, id: "beta", title: "Beta" },
                    { content: <p>Duplicate content</p>, id: "alpha", title: "Alpha duplicate" },
                ]}
                onClose={onClose}
            />,
        );

        expect(screen.getAllByRole("region")).toHaveLength(2);
        fireEvent.click(screen.getByRole("button", { name: "Minimize Alpha duplicate" }));
        expect(screen.getByText("Duplicate content").closest("section")).toHaveAttribute("data-minimized", "true");
        expect(screen.getByText("Beta content")).toBeVisible();
        fireEvent.click(screen.getByRole("button", { name: "Close Beta" }));
        expect(onClose).toHaveBeenCalledWith("beta");
    });
});
