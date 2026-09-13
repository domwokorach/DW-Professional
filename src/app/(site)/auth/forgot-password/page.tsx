import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Forgot password | Dominic Wokorach" };

export default function ForgotPasswordPage() {
  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-28 sm:px-8">
      <ForgotPasswordForm />
    </section>
  );
}
