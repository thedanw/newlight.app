"use client";
import {forwardRef} from "react";
import {Stack, HStack} from "styled-system/jsx";
import {mainListSlotClassNames} from "./main-list-context";

export interface RowToolbarProps {
    open?: boolean;
    children?: React.ReactNode;
    duration?: number;
}

export const RowToolbar = forwardRef<HTMLDivElement, RowToolbarProps>(function RowToolbar(
    {open = false, children, ...props},
    ref
) {
    return (
        <Stack ref={ref} className={mainListSlotClassNames.rowToolbar()} data-open={open} {...props}>
            <HStack className="main-list__row-toolbar-group">{children}</HStack>
        </Stack>
    );
});
RowToolbar.displayName = "MainList.Row.Toolbar";
