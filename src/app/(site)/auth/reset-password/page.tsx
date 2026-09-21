import { Suspense } from "react";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { OrbitRingLoader } from "@/components/ui/loader";

export const metadata = { title: "Reset password | Dominic Wokorach" };

export default function ResetPasswordPage() {
  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-28 sm:px-8">
      <Suspense fallback={<OrbitRingLoader size="lg" label="Loading reset form" />}>
        <ResetPasswordForm />
      </Suspense>
    </section>
  );
}
