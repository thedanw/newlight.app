"use client";
import {forwardRef} from "react";
import {Text} from "../text";
import {Stack} from "styled-system/jsx";
import {mainListSlotClassNames} from "./main-list-context";
import type {MainListHeaderConfig} from "./main-list.types";

export interface RowContentProps {
    /** Primary content (e.g., name) */
    primary?: React.ReactNode;
    /** Secondary content (e.g., description) */
    secondary?: React.ReactNode;
    /** Meta content (e.g., badge) */
    meta?: React.ReactNode;
    /** Children (alternative to slots) */
    children?: React.ReactNode;
    /** Column configuration for consistent alignment across modules */
    headers?: MainListHeaderConfig[];
}

export const RowContent = forwardRef<HTMLDivElement, RowContentProps>(function RowContent(
    {primary, secondary, meta, children, headers, ...props},
    ref
) {
    // Column styles are defined in headers config; no additional style calculation needed

    if (children) {
        return (
            <Stack ref={ref} className={mainListSlotClassNames.rowContent()} {...props}>
                {children}
            </Stack>
        );
    }
    return (
        <Stack ref={ref} className={mainListSlotClassNames.rowContent()} {...props}>
            {primary && (
                <Text fontWeight="medium" truncate>
                    {primary}
                </Text>
            )}
            {secondary && (
                <Text color="fg.muted" fontSize="sm" truncate>
                    {secondary}
                </Text>
            )}
            {meta && (
                <Stack className="main-list__row-content-meta" mt="2">
                    {meta}
                </Stack>
            )}
        </Stack>
    );
});
RowContent.displayName = "MainList.Row.Content";
