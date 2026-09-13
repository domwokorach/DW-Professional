"use client";

import { SlidersHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { CONVERSATION_FILTERS, FILTER_LABELS, type ConversationFilter } from "@/lib/chat/filters";

export default function ConversationFilters({
  value,
  onChange,
}: {
  value: ConversationFilter;
  onChange: (filter: ConversationFilter) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Filter conversations"
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-line bg-ink px-2.5 text-sm text-white transition-colors hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{FILTER_LABELS[value]}</span>
          {value !== "all" ? (
            <Badge variant="secondary" className="hidden h-4 min-w-4 justify-center rounded-full px-1 text-[10px] sm:inline-flex">
              •
            </Badge>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Filter conversations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as ConversationFilter)}>
          {CONVERSATION_FILTERS.map((filter) => (
            <DropdownMenuRadioItem key={filter} value={filter}>
              {FILTER_LABELS[filter]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
