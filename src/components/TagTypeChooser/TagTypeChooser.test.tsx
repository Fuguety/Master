import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TagTypeChooser } from "./TagTypeChooser";

describe("TagTypeChooser", () =>
{
    it("announces the clicked coordinates and emits the selected type", () =>
    {
        const onSelect = vi.fn();

        render(
            <TagTypeChooser
                coordinates={{ latitude: -23.5505, longitude: -46.6333 }}
                locale="en-US"
                onCancel={vi.fn()}
                onSelect={onSelect}
            />,
        );

        expect(screen.getByText("-23.5505, -46.6333")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /university/i }));
        expect(onSelect).toHaveBeenCalledWith("university");
    });
});

