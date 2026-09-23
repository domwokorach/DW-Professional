"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Button from "@/components/ui/Button";
import { useLocale } from "@/i18n/LocaleProvider";

export default function SignInForm() {
  const router = useRouter();
  const { localiseHref } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function clearErrors() {
    if (errorMessage) setErrorMessage(null);
    if (Object.keys(fieldErrors).length > 0) setFieldErrors({});
  }

  function handlePasswordKeyEvent(event: React.KeyboardEvent<HTMLInputElement>) {
    if (typeof event.getModifierState === "function") {
      setCapsLockOn(event.getModifierState("CapsLock"));
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = (await res.json()) as {
        error?: { message?: string; fields?: Record<string, string> };
      };

      if (!res.ok) {
        if (data?.error?.fields) setFieldErrors(data.error.fields);
        setErrorMessage(data?.error?.message ?? "Something went wrong. Please try again.");
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const redirectTarget = params.get("redirect_url") || localiseHref("/admin/chat");
      router.push(redirectTarget);
      router.refresh();
    } catch {
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">Admin sign in</CardTitle>
        <CardDescription>Sign in to manage the live chat dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          {errorMessage ? (
            <Alert variant="destructive" role="alert" aria-live="assertive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearErrors();
              }}
              aria-invalid={Boolean(fieldErrors.email || errorMessage)}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
            />
            {fieldErrors.email ? (
              <p id="email-error" className="text-xs text-red-400" role="alert">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href={localiseHref("/auth/forgot-password")}
                className="text-xs font-medium text-accent hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearErrors();
                }}
                onKeyDown={handlePasswordKeyEvent}
                onKeyUp={handlePasswordKeyEvent}
                className="pr-10"
                aria-invalid={Boolean(fieldErrors.currentPassword ?? fieldErrors.password ?? errorMessage)}
                aria-describedby={capsLockOn ? "caps-lock-warning" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted hover:text-paper"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {capsLockOn ? (
              <p id="caps-lock-warning" className="text-xs text-amber-400" role="status">
                Caps Lock is on
              </p>
            ) : null}
            {fieldErrors.currentPassword || fieldErrors.password ? (
              <p className="text-xs text-red-400" role="alert">
                {fieldErrors.currentPassword ?? fieldErrors.password}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(v) => setRememberMe(v === true)} />
            <Label htmlFor="remember-me" className="cursor-pointer font-normal text-muted">
              Remember me for 30 days
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={submitting} aria-busy={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {submitting ? "Signing in…" : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
