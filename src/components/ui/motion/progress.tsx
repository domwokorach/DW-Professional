"use client";
// Adapted from Pace UI "motion-progress" (https://ui.paceui.com/r/motion-progress.json), built on
// @base-ui/react Progress + motion. Kept: the API (Progress/Track/Indicator/Label/Value, `value`,
// `transition`), the motion width interpolation, the indeterminate sweep for `value={null}` and all
// base-ui behaviour (progressbar role, aria-valuemin/max/now, no aria-valuenow when indeterminate).
// Changes:
// - Tailwind classes replaced with scoped CSS classes (`pace-progress-*`, styled by the consumer)
// - under prefers-reduced-motion the indeterminate sweep is replaced by a static full-width fill
import * as React from "react";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { type Transition, motion, useReducedMotion } from "motion/react";

const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");
// base-ui `className` may be a string or a function of the part's state; prepend our base class to either.
function withBase<State>(base: string, className?: string | ((state: State) => string | undefined)) {
    return typeof className === "function" ? (state: State) => cn(base, className(state)) : cn(base, className);
}

interface ProgressContextValue {
    transition?: Transition;
}

const ProgressContext = React.createContext<ProgressContextValue>({
    transition: undefined,
});

export interface ProgressProps extends ProgressPrimitive.Root.Props {
    transition?: Transition;
}

export interface ProgressTrackProps extends ProgressPrimitive.Track.Props {}

export interface ProgressIndicatorProps extends ProgressPrimitive.Indicator.Props {
    transition?: Transition;
}

export interface ProgressLabelProps extends ProgressPrimitive.Label.Props {}

export interface ProgressValueProps extends ProgressPrimitive.Value.Props {}

function Progress({ className, children, value, transition, ...props }: ProgressProps) {
    const hasTrack = React.Children.toArray(children).some(
        (child) =>
            React.isValidElement(child) &&
            (child.type === ProgressTrack ||
                (child.props as { "data-slot"?: string })?.["data-slot"] === "progress-track"),
    );

    return (
        <ProgressContext.Provider value={{ transition }}>
            <ProgressPrimitive.Root
                value={value}
                data-slot="progress"
                className={withBase("pace-progress", className)}
                {...props}>
                {children}
                {!hasTrack && (
                    <ProgressTrack>
                        <ProgressIndicator transition={transition} />
                    </ProgressTrack>
                )}
            </ProgressPrimitive.Root>
        </ProgressContext.Provider>
    );
}

function ProgressTrack({ className, ...props }: ProgressTrackProps) {
    return (
        <ProgressPrimitive.Track
            className={withBase("pace-progress-track", className)}
            data-slot="progress-track"
            {...props}
        />
    );
}

function ProgressIndicator({ className, transition: explicitTransition, ...props }: ProgressIndicatorProps) {
    const context = React.useContext(ProgressContext);
    const reduceMotion = useReducedMotion();
    const transition = explicitTransition ??
        context.transition ?? {
            type: "spring",
            stiffness: 120,
            damping: 18,
        };

    return (
        <ProgressPrimitive.Indicator
            data-slot="progress-indicator"
            className={withBase("pace-progress-indicator", className)}
            render={(indicatorProps, state) => {
                const isIndeterminate = state.status === "indeterminate";

                if (isIndeterminate) {
                    if (reduceMotion) {
                        return (
                            <div
                                {...indicatorProps}
                                style={{ ...indicatorProps.style, width: "100%", insetInlineStart: 0, position: "absolute" }}
                                className={cn(indicatorProps.className, "is-static")}
                            />
                        );
                    }
                    return (
                        <motion.div
                            {...(indicatorProps as React.ComponentProps<typeof motion.div>)}
                            initial={{ x: "-100%", width: "45%" }}
                            animate={{ x: "280%", width: "45%" }}
                            transition={{
                                repeat: Infinity,
                                duration: 1.4,
                                ease: [0.4, 0, 0.2, 1],
                            }}
                            style={{
                                ...indicatorProps.style,
                                width: "45%",
                                insetInlineStart: 0,
                                position: "absolute",
                            }}
                        />
                    );
                }

                const targetWidth = indicatorProps.style?.width ?? "0%";

                return (
                    <motion.div
                        {...(indicatorProps as React.ComponentProps<typeof motion.div>)}
                        initial={{ width: 0 }}
                        whileInView={{ width: targetWidth }}
                        viewport={{ once: true }}
                        animate={{ width: targetWidth }}
                        transition={reduceMotion ? { duration: 0 } : transition}
                        style={{
                            ...indicatorProps.style,
                            insetInlineStart: 0,
                            height: "inherit",
                        }}
                    />
                );
            }}
            {...props}
        />
    );
}

function ProgressLabel({ className, ...props }: ProgressLabelProps) {
    return (
        <ProgressPrimitive.Label
            className={withBase("pace-progress-label", className)}
            data-slot="progress-label"
            {...props}
        />
    );
}

function ProgressValue({ className, ...props }: ProgressValueProps) {
    return (
        <ProgressPrimitive.Value
            className={withBase("pace-progress-value", className)}
            data-slot="progress-value"
            {...props}
        />
    );
}

export { Progress, ProgressTrack, ProgressIndicator, ProgressLabel, ProgressValue };
