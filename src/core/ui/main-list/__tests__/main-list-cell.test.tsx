"use client";
import {describe, it, expect} from "vitest";
import {render, screen} from "@testing-library/react";
import {MainList} from "..";

describe("MainList Row.Cell", () => {
    it("renders children inside a cell", () => {
        render(
            <MainList.Cell width="1fr" align="left">
                Cell content
            </MainList.Cell>,
        );
        expect(screen.getByText("Cell content")).toBeInTheDocument();
    });

    it("applies width style to cell", () => {
        const {container} = render(
            <MainList.Cell width="120px" align="center">
                Width cell
            </MainList.Cell>,
        );
        const cell = container.firstElementChild;
        expect(cell).not.toBeNull();
        expect(cell!.getAttribute("style")).toContain("width: 120px");
    });

    it("applies align style to cell", () => {
        const {container} = render(
            <MainList.Cell width="1fr" align="center">
                Align cell
            </MainList.Cell>,
        );
        const cell = container.firstElementChild;
        expect(cell).not.toBeNull();
        expect(cell!.getAttribute("style")).toContain("text-align: center");
    });

    it("applies flex style to cell", () => {
        const {container} = render(
            <MainList.Cell width="1fr" align="left" flex="1 1 0%">
                Flex cell
            </MainList.Cell>,
        );
        const cell = container.firstElementChild;
        expect(cell).not.toBeNull();
        const style = cell!.getAttribute("style") || "";
        expect(style).toContain("flex-grow: 1");
        expect(style).toContain("flex-shrink: 1");
        expect(style).toContain("flex-basis: 0%");
    });
});