"use client";
import {type ComponentProps, useRef, useEffect, useId, isValidElement, cloneElement, type ReactElement} from "react";
import {mainListSlotClassNames, mainListOverlay} from "./main-list-context";
import {RowToolbar} from "./main-list-row-toolbar";
import {RowContent} from "./main-list-row-content";
import {Stack} from "styled-system/jsx";
import type {RowSelectProps} from "./main-list-row-select";
import type {MainListHeaderConfig} from "./main-list.types";
export type RowProps<T> = ComponentProps<typeof RowWrapper<T>>;

/** Props injected into a passed-in row button to make it the accessible trigger. */
type RowTriggerProps = {
    onClick?: (e: React.MouseEvent) => void;
    "aria-expanded"?: boolean;
    "aria-controls"?: string;
    onToggle?: (isOpen: boolean) => void;
    isOpen?: boolean;
};

export function RowWrapper<T>({
    item,
    index,
    selected = false,
    selectMode = false,
    onClick,
    children,
    select,
    button,
    toolbar,
    headers,
    onSelect,
    open = false,
    onClose,
    onOpen,
    ...props
}: {
    item: T;
    index: number;
    selected?: boolean;
    selectMode?: boolean;
    onClick?: () => void;
    children?: React.ReactNode;
    select?: React.ReactNode;
    button?: React.ReactNode;
    toolbar?: React.ReactNode;
    headers?: MainListHeaderConfig[];
    onSelect?: () => void;
    open?: boolean;
    onClose?: () => void;
    onOpen?: () => void;
} & ComponentProps<"div">) {
    const rowRef = useRef<HTMLDivElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const toolbarId = useId();

    // Move focus into the toolbar when it opens so keyboard users land there.
    useEffect(() => {
        if (open) toolbarRef.current?.focus();
    }, [open]);

    const handleRowClick = () => {
        if (!open && onClick) {
            onClick();
        }
    };

    const handleToolbarClose = () => {
        onClose?.();
    };

    const handleToolbarOpen = () => {
        onOpen?.();
    };

    const handleToggle = (isOpen: boolean) => {
        if (isOpen) {
            handleToolbarOpen();
        } else {
            handleToolbarClose();
        }
    };

    return (
        <>
            {open && <div className={mainListOverlay} onClick={handleToolbarClose} role="presentation" />}
            <div
                ref={rowRef}
                className={mainListSlotClassNames.rowWrapper()}
                data-selected={selected}
                data-select-mode={selectMode}
                data-toolbar-open={open}
                data-select-open={open}
                onClick={handleRowClick}
                {...props}>
                {isValidElement(select) && open
                    ? cloneElement(select as ReactElement<RowSelectProps>, {
                          checked: false,
                          onChange: (checked: boolean) => {
                              if (checked) {
                                  onClose?.();
                                  onSelect?.();
                              }
                          },
                      })
                    : select}
                {children ?? <RowContent headers={headers} />}
                <Stack className={mainListSlotClassNames.rowButton()}>
                    {!open &&
                        button &&
                        (isValidElement(button)
                            ? cloneElement(button as ReactElement<RowTriggerProps>, {
                                  onClick: (e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      handleToolbarOpen();
                                  },
                                  "aria-expanded": false,
                                  "aria-controls": toolbarId,
                              })
                            : button)}
                    {open &&
                        button &&
                        (isValidElement(button)
                            ? cloneElement(button as ReactElement<RowTriggerProps>, {
                                  onToggle: handleToggle,
                                  isOpen: true,
                                  "aria-expanded": true,
                                  "aria-controls": toolbarId,
                              })
                            : button)}
                </Stack>
                {toolbar && (
                    <RowToolbar ref={toolbarRef} open={open} id={toolbarId} tabIndex={-1 as any} {...({} as any)}>
                        {toolbar}
                    </RowToolbar>
                )}
            </div>
        </>
    );
}
RowWrapper.displayName = "MainList.RowWrapper";

// Re-export sub-components
export {RowSelect} from "./main-list-row-select";
export {RowButton} from "./main-list-row-button";
export {RowToolbar} from "./main-list-row-toolbar";
export {RowContent} from "./main-list-row-content";
