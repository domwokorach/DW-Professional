import * as React from "react";

import { NavigationMenu as NavigationMenuPrimitive } from "@base-ui/react/navigation-menu";
import { cva } from "class-variance-authority";
import { ChevronDownIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

interface NavigationMenuHighlightContextType {
    highlightLayoutId: string;
    activeTriggerId: string | null;
    openItemValue: unknown;
    hasActiveTrigger: boolean;
    setActiveTrigger: (id: string) => void;
    clearActiveTriggerWithDelay: () => void;
}

const NavigationMenuHighlightContext = React.createContext<NavigationMenuHighlightContextType | null>(null);

export interface NavigationMenuProps extends NavigationMenuPrimitive.Root.Props {
    positionerProps?: NavigationMenuPositionerProps;
}

type NavigationMenuChangeHandler = NonNullable<NavigationMenuPrimitive.Root.Props["onValueChange"]>;

function NavigationMenu({ className, children, positionerProps, onValueChange, ...props }: NavigationMenuProps) {
    const generatedLayoutId = React.useId();
    const [openItemValue, setOpenItemValue] = React.useState<unknown>(null);
    const [activeTriggerId, setActiveTriggerId] = React.useState<string | null>(null);
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleValueChange = React.useCallback<NavigationMenuChangeHandler>(
        (value, eventDetails) => {
            setOpenItemValue(value);
            onValueChange?.(value, eventDetails);
            if (!value) {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                    setActiveTriggerId(null);
                }, 150);
            }
        },
        [onValueChange],
    );

    const setActiveTrigger = React.useCallback((id: string) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setActiveTriggerId(id);
    }, []);

    const clearActiveTriggerWithDelay = React.useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            if (!openItemValue) {
                setActiveTriggerId(null);
            }
        }, 150);
    }, [openItemValue]);

    const hasActiveTrigger = Boolean(activeTriggerId || openItemValue);

    const highlightValue = React.useMemo(
        () => ({
            highlightLayoutId: generatedLayoutId,
            activeTriggerId,
            openItemValue,
            hasActiveTrigger,
            setActiveTrigger,
            clearActiveTriggerWithDelay,
        }),
        [
            generatedLayoutId,
            activeTriggerId,
            openItemValue,
            hasActiveTrigger,
            setActiveTrigger,
            clearActiveTriggerWithDelay,
        ],
    );

    return (
        <NavigationMenuHighlightContext.Provider value={highlightValue}>
            <NavigationMenuPrimitive.Root
                data-slot="navigation-menu"
                className={cn(
                    "group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
                    className,
                )}
                onValueChange={handleValueChange}
                onPointerLeave={clearActiveTriggerWithDelay}
                {...props}>
                {children}
                <NavigationMenuPositioner {...positionerProps} />
            </NavigationMenuPrimitive.Root>
        </NavigationMenuHighlightContext.Provider>
    );
}

export type NavigationMenuListProps = NavigationMenuPrimitive.List.Props;

function NavigationMenuList({ className, children, ...props }: NavigationMenuListProps) {
    return (
        <NavigationMenuPrimitive.List
            data-slot="navigation-menu-list"
            className={cn("group flex flex-1 list-none items-center justify-center gap-0", className)}
            {...props}>
            {children}
        </NavigationMenuPrimitive.List>
    );
}

export type NavigationMenuItemProps = NavigationMenuPrimitive.Item.Props;

function NavigationMenuItem({ className, ...props }: NavigationMenuItemProps) {
    return (
        <NavigationMenuPrimitive.Item
            data-slot="navigation-menu-item"
            className={cn("relative", className)}
            {...props}
        />
    );
}

const navigationMenuTriggerStyle = cva(
    "text-muted hover:text-paper focus:text-paper data-open:text-paper data-popup-open:text-paper rounded-full px-3.5 py-2 font-mono text-sm transition-colors disabled:opacity-50 group/navigation-menu-trigger inline-flex h-11 w-max items-center justify-center disabled:pointer-events-none outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
);

export interface NavigationMenuTriggerProps extends NavigationMenuPrimitive.Trigger.Props {
    hideArrow?: boolean;
    isActive?: boolean;
}

