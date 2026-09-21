import { Suspense } from "react";
import VerifyEmailChangeView from "@/components/auth/VerifyEmailChangeView";
import { OrbitRingLoader } from "@/components/ui/loader";

export const metadata = { title: "Verify email | Dominic Wokorach" };

export default function VerifyEmailChangePage() {
  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-28 sm:px-8">
      <Suspense fallback={<OrbitRingLoader size="lg" label="Verifying email" />}>
        <VerifyEmailChangeView />
      </Suspense>
    </section>
  );
}
