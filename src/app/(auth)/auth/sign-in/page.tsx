import SignInForm from "@/components/auth/SignInForm";

export const metadata = { title: "Sign in | Dominic Wokorach" };

export default function SignInPage() {
  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-28 sm:px-8">
      <SignInForm />
    </section>
  );
}
