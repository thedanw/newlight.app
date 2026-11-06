"use client";
import {forwardRef} from "react";
import {Stack} from "styled-system/jsx";
import {mainListSlotClassNames} from "./main-list-context";

export interface MainListRowCellProps {
    /** Column width (CSS) */
    width?: string;
    /** Column alignment */
    align?: "left" | "center" | "right";
    /** Flex value for flex container */
    flex?: string;
    /** Minimum width (for flex columns) */
    minWidth?: string | number;
    /** Cell content */
    children?: React.ReactNode;
}

export const Cell = forwardRef<HTMLDivElement, MainListRowCellProps>(function Cell(
    {width, align, flex, minWidth, children, ...props},
    ref
) {
    return (
        <Stack
            ref={ref}
            className={mainListSlotClassNames.rowCell()}
            style={{
                width,
                minWidth,
                maxWidth: width,
                textAlign: align,
                alignItems: align,
                flex,
                ...props.style,
            }}
            {...props}>
            {children}
        </Stack>
    );
});
Cell.displayName = "MainList.Row.Cell";
