"use client";
import {forwardRef} from "react";
import {Edit2, X} from "lucide-react";
import {Icon} from "../icon";
import {IconButton} from "../icon-button";
import {mainListSlotClassNames} from "./main-list-context";

export interface RowButtonProps {
    icon?: React.ReactNode;
    label?: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onToggle?: (isOpen: boolean) => void;
    isOpen?: boolean;
    disabled?: boolean;
    variant?: "plain" | "outline";
    size?: "sm" | "md" | "lg";
    /** ARIA attribute for controlling element relationship */
    "aria-controls"?: string;
}

export const RowButton = forwardRef<HTMLButtonElement, RowButtonProps>(function RowButton(
    {
        icon,
        label = "Manage",
        onClick,
        onToggle,
        isOpen = false,
        disabled = false,
        variant = "plain",
        size = "md",
        ...props
    },
    ref
) {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e);
        if (onToggle) {
            onToggle(!isOpen);
        }
    };

    return (
        <IconButton
            ref={ref}
            variant={variant}
            size={size}
            onClick={handleClick}
            disabled={disabled}
            aria-label={label}
            aria-expanded={isOpen}
            aria-controls={props["aria-controls"]}
            className={mainListSlotClassNames.rowButton()}
            {...props}>
            <Icon size="sm">{isOpen ? <X /> : icon ?? <Edit2 />}</Icon>
        </IconButton>
    );
});
RowButton.displayName = "MainList.Row.Button";
