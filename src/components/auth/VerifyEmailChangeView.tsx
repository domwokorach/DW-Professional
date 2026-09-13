"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Button from "@/components/ui/Button";
import { useLocale } from "@/i18n/LocaleProvider";

type Status = "pending" | "success" | "expired" | "email_in_use" | "invalid" | "error";

export default function VerifyEmailChangeView() {
  const { localiseHref } = useLocale();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<Status>("pending");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email-change", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (cancelled) return;

        if (res.ok) {
          setStatus("success");
          return;
        }

        setMessage(data?.error?.message ?? null);
        if (data?.error?.code === "expired_token") setStatus("expired");
        else if (data?.error?.code === "email_in_use") setStatus("email_in_use");
        else if (data?.error?.code === "invalid_token") setStatus("invalid");
        else setStatus("error");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const content: Record<Status, { icon: React.ReactNode; title: string; body: string }> = {
    pending: {
      icon: <Loader2 className="h-10 w-10 animate-spin text-accent" />,
      title: "Confirming your email…",
      body: "Please wait while we verify this link.",
    },
    success: {
      icon: <CheckCircle2 className="h-10 w-10 text-accent" />,
      title: "Email address updated",
      body: "Your email has been changed. Please sign in again with your new address.",
    },
    expired: {
      icon: <XCircle className="h-10 w-10 text-red-400" />,
      title: "Link expired",
      body: message ?? "This verification link has expired. Request the email change again from Settings.",
    },
    email_in_use: {
      icon: <XCircle className="h-10 w-10 text-red-400" />,
      title: "Email already in use",
      body: message ?? "That email address is now used by another account.",
    },
    invalid: {
      icon: <XCircle className="h-10 w-10 text-red-400" />,
      title: "Invalid link",
      body: message ?? "This verification link is invalid or has already been used.",
    },
    error: {
      icon: <XCircle className="h-10 w-10 text-red-400" />,
      title: "Something went wrong",
      body: message ?? "Please try again in a moment.",
    },
  };

  const current = content[status];

  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
        {current.icon}
        <h1 className="text-xl font-semibold text-white">{current.title}</h1>
        <p className="text-sm text-muted">{current.body}</p>
        {status !== "pending" ? (
          <Button href={localiseHref("/auth/sign-in")} className="mt-2">
            Go to sign in
          </Button>
        ) : null}
        {status === "expired" ? (
          <Link href={localiseHref("/admin/settings")} className="text-sm font-medium text-accent hover:underline">
            Back to Settings
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
