"use client";

import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/motion/select";
import { cn } from "@/lib/utils";

export interface FormSelectFieldOption {
  value: string;
  label: string;
}

export interface FormSelectFieldProps {
  id: string;
  name: string;
  label: ReactNode;
  placeholder: string;
  value: string;
  options: readonly FormSelectFieldOption[];
  onValueChange: (value: string) => void;
  error?: string;
  helperId?: string;
}

/**
 * Optional single-select field for the contact form, built on the Pace UI
 * Motion Select primitives (src/components/ui/motion/select.tsx) — keyboard
 * navigable, touch-friendly, and screen-reader accessible via @base-ui's
 * Select, which also renders the hidden `name`d input a plain form submit
 * (and `new FormData(form)`) picks up automatically. Value stays "" (no
 * hidden input rendered) until the user actually chooses an option.
 */
export default function FormSelectField({
  id,
  name,
  label,
  placeholder,
  value,
  options,
  onValueChange,
  error,
  helperId,
}: FormSelectFieldProps) {
  const errorId = `${id}-error`;
  const describedBy = [helperId, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm text-muted">
        {label} <span className="text-xs">(optional)</span>
      </label>

      <Select
        items={options}
        value={value || null}
        onValueChange={(next) => onValueChange((next as string) ?? "")}
        name={name}
      >
        <SelectTrigger
          id={id}
          className={cn(
            "h-[52px] w-full data-[placeholder]:text-muted/60",
            error && "border-red-400/60"
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="w-(--anchor-width)">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
