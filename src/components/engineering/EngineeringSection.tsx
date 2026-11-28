import EngineeringCards from './EngineeringCards';

export default function EngineeringSection({ origin = '' }: { origin?: string }) {
  return (
    <section id="engineering" className="section engineering-section" aria-labelledby="engineering-heading">
      <div className="section-tag"><span>10</span><i />ENGINEERING</div>
      <div className="section-heading">
        <h2 id="engineering-heading">Built. Tested. <em>Delivered.</em></h2>
        <p>Engineering beyond the interface. Automated quality assurance, maintainable architecture and reliable delivery workflows.</p>
      </div>
      <EngineeringCards origin={origin} />
    </section>
  );
}
