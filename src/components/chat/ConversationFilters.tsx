"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CONVERSATION_FILTERS, FILTER_LABELS, type ConversationFilter } from "@/lib/chat/filters";

export default function ConversationFilters({
  value,
  onChange,
  counts,
}: {
  value: ConversationFilter;
  onChange: (filter: ConversationFilter) => void;
  counts: Record<ConversationFilter, number>;
}) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as ConversationFilter)}>
      <TabsList className="grid w-full grid-cols-4 bg-ink" aria-label="Filter conversations">
        {CONVERSATION_FILTERS.map((filter) => (
          <TabsTrigger key={filter} value={filter} className="gap-1.5 px-1.5 text-xs sm:text-sm">
            {FILTER_LABELS[filter]}
            {counts[filter] > 0 ? (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-line/60 px-1 text-[10px] font-medium text-muted">
                {counts[filter]}
              </span>
            ) : null}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
