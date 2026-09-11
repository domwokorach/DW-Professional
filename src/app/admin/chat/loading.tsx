import { Skeleton } from "@/components/ui/skeleton";

export default function AdminChatLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-20" />
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-full max-w-xs shrink-0 space-y-2 border-r border-line p-4">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </aside>
        <div className="hidden flex-1 items-center justify-center md:flex">
          <Skeleton className="h-6 w-64" />
        </div>
      </div>
    </div>
  );
}
