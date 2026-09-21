import { FullPageLoader, OrbitRingLoader } from "@/components/ui/loader";

export default function OrbitPreviewPage() {
  return (
    <div className="flex min-h-dvh flex-col gap-12 p-8">
      <div>
        <h2 className="mb-4 text-sm text-muted">Sizes (sm / md / lg)</h2>
        <div className="flex items-center gap-8">
          <OrbitRingLoader size="sm" />
          <OrbitRingLoader size="md" />
          <OrbitRingLoader size="lg" />
        </div>
      </div>
      <div>
        <h2 className="mb-4 text-sm text-muted">Full page loader (route/Suspense fallback)</h2>
        <div className="h-64 border border-line">
          <FullPageLoader label="Loading preview" />
        </div>
      </div>
    </div>
  );
}
