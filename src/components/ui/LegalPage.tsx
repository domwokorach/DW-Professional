import Container from "@/components/ui/Container";

export default function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="py-32 sm:py-40">
      <Container className="max-w-2xl">
        <h1 className="text-3xl font-semibold text-white">{title}</h1>
        <div className="mt-6 space-y-4 text-sm leading-[1.7] text-muted">
          {children}
        </div>
      </Container>
    </article>
  );
}
