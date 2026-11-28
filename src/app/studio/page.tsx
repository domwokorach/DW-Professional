import Demonstration from '@/components/studio/Demonstration';
import StudioMotion from '@/components/studio/StudioMotion';
import TravellingProduct from '@/components/studio/TravellingProduct';
import Wordmark from '@/components/studio/Wordmark';
import { ARGUMENT_ROWS, BRAND, HERO_SPECS, MATERIAL_ROWS, MEASUREMENTS } from '@/components/studio/data';

type Row = { label: string; text: string; value: string };
const Rows = ({ rows }: { rows: Row[] }) => (
  <ul className="rows">
    {rows.map((r) => (
      <li key={r.label} className="row reveal">
        <span className="row-label">{r.label}</span>
        <span className="row-text">{r.text}</span>
        <span className="row-value">{r.value}</span>
      </li>
    ))}
  </ul>
);

export default function StudioPage() {
  return (
    <div className="studio">
      <StudioMotion />
      <TravellingProduct />
      <nav className="studio-nav" aria-label="Studio">
        <a className="studio-logo" href="#studio-top">{BRAND}<span>.</span></a>
        <div className="studio-links">
          <a href="#argument">Argument</a>
          <a href="#demo">Demonstration</a>
          <a href="#material">Material</a>
          <a href="#measurements">Measurements</a>
        </div>
        <a className="btn btn-solid" href="#close">Enquire</a>
      </nav>

      <main>
        <section id="studio-top" className="studio-hero">
          <div className="hero-copy">
            <p className="kicker reveal">Placeholder brand · hand-made</p>
            <h1 className="reveal">A pen that <em>draws its own</em> proof</h1>
            <p className="lede reveal">Every figure on this page is measured, and the line below is the pen’s own output.</p>
            <div className="btn-row reveal">
              <a className="btn btn-solid" href="#demo">See it draw</a>
              <a className="btn" href="#measurements">Measurements</a>
            </div>
          </div>
          <dl className="hero-specs">
            {HERO_SPECS.map((s) => (
              <div key={s.k}><dt>{s.k}</dt><dd>{s.v}</dd></div>
            ))}
          </dl>
          <Wordmark name={BRAND} />
        </section>

        <section id="argument" className="studio-section two-col">
          <div>
            <h2 className="reveal">Made once, <em>measured twice</em></h2>
            <p className="lede reveal">The page makes no claim it cannot back with a process or a number.</p>
          </div>
          <Rows rows={ARGUMENT_ROWS} />
        </section>

        <section id="demo" className="studio-section">
          <h2 className="reveal">Choose a nib, <em>watch the line</em></h2>
          <Demonstration />
        </section>

        <section id="material" className="studio-section two-col">
          <div>
            <h2 className="reveal">What it is <em>made of</em></h2>
            <p className="lede reveal">Placeholder entries, to be replaced with the maker’s own materials.</p>
          </div>
          <Rows rows={MATERIAL_ROWS} />
        </section>

        <section id="measurements" className="studio-section">
          <h2 className="reveal">The <em>numbers</em></h2>
          <Rows rows={MEASUREMENTS} />
        </section>

        <section id="close" className="studio-close">
          <div className="close-top">
            <div>
              <h2 className="reveal">Ask for the <em>next batch</em></h2>
              <p className="fine">Placeholder brand and figures. Replace before publishing.</p>
            </div>
            <div className="btn-row">
              <a className="btn btn-solid" href="#studio-top">Back to top</a>
              <a className="btn" href="#measurements">Measurements</a>
            </div>
          </div>
          <div className="close-strip"><span>{BRAND}</span><span>Placeholder</span></div>
          <Wordmark name={BRAND} />
        </section>
      </main>
    </div>
  );
}
