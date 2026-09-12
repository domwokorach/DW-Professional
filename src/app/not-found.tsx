import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ErrorState from "@/components/ui/ErrorState";

// A route that matches nothing renders only under the root layout, so the
// (site) route group's Header/Footer never mount here — render them
// directly instead of relying on layout nesting.
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main">
        <ErrorState kind="not-found" />
      </main>
      <Footer />
    </>
  );
}
