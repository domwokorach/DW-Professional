"use client";

import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { BUDGET_CURRENCIES, type BudgetCurrency } from "@/lib/contact/validation";

export interface BudgetInputProps {
  amount: string;
  currency: BudgetCurrency | "";
  otherCurrency: string;
  onAmountChange: (value: string) => void;
  onCurrencyChange: (value: BudgetCurrency | "") => void;
  onOtherCurrencyChange: (value: string) => void;
  error?: string;
  helperId?: string;
}

// Digits with at most one decimal point and up to 2 decimal places — typing
// a "-" is simply dropped, so a negative value can never be entered.
const AMOUNT_SANITIZE = /[^\d.]/g;

function sanitizeAmount(raw: string): string {
  const cleaned = raw.replace(AMOUNT_SANITIZE, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  const whole = cleaned.slice(0, firstDot);
  const fraction = cleaned.slice(firstDot + 1).replace(/\./g, "").slice(0, 2);
  return `${whole}.${fraction}`;
}

function formatAmount(raw: string): string {
  if (!raw) return "";
  const [whole, fraction] = raw.split(".");
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction !== undefined ? `${withCommas}.${fraction}` : withCommas;
}

export default function BudgetInput({
  amount,
  currency,
  otherCurrency,
  onAmountChange,
  onCurrencyChange,
  onOtherCurrencyChange,
  error,
  helperId,
}: BudgetInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const errorId = "budget-error";
  const describedBy = [helperId, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  function handleAmountChange(event: ChangeEvent<HTMLInputElement>) {
    onAmountChange(sanitizeAmount(event.target.value));
  }

  function blockMinusKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "-" || event.key === "Subtract") event.preventDefault();
  }

  const displayValue = isFocused ? amount : formatAmount(amount);

  return (
    <div>
      <label htmlFor="budgetAmount" className="mb-2 block text-sm text-muted">
        Budget <span className="text-xs">(optional)</span>
      </label>

      <div
        className={cn(
          "flex w-full overflow-hidden rounded-lg border border-line bg-transparent transition-colors focus-within:border-accent",
          error && "border-red-400/60"
        )}
      >
        <select
          id="budgetCurrency"
          name="budgetCurrency"
          aria-label="Currency"
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value as BudgetCurrency | "")}
          className="shrink-0 border-r border-line bg-transparent px-3 py-3 text-white outline-none"
          style={{ fontSize: "16px" }}
        >
          <option value="" className="bg-ink">
            —
          </option>
          {BUDGET_CURRENCIES.map((c) => (
            <option key={c.value} value={c.value} className="bg-ink">
              {c.label}
            </option>
          ))}
        </select>
        <input
          id="budgetAmount"
          name="budgetAmount"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="5,000"
          value={displayValue}
          onChange={handleAmountChange}
          onKeyDown={blockMinusKey}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-label="Budget amount"
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          className="w-full min-w-0 bg-transparent px-4 py-3 text-white placeholder:text-muted/60 outline-none"
          style={{ fontSize: "16px" }}
        />
      </div>

      {currency === "OTHER" && (
        <input
          type="text"
          name="budgetCurrencyOther"
          value={otherCurrency}
          onChange={(e) => onOtherCurrencyChange(e.target.value)}
          placeholder="Enter currency (e.g. JPY, AUD)"
          maxLength={12}
          aria-label="Custom currency"
          className="mt-2.5 w-full rounded-lg border border-line bg-transparent px-4 py-3 text-white placeholder:text-muted/60 outline-none transition-colors focus:border-accent"
          style={{ fontSize: "16px" }}
        />
      )}

      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
