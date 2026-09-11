import { Skeleton } from "@/components/ui/skeleton";

export default function AdminChatLoading() {
  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-20" />
      </header>
      <div className="min-h-0 flex-1 md:grid md:grid-cols-[260px_1fr] lg:grid-cols-[320px_1fr]">
        <aside className="h-full space-y-2 border-line p-3 md:border-r">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </aside>
        <div className="hidden flex-1 flex-col items-center justify-center gap-2 md:flex">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    </div>
  );
}
