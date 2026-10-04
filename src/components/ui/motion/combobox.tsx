"use client";
// Adapted from Pace UI "motion-combobox" (https://ui.paceui.com/r/motion-combobox.json), built on
// @base-ui/react Combobox + motion. Kept: the spring popup reveal, gliding shared-layout highlight,
// animated check indicator and all base-ui behaviour (keyboard, filtering, ARIA). Changes:
// - Tailwind classes replaced with scoped CSS classes (`pace-combobox-*`, styled by the consumer)
// - parts that need shadcn's Button/InputGroup (ComboboxInput, ComboboxClear, ComboboxChips,
//   ComboboxChip) are omitted; use ComboboxPrimitive.Input directly for input-inside-popup
// - the chevron's rotation is driven by base-ui's [data-popup-open] attribute in CSS
import * as React from "react";

import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { AnimatePresence, type Transition, motion } from "motion/react";

const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

interface ComboboxHighlightContextType {
    highlightLayoutId: string;
    activeItemId: string | null;
    setActiveItem: (id: string) => void;
    clearActiveItemWithDelay: () => void;
}

const ComboboxHighlightContext = React.createContext<ComboboxHighlightContextType | null>(null);

export type ComboboxProps<ItemValue = any, Multiple extends boolean = boolean> = ComboboxPrimitive.Root.Props<
    ItemValue,
    Multiple
>;

function Combobox<ItemValue = any, Multiple extends boolean = boolean>({
    ...props
}: ComboboxProps<ItemValue, Multiple>) {
    return <ComboboxPrimitive.Root data-slot="combobox" {...props} />;
}

function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
    return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />;
}

export interface ComboboxTriggerProps extends ComboboxPrimitive.Trigger.Props {}

function ComboboxTrigger({ className, children, ...props }: ComboboxTriggerProps) {
    return (
        <ComboboxPrimitive.Trigger
            data-slot="combobox-trigger"
            className={cn("pace-combobox-trigger", className as string)}
            {...props}>
            {children}
            <ChevronDownIcon className="pace-combobox-chevron" aria-hidden="true" />
        </ComboboxPrimitive.Trigger>
    );
}

const ComboboxInputGroup = ComboboxPrimitive.InputGroup;

export interface ComboboxContentProps
    extends
        ComboboxPrimitive.Popup.Props,
        Pick<ComboboxPrimitive.Positioner.Props, "side" | "align" | "sideOffset" | "alignOffset" | "anchor"> {
    transition?: Transition;
}

