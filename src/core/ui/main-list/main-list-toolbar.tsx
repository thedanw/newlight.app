"use client";
import {forwardRef} from "react";
import {X, Trash2, ListChecks} from "lucide-react";
import {Icon} from "../icon";
import {Button} from "../button";
import {Stack, HStack} from "styled-system/jsx";
import {css} from "styled-system/css";
import {mainListSlotClassNames} from "./main-list-context";

export interface ToolbarProps {
    primaryActions?: React.ReactNode;
    secondaryActions?: React.ReactNode;
    massManage?: React.ReactNode;
}

export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
    {primaryActions, secondaryActions, massManage, ...props},
    ref
) {
    return (
        <HStack ref={ref} className={mainListSlotClassNames.toolbar()} {...props}>
            {primaryActions}
            {secondaryActions}
            {massManage}
        </HStack>
    );
});
Toolbar.displayName = "MainList.Toolbar";

/** PrimaryActions slot */
export interface PrimaryActionsProps {
    children?: React.ReactNode;
}

export const PrimaryActions = forwardRef<HTMLDivElement, PrimaryActionsProps>(function PrimaryActions(
    {children, ...props},
    ref
) {
    return (
        <HStack ref={ref} className={mainListSlotClassNames.primaryActions()} {...props}>
            {children}
        </HStack>
    );
});
PrimaryActions.displayName = "MainList.Toolbar.PrimaryActions";

/** SecondaryActions slot */
export interface SecondaryActionsProps {
    children?: React.ReactNode;
}

export const SecondaryActions = forwardRef<HTMLDivElement, SecondaryActionsProps>(function SecondaryActions(
    {children, ...props},
    ref
) {
    return (
        <HStack ref={ref} className={mainListSlotClassNames.secondaryActions()} {...props}>
            {children}
        </HStack>
    );
});
SecondaryActions.displayName = "MainList.Toolbar.SecondaryActions";

/** MassManage component */
export interface MassManageProps {
    selectedCount: number;
    allVisibleSelected: boolean;
    allFilteredSelected: boolean;
    onSelectVisible: () => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onDeleteSelected: () => Promise<void>;
    onClose: () => void;
    deleting?: boolean;
}

export const MassManage = forwardRef<HTMLDivElement, MassManageProps>(function MassManage(
    {
        selectedCount = 0,
        allVisibleSelected = false,
        allFilteredSelected = false,
        onSelectVisible,
        onSelectAll,
        onDeselectAll,
        onDeleteSelected,
        onClose,
        deleting = false,
        ...props
    },
    ref
) {
    return (
        <Stack ref={ref} className={mainListSlotClassNames.massManage()} data-visible={selectedCount > 0} {...props}>
            {selectedCount > 0 && (
                <HStack style={{flex: 1, justifyContent: "flex-start"}}>
                    <Button variant="plain" size="fluidMd" onClick={onSelectAll} disabled={allFilteredSelected}>
                        Select All
                    </Button>
                    <Button variant="plain" size="fluidMd" onClick={onSelectVisible} disabled={allVisibleSelected}>
                        Select Visible
                    </Button>
                    <Button variant="plain" size="fluidMd" onClick={onDeselectAll}>
                        Deselect All
                    </Button>
                    <Button
                        variant="solid"
                        colorPalette="red"
                        size="fluidMd"
                        onClick={onDeleteSelected}
                        disabled={deleting || selectedCount === 0}>
                        <Icon>
                            <Trash2 />
                        </Icon>
                        ({selectedCount})
                    </Button>
                    <Button variant="plain" size="fluidMd" onClick={onClose} aria-label="Clear selection">
                        <Icon>
                            <X />
                        </Icon>
                    </Button>
                    <span className={css({fontSize: "xs", color: "fg.default", px: "2"})}>
                        {selectedCount} selected
                    </span>
                </HStack>
            )}
        </Stack>
    );
});
MassManage.displayName = "MainList.Toolbar.MassManage";

/** MassManage trigger button */
export interface MassManageButtonProps {
    onClick: () => void;
    isOpen?: boolean;
}

export const MassManageButton = forwardRef<HTMLButtonElement, MassManageButtonProps>(function MassManageButton(
    {onClick, isOpen = false, ...props},
    ref
) {
    return (
        <Button ref={ref} variant="outline" size="fluidSm" onClick={onClick} data-open={isOpen} {...props}>
            <Icon size="sm">
                <ListChecks />
            </Icon>
            Mass Manage
        </Button>
    );
});
MassManageButton.displayName = "MainList.Toolbar.MassManageButton";

/** Toolbar slot exports */
Object.assign(Toolbar, {
    PrimaryActions,
    SecondaryActions,
    MassManage,
    MassManageButton,
});
