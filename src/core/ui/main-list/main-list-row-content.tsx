"use client";
import {forwardRef, isValidElement, cloneElement, Children} from "react";
import {Text} from "../text";
import {Stack, HStack} from "styled-system/jsx";
import {mainListSlotClassNames} from "./main-list-context";
import type {MainListHeaderConfig} from "./main-list.types";
import {getCellPropsFromHeader} from "./main-list-column-utils";

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
    /** Additional CSS styles */
    style?: React.CSSProperties;
}

export const RowContent = forwardRef<HTMLDivElement, RowContentProps>(function RowContent(
    {primary, secondary, meta, children, headers, ...props},
    ref
) {
    // Column styles are defined in headers config; no additional style calculation needed

    if (children) {
        // Apply header styles to Cell children automatically
        const childrenWithStyles = headers
            ? Children.map(children, (child, index) => {
                  if (!isValidElement(child)) return child;
                  const header = headers[index];
                  if (!header) return child;
                  // Only apply styles to Cell components (or elements with rowCell class)
                  const childType = child.type as React.ComponentType<any>;
                  const childProps = child.props as { className?: string | string[] };
                  const isCell =
                      childType?.displayName?.includes("Cell") ||
                      (childProps.className?.includes?.("rowCell"));
                  if (!isCell) return child;
                  return cloneElement(child as React.ReactElement<any>, {
                      ...getCellPropsFromHeader(header),
                  });
              })
            : children;

        return (
            <HStack ref={ref} className={mainListSlotClassNames.rowContent()} {...props}>
                {childrenWithStyles}
            </HStack>
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
                <>
                    <Text color="fg.muted" fontSize="sm" mt="2">
                        {meta}
                    </Text>
                </>
            )}
        </Stack>
    );
});
RowContent.displayName = "MainList.Row.Content";
