import * as React from "react";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { AnimatePresence, type Transition, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

interface SelectHighlightContextType {
    highlightLayoutId: string;
    activeItemId: string | null;
    setActiveItem: (id: string) => void;
    clearActiveItemWithDelay: () => void;
}

const SelectHighlightContext = React.createContext<SelectHighlightContextType | null>(null);

export type SelectProps<ItemValue = unknown, Multiple extends boolean = boolean> = SelectPrimitive.Root.Props<
    ItemValue,
    Multiple
>;

function Select<ItemValue = unknown, Multiple extends boolean = boolean>({
    ...props
}: SelectProps<ItemValue, Multiple>) {
    return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
    return <SelectPrimitive.Group data-slot="select-group" className={cn("scroll-my-1 p-1", className)} {...props} />;
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
    return (
        <SelectPrimitive.Value data-slot="select-value" className={cn("flex flex-1 text-left", className)} {...props} />
    );
}

export interface SelectTriggerProps extends SelectPrimitive.Trigger.Props {
    size?: "sm" | "default";
}

function SelectTrigger({ className, size = "default", children, ...props }: SelectTriggerProps) {
    return (
        <SelectPrimitive.Trigger
            data-slot="select-trigger"
            data-size={size}
            className={cn(
                "flex w-fit min-h-11 items-center justify-between gap-2 rounded-lg border border-line bg-transparent px-3 text-sm text-white whitespace-nowrap transition-colors outline-none hover:border-accent/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-11 data-[size=sm]:h-9 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                className,
            )}
            {...props}>
            {children}
            <SelectPrimitive.Icon
                render={
                    <ChevronDownIcon className="pointer-events-none size-4 shrink-0 text-muted transition-transform duration-200 in-data-[popup-open]:rotate-180" />
                }
            />
        </SelectPrimitive.Trigger>
    );
}

export interface SelectContentProps
    extends
        SelectPrimitive.Popup.Props,
        Pick<
            SelectPrimitive.Positioner.Props,
            "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger" | "collisionPadding"
        > {
    transition?: Transition;
}

function SelectContent({
    className,
    children,
    side = "bottom",
    sideOffset = 4,
    align = "start",
    alignOffset = 0,
    alignItemWithTrigger = false,
    collisionPadding = 12,
    transition = { type: "spring", stiffness: 380, damping: 26, mass: 0.8 },
    ...props
}: SelectContentProps) {
    const reduceMotion = useReducedMotion();
    const parentHighlightContext = React.useContext(SelectHighlightContext);

    const generatedLayoutId = React.useId();
    const highlightLayoutId = parentHighlightContext?.highlightLayoutId ?? generatedLayoutId;

    const [localActiveItemId, setLocalActiveItemId] = React.useState<string | null>(null);
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const setLocalActiveItem = React.useCallback((id: string) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setLocalActiveItemId(id);
    }, []);

    const clearLocalActiveItemWithDelay = React.useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setLocalActiveItemId(null);
        }, 180);
    }, []);

    const setActiveItem = parentHighlightContext?.setActiveItem ?? setLocalActiveItem;
    const clearActiveItemWithDelay =
        parentHighlightContext?.clearActiveItemWithDelay ?? clearLocalActiveItemWithDelay;

    const activeItemId = parentHighlightContext ? parentHighlightContext.activeItemId : localActiveItemId;

    const highlightValue: SelectHighlightContextType = parentHighlightContext ?? {
        highlightLayoutId,
        activeItemId,
        setActiveItem,
        clearActiveItemWithDelay,
    };

    return (
        <SelectPrimitive.Portal>
            <SelectPrimitive.Positioner
                side={side}
                sideOffset={sideOffset}
                align={align}
                alignOffset={alignOffset}
                alignItemWithTrigger={alignItemWithTrigger}
                collisionPadding={collisionPadding}
                className="isolate z-[100]">
                <SelectPrimitive.Popup
                    data-slot="select-content"
                    {...props}
                    render={(popupProps, state) => (
                        <AnimatePresence initial={false}>
                            {state.open && (
                                <motion.div
                                    {...(popupProps as unknown as React.ComponentProps<typeof motion.div>)}
                                    key="select-popup"
                                    initial={
                                        reduceMotion
                                            ? { opacity: 0 }
                                            : {
                                                  opacity: 0,
                                                  scale: 0.95,
                                                  y: side === "bottom" ? -8 : side === "top" ? 8 : 0,
                                                  x: side === "right" ? -10 : side === "left" ? 10 : 0,
                                              }
                                    }
                                    animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                                    exit={
                                        reduceMotion
                                            ? { opacity: 0 }
                                            : {
                                                  opacity: 0,
                                                  scale: 0.95,
                                                  y: side === "bottom" ? -6 : side === "top" ? 6 : 0,
                                                  x: side === "right" ? -8 : side === "left" ? 8 : 0,
                                              }
                                    }
                                    transition={reduceMotion ? { duration: 0.01 } : transition}
                                    className={cn(
                                        "relative isolate z-[100] max-h-(--available-height) w-(--anchor-width) min-w-40 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-xl border border-line bg-ink/95 p-1.5 text-white shadow-2xl backdrop-blur-xl",
                                        className,
                                    )}>
                                    <SelectHighlightContext.Provider value={highlightValue}>
                                        <div onPointerLeave={clearActiveItemWithDelay} className="contents">
                                            <SelectScrollUpButton />
                                            <SelectPrimitive.List>{children}</SelectPrimitive.List>
                                            <SelectScrollDownButton />
                                        </div>
                                    </SelectHighlightContext.Provider>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                />
            </SelectPrimitive.Positioner>
        </SelectPrimitive.Portal>
    );
}

function SelectLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
    return (
        <SelectPrimitive.GroupLabel
            data-slot="select-label"
            className={cn("px-3 py-2 font-mono text-xs uppercase tracking-widest text-muted", className)}
            {...props}
        />
    );
}

export type SelectItemProps = SelectPrimitive.Item.Props;

function SelectItem({ className, children, ...props }: SelectItemProps) {
    const reduceMotion = useReducedMotion();
    const highlightContext = React.useContext(SelectHighlightContext);
    const itemId = React.useId();

    return (
        <SelectPrimitive.Item
            data-slot="select-item"
            className={className}
            {...props}
            render={(itemProps, state) => {
                const isCurrentActive = highlightContext?.activeItemId === itemId;

                return (
                    <motion.div
                        {...(itemProps as unknown as React.ComponentProps<typeof motion.div>)}
                        onPointerEnter={(e: React.PointerEvent<HTMLDivElement>) => {
                            itemProps.onPointerEnter?.(e);
                            highlightContext?.setActiveItem(itemId);
                        }}
                        onFocus={(e: React.FocusEvent<HTMLDivElement>) => {
                            itemProps.onFocus?.(e);
                            highlightContext?.setActiveItem(itemId);
                        }}
                        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className={cn(
                            "group/select-item relative flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg py-2 pr-9 pl-3 text-sm text-white outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
                            (state.highlighted || isCurrentActive) && "text-accent",
                            className,
                        )}>
                        {isCurrentActive && highlightContext?.highlightLayoutId && (
                            <motion.div
                                layoutId={highlightContext.highlightLayoutId}
                                className="pointer-events-none absolute inset-0 z-0 rounded-lg bg-white/10"
                                transition={{ type: "spring", stiffness: 450, damping: 32 }}
                            />
                        )}
                        <SelectPrimitive.ItemText className="relative z-10 flex flex-1 shrink-0 gap-2 whitespace-nowrap">
                            {children}
                        </SelectPrimitive.ItemText>
                        <span
                            className="pointer-events-none absolute right-3 z-10 flex size-4 items-center justify-center"
                            data-slot="select-item-indicator">
                            <SelectPrimitive.ItemIndicator>
                                <motion.span
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                                    className="flex items-center justify-center">
                                    <CheckIcon className="pointer-events-none size-4 text-accent" aria-hidden="true" />
                                </motion.span>
                            </SelectPrimitive.ItemIndicator>
                        </span>
                    </motion.div>
                );
            }}
        />
    );
}

function SelectSeparator({ className, ...props }: SelectPrimitive.Separator.Props) {
    return (
        <SelectPrimitive.Separator
            data-slot="select-separator"
            className={cn("pointer-events-none -mx-1 my-1 h-px bg-line", className)}
            {...props}
        />
    );
}

function SelectScrollUpButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
    return (
        <SelectPrimitive.ScrollUpArrow
            data-slot="select-scroll-up-button"
            className={cn(
                "top-0 z-10 flex w-full cursor-default items-center justify-center bg-ink/95 py-1 text-muted [&_svg:not([class*='size-'])]:size-4",
                className,
            )}
            {...props}>
            <ChevronUpIcon />
        </SelectPrimitive.ScrollUpArrow>
    );
}

function SelectScrollDownButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
    return (
        <SelectPrimitive.ScrollDownArrow
            data-slot="select-scroll-down-button"
            className={cn(
                "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-ink/95 py-1 text-muted [&_svg:not([class*='size-'])]:size-4",
                className,
            )}
            {...props}>
            <ChevronDownIcon />
        </SelectPrimitive.ScrollDownArrow>
    );
}

export {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectScrollDownButton,
    SelectScrollUpButton,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
};
