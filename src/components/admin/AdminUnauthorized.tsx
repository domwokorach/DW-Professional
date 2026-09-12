"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useLocale } from "@/i18n/LocaleProvider";

type Variant = "signed-out" | "forbidden";

const copy: Record<Variant, { description: string }> = {
  "signed-out": {
    description: "You need to sign in with an authorised administrator account to access this page.",
  },
  forbidden: {
    description: "The account currently signed in does not have administrator permissions.",
  },
};

export default function AdminUnauthorized({ variant }: { variant: Variant }) {
  const { localiseHref } = useLocale();
  const { signOut } = useClerk();
  const router = useRouter();

  const signInHref = `${localiseHref("/sign-in")}?redirect_url=${encodeURIComponent(
    localiseHref("/admin/chat")
  )}`;

  return (
    <section
      className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-28 sm:px-8"
      aria-labelledby="unauthorized-title"
    >
      <div className="w-full max-w-xl rounded-3xl border border-line bg-surface/80 p-8 text-center shadow-2xl sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent">
          <ShieldAlert aria-hidden="true" size={28} strokeWidth={2} />
        </div>

        <div role="alert" className="mt-6">
          <h1 id="unauthorized-title" className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Access restricted
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted sm:text-base">
            {copy[variant].description}
          </p>
        </div>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          {variant === "signed-out" ? (
            <Link
              href={signInHref}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              Sign in to Admin
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => signOut(() => router.push(signInHref))}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              Sign out and use another account
            </button>
          )}
          <Link
            href={localiseHref("/")}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-line px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            Return to Portfolio
          </Link>
        </div>
      </div>
    </section>
  );
}