function NavigationMenuTrigger({
    className,
    children,
    hideArrow = false,
    isActive = false,
    ...props
}: NavigationMenuTriggerProps) {
    const highlightContext = React.useContext(NavigationMenuHighlightContext);
    const triggerId = React.useId();
    const reduceMotion = useReducedMotion();

    return (
        <NavigationMenuPrimitive.Trigger
            data-slot="navigation-menu-trigger"
            nativeButton={false}
            {...props}
            render={(triggerProps, state) => {
                const isHovered = highlightContext?.activeTriggerId === triggerId;
                const isOpen = state.open;
                const isItemActive = isHovered || isOpen;
                const isCurrentActive = isItemActive || (!highlightContext?.hasActiveTrigger && isActive);

                return (
                    <div
                        {...triggerProps}
                        onPointerEnter={(e) => {
                            triggerProps.onPointerEnter?.(e);
                            highlightContext?.setActiveTrigger(triggerId);
                        }}
                        onFocus={(e) => {
                            triggerProps.onFocus?.(e);
                            highlightContext?.setActiveTrigger(triggerId);
                        }}
                        className={cn(
                            "group/navigation-menu-trigger relative inline-flex h-11 w-max cursor-default items-center justify-center rounded-full px-3.5 py-2 font-mono text-sm outline-none select-none disabled:pointer-events-none disabled:opacity-50",
                            className,
                        )}>
                        {isCurrentActive && highlightContext?.highlightLayoutId && (
                            <motion.div
                                layoutId={highlightContext.highlightLayoutId}
                                className="bg-accent/10 pointer-events-none absolute inset-0 z-0 rounded-full"
                                transition={reduceMotion ? { duration: 0.01 } : { duration: 0.18, ease: "easeInOut" }}
                            />
                        )}
                        <span className="relative z-10 flex items-center justify-center">
                            {children}
                            {!hideArrow && (
                                <ChevronDownIcon
                                    className={cn(
                                        "relative top-px ml-1 size-3 transition-transform duration-200 ease-out",
                                        state.open && "rotate-180",
                                    )}
                                    aria-hidden="true"
                                />
                            )}
                        </span>
                    </div>
                );
            }}
        />
    );
}

export type NavigationMenuContentProps = NavigationMenuPrimitive.Content.Props;

function NavigationMenuContent({ className, ...props }: NavigationMenuContentProps) {
    return (
        <NavigationMenuPrimitive.Content
            data-slot="navigation-menu-content"
            className={cn(
                "h-full w-max max-w-[calc(100vw-32px)] p-1 outline-none",
                "[transform:translateX(0)] [transition:opacity_240ms_ease,transform_300ms_cubic-bezier(0.16,1,0.3,1)]",
                "data-ending-style:opacity-0 data-starting-style:opacity-0",
                "data-starting-style:data-[activation-direction*=left]:[transform:translateX(-40%)] data-starting-style:data-[activation-direction*=right]:[transform:translateX(40%)]",
                "data-ending-style:data-[activation-direction*=left]:[transform:translateX(40%)] data-ending-style:data-[activation-direction*=right]:[transform:translateX(-40%)]",
                "group-data-[activation-direction*=left]:data-starting-style:[transform:translateX(-40%)] group-data-[activation-direction*=right]:data-starting-style:[transform:translateX(40%)]",
                "group-data-[activation-direction*=left]:data-ending-style:[transform:translateX(40%)] group-data-[activation-direction*=right]:data-ending-style:[transform:translateX(-40%)]",
                "group-data-[viewport=false]/navigation-menu:bg-ink/95 group-data-[viewport=false]/navigation-menu:text-paper group-data-[viewport=false]/navigation-menu:border group-data-[viewport=false]/navigation-menu:border-line group-data-[viewport=false]/navigation-menu:rounded-xl group-data-[viewport=false]/navigation-menu:shadow-2xl group-data-[viewport=false]/navigation-menu:backdrop-blur-xl **:data-[slot=navigation-menu-link]:focus:outline-none",
                className,
            )}
            {...props}
        />
    );
}

export interface NavigationMenuPositionerProps extends NavigationMenuPrimitive.Positioner.Props {
    popupClassName?: string;
}

