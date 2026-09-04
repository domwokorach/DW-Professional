"use client";

import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";

export interface OtpInputProps {
  /** Current OTP value (digits only, up to `length` characters). */
  value: string;
  /** Called with the updated digit string whenever the value changes. */
  onChange: (value: string) => void;
  /** Number of digits. Defaults to 6. */
  length?: number;
  disabled?: boolean;
  /** Focus the first cell on mount. */
  autoFocus?: boolean;
  /** Render the cells in an error state. */
  invalid?: boolean;
  /** Id prefix — the first cell gets `${id}-0` so a label can target it. */
  id?: string;
  "aria-label"?: string;
}

/**
 * One-time-code input rendered as individual digit cells, grouped 3 + 3 to
 * mirror the "482 193" formatting used in the verification email.
 * Supports paste, arrow-key navigation and backspace chaining.
 */
export default function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = false,
  invalid = false,
  id = "otp",
  "aria-label": ariaLabel = "One-time code",
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [digits, setDigits] = useState<string[]>(() =>
    Array.from({ length }, (_, i) => value[i] ?? "")
  );
  const joinedRef = useRef(value);

  // Keep the cells in sync when the parent changes the value externally
  // (e.g. resetting after a resend).
  useEffect(() => {
    if (value !== joinedRef.current) {
      joinedRef.current = value;
      setDigits(Array.from({ length }, (_, i) => value[i] ?? ""));
    }
  }, [value, length]);

  useEffect(() => {
    if (autoFocus) inputRefs.current[0]?.focus();
  }, [autoFocus]);

  function commit(next: string[]) {
    joinedRef.current = next.join("");
    setDigits(next);
    onChange(joinedRef.current);
  }

  function handleChange(index: number, rawValue: string) {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    commit(next);
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const next = [...digits];
      next[index - 1] = "";
      commit(next);
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    commit(Array.from({ length }, (_, i) => pasted[i] ?? ""));
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  const groupSize = Math.ceil(length / 2);
  const groups = [digits.slice(0, groupSize), digits.slice(groupSize)];

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex items-center justify-center gap-3"
    >
      {groups.map((group, groupIndex) => (
        <div key={groupIndex} className="flex gap-2">
          {group.map((digit, offset) => {
            const index = groupIndex * groupSize + offset;
            return (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                id={`${id}-${index}`}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={1}
                required
                disabled={disabled}
                value={digit}
                aria-label={`Digit ${index + 1} of ${length}`}
                aria-invalid={invalid || undefined}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={cn(
                  "h-12 w-11 rounded-lg border bg-black/30 text-center font-mono text-lg font-semibold tabular-nums text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-60",
                  invalid ? "border-red-500/50" : "border-line"
                )}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