function ComboboxContent({
    className,
    side = "bottom",
    sideOffset = 6,
    align = "start",
    alignOffset = 0,
    anchor,
    transition = { type: "spring", stiffness: 380, damping: 26, mass: 0.8 },
    children,
    ...props
}: ComboboxContentProps) {
    const parentHighlightContext = React.useContext(ComboboxHighlightContext);

    const generatedLayoutId = React.useId();
    const highlightLayoutId = parentHighlightContext?.highlightLayoutId ?? generatedLayoutId;

    const [localActiveItemId, setLocalActiveItemId] = React.useState<string | null>(null);
    const timeoutRef = React.useRef<any>(null);

    const localSetActiveItem = React.useCallback((id: string) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setLocalActiveItemId(id);
    }, []);
    const localClearActiveItemWithDelay = React.useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setLocalActiveItemId(null);
        }, 180);
    }, []);

    const setActiveItem = parentHighlightContext?.setActiveItem ?? localSetActiveItem;
    const clearActiveItemWithDelay = parentHighlightContext?.clearActiveItemWithDelay ?? localClearActiveItemWithDelay;
    const activeItemId = parentHighlightContext ? parentHighlightContext.activeItemId : localActiveItemId;

    const highlightValue: ComboboxHighlightContextType = parentHighlightContext ?? {
        highlightLayoutId,
        activeItemId,
        setActiveItem,
        clearActiveItemWithDelay,
    };

    return (
        <ComboboxPrimitive.Portal keepMounted>
            <ComboboxPrimitive.Positioner
                side={side}
                sideOffset={sideOffset}
                align={align}
                alignOffset={alignOffset}
                anchor={anchor}
                className="pace-combobox-positioner">
                <ComboboxPrimitive.Popup
                    data-slot="combobox-content"
                    data-chips={!!anchor}
                    {...props}
                    render={(popupProps, state) => (
                        <AnimatePresence initial={false}>
                            {state.open && (
                                <motion.div
                                    {...(popupProps as any)}
                                    key="combobox-popup"
                                    initial={{
                                        opacity: 0,
                                        scale: 0.95,
                                        y: side === "bottom" ? -8 : side === "top" ? 8 : 0,
                                        x: side === "right" ? -10 : side === "left" ? 10 : 0,
                                    }}
                                    animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                                    exit={{
                                        opacity: 0,
                                        scale: 0.95,
                                        y: side === "bottom" ? -6 : side === "top" ? 6 : 0,
                                        x: side === "right" ? -8 : side === "left" ? 8 : 0,
                                    }}
                                    transition={transition}
                                    className={cn("pace-combobox-popup", className as string)}>
                                    <ComboboxHighlightContext.Provider value={highlightValue}>
                                        <div onPointerLeave={clearActiveItemWithDelay} style={{ display: "contents" }}>
                                            {children}
                                        </div>
                                    </ComboboxHighlightContext.Provider>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                />
            </ComboboxPrimitive.Positioner>
        </ComboboxPrimitive.Portal>
    );
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
    return (
        <ComboboxPrimitive.List
            data-slot="combobox-list"
            className={cn("pace-combobox-list", className as string)}
            {...props}
        />
    );
}

export interface ComboboxItemProps extends ComboboxPrimitive.Item.Props {}

function ComboboxItem({ className, children, ...props }: ComboboxItemProps) {
    const highlightContext = React.useContext(ComboboxHighlightContext);
    const itemId = React.useId();

    return (
        <ComboboxPrimitive.Item
            data-slot="combobox-item"
            {...props}
            render={(itemProps, state) => {
                const isCurrentActive = highlightContext?.activeItemId === itemId || state.highlighted;

                return (
                    <motion.div
                        {...(itemProps as any)}
                        onPointerEnter={(e: any) => {
                            (itemProps as any).onPointerEnter?.(e);
                            highlightContext?.setActiveItem(itemId);
                        }}
                        onFocus={(e: any) => {
                            (itemProps as any).onFocus?.(e);
                            highlightContext?.setActiveItem(itemId);
                        }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className={cn("pace-combobox-item", (state.highlighted || isCurrentActive) && "is-active", className as string)}>
                        {isCurrentActive && highlightContext?.highlightLayoutId && (
                            <motion.div
                                layoutId={highlightContext.highlightLayoutId}
                                className="pace-combobox-item__highlight"
                                transition={{ type: "spring", stiffness: 450, damping: 32 }}
                            />
                        )}
                        <span className="pace-combobox-item__label">{children}</span>
                        <span className="pace-combobox-item__indicator" data-slot="combobox-item-indicator">
                            <ComboboxPrimitive.ItemIndicator>
                                <motion.span
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                                    style={{ display: "flex" }}>
                                    <CheckIcon aria-hidden="true" />
                                </motion.span>
                            </ComboboxPrimitive.ItemIndicator>
                        </span>
                    </motion.div>
                );
            }}
        />
    );
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
    return <ComboboxPrimitive.Group data-slot="combobox-group" className={className} {...props} />;
}

function ComboboxLabel({ className, ...props }: ComboboxPrimitive.GroupLabel.Props) {
    return <ComboboxPrimitive.GroupLabel data-slot="combobox-label" className={cn("pace-combobox-group-label", className as string)} {...props} />;
}

function ComboboxCollection({ ...props }: ComboboxPrimitive.Collection.Props) {
    return <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />;
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
    return <ComboboxPrimitive.Empty data-slot="combobox-empty" className={cn("pace-combobox-empty", className as string)} {...props} />;
}

function ComboboxSeparator({ className, ...props }: ComboboxPrimitive.Separator.Props) {
    return <ComboboxPrimitive.Separator data-slot="combobox-separator" className={cn("pace-combobox-separator", className as string)} {...props} />;
}

export {
    Combobox,
    ComboboxInputGroup,
    ComboboxContent,
    ComboboxList,
    ComboboxItem,
    ComboboxGroup,
    ComboboxLabel,
    ComboboxCollection,
    ComboboxEmpty,
    ComboboxSeparator,
    ComboboxTrigger,
    ComboboxValue,
    ComboboxPrimitive,
};