function NavigationMenuPositioner({
    className,
    side = "bottom",
    sideOffset = 6,
    align = "start",
    alignOffset = 0,
    popupClassName,
    ...props
}: NavigationMenuPositionerProps) {
    return (
        <NavigationMenuPrimitive.Portal>
            <NavigationMenuPrimitive.Positioner
                data-slot="navigation-menu-positioner"
                side={side}
                sideOffset={sideOffset}
                align={align}
                alignOffset={alignOffset}
                className={cn(
                    "isolate z-[100] h-[var(--positioner-height)] w-[var(--positioner-width)] max-w-[var(--available-width)] transition-[top,left,right,bottom] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-instant:transition-none data-[side=bottom]:before:-top-2.5 data-[side=bottom]:before:right-0 data-[side=bottom]:before:left-0",
                    className,
                )}
                {...props}>
                <NavigationMenuPrimitive.Popup
                    data-slot="navigation-menu-popup"
                    className={cn(
                        "bg-ink/95 text-paper border border-line relative h-[var(--popup-height)] w-[var(--popup-width)] origin-[var(--transform-origin)] rounded-xl shadow-2xl backdrop-blur-xl transition-[width,height,opacity,transform,translate,scale] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none data-ending-style:-translate-y-1.5 data-ending-style:scale-96 data-ending-style:opacity-0 data-ending-style:duration-150 data-starting-style:-translate-y-1.5 data-starting-style:scale-96 data-starting-style:opacity-0",
                        popupClassName,
                    )}>
                    <NavigationMenuPrimitive.Viewport
                        data-slot="navigation-menu-viewport"
                        className="relative h-full w-full overflow-hidden"
                    />
                </NavigationMenuPrimitive.Popup>
            </NavigationMenuPrimitive.Positioner>
        </NavigationMenuPrimitive.Portal>
    );
}

export type NavigationMenuLinkProps = NavigationMenuPrimitive.Link.Props;

function NavigationMenuLink({ className, ...props }: NavigationMenuLinkProps) {
    return (
        <NavigationMenuPrimitive.Link
            data-slot="navigation-menu-link"
            className={cn(
                "aria-[current=page]:bg-accent/10 aria-[current=page]:text-accent text-paper hover:bg-accent/10 focus:bg-accent/10 flex min-h-11 items-center gap-1.5 rounded-lg p-2.5 text-sm transition-colors outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent [&_svg:not([class*='size-'])]:size-4",
                className,
            )}
            {...props}
            render={(linkProps) => (
                <motion.a
                    {...(linkProps as unknown as React.ComponentProps<typeof motion.a>)}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                />
            )}
        />
    );
}

export type NavigationMenuIndicatorProps = NavigationMenuPrimitive.Icon.Props;

function NavigationMenuIndicator({ className, ...props }: NavigationMenuIndicatorProps) {
    return (
        <NavigationMenuPrimitive.Icon
            data-slot="navigation-menu-indicator"
            className={cn("top-full z-1 flex h-1.5 items-end justify-center overflow-hidden", className)}
            {...props}
            render={(iconProps, state) => (
                <AnimatePresence>
                    {state.open && (
                        <motion.div
                            {...(iconProps as unknown as React.ComponentProps<typeof motion.div>)}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="top-full z-1 flex h-1.5 items-end justify-center overflow-hidden">
                            <div className="bg-ink/95 border-l border-t border-line relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm shadow-md" />
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        />
    );
}

export type NavigationMenuArrowProps = NavigationMenuPrimitive.Arrow.Props;

function NavigationMenuArrow({ className, ...props }: NavigationMenuArrowProps) {
    return (
        <NavigationMenuPrimitive.Arrow
            data-slot="navigation-menu-arrow"
            className={cn(
                "before:border-line before:bg-ink relative block h-1.5 w-3 overflow-clip transition-[left,right] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] before:absolute before:bottom-0 before:left-1/2 before:block before:h-[calc(6px*sqrt(2))] before:w-[calc(6px*sqrt(2))] before:-translate-x-1/2 before:translate-y-1/2 before:rotate-45 before:border before:content-[''] data-[side=bottom]:top-[-6px] data-[side=left]:right-[-9px] data-[side=left]:rotate-90 data-[side=right]:left-[-9px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-6px] data-[side=top]:rotate-180",
                className,
            )}
            {...props}
        />
    );
}

function NavigationMenuViewport({ className, ...props }: NavigationMenuPrimitive.Viewport.Props) {
    return (
        <NavigationMenuPrimitive.Viewport
            data-slot="navigation-menu-viewport"
            className={cn("relative size-full overflow-hidden", className)}
            {...props}
        />
    );
}

export {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuIndicator,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
    NavigationMenuPositioner,
    NavigationMenuArrow,
    NavigationMenuViewport,
};
