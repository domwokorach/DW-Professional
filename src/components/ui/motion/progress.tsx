import * as React from "react";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { type Transition, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

interface ProgressContextValue {
  transition?: Transition;
}

const ProgressContext = React.createContext<ProgressContextValue>({
  transition: undefined,
});

export interface ProgressProps extends ProgressPrimitive.Root.Props {
  transition?: Transition;
}

export type ProgressTrackProps = ProgressPrimitive.Track.Props;

export interface ProgressIndicatorProps extends ProgressPrimitive.Indicator.Props {
  transition?: Transition;
}

export type ProgressLabelProps = ProgressPrimitive.Label.Props;

export type ProgressValueProps = ProgressPrimitive.Value.Props;

function Progress({ className, children, value, transition, ...props }: ProgressProps) {
  const hasTrack = React.Children.toArray(children).some(
    (child) =>
      React.isValidElement(child) &&
      (child.type === ProgressTrack || (child.props as { "data-slot"?: string })?.["data-slot"] === "progress-track")
  );

  return (
    <ProgressContext.Provider value={{ transition }}>
      <ProgressPrimitive.Root
        value={value}
        data-slot="progress"
        className={cn("flex flex-wrap items-center gap-3", className)}
        {...props}
      >
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
      className={cn("relative flex h-2 w-full items-center overflow-x-hidden rounded-full bg-ink", className)}
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
      className={cn("h-full bg-accent", className)}
      render={(indicatorProps, state) => {
        const isIndeterminate = state.status === "indeterminate";

        if (isIndeterminate) {
          return (
            <motion.div
              {...(indicatorProps as unknown as React.ComponentProps<typeof motion.div>)}
              initial={reduceMotion ? { x: "0%", width: "45%" } : { x: "-100%", width: "45%" }}
              animate={reduceMotion ? { x: "0%", width: "45%" } : { x: "280%", width: "45%" }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { repeat: Infinity, duration: 1.4, ease: [0.4, 0, 0.2, 1] }
              }
              style={{
                ...indicatorProps.style,
                width: "45%",
                insetInlineStart: 0,
                position: "absolute",
              }}
              className={cn("h-full rounded-full bg-accent", className)}
            />
          );
        }

        const targetWidth = indicatorProps.style?.width ?? "0%";

        return (
          <motion.div
            {...(indicatorProps as unknown as React.ComponentProps<typeof motion.div>)}
            initial={false}
            animate={{ width: targetWidth }}
            transition={reduceMotion ? { duration: 0 } : transition}
            style={{
              ...indicatorProps.style,
              insetInlineStart: 0,
              height: "inherit",
            }}
            className={cn("h-full bg-accent", className)}
          />
        );
      }}
      {...props}
    />
  );
}

function ProgressLabel({ className, ...props }: ProgressLabelProps) {
  return <ProgressPrimitive.Label className={cn("text-sm font-medium text-paper", className)} data-slot="progress-label" {...props} />;
}

function ProgressValue({ className, ...props }: ProgressValueProps) {
  return (
    <ProgressPrimitive.Value
      className={cn("ml-auto shrink-0 text-xs tabular-nums text-muted", className)}
      data-slot="progress-value"
      {...props}
    />
  );
}

export { Progress, ProgressTrack, ProgressIndicator, ProgressLabel, ProgressValue };
