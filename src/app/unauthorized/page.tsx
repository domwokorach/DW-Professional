import ErrorState from "@/components/ui/ErrorState";

export const metadata = { title: "Access restricted | Dominic Wokorach" };

export default function UnauthorizedPage() {
  return <ErrorState kind="unauthorized" />;
}
