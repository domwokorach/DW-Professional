/**
 * Placeholder brand and figures for the /studio landing page. Every figure shown in more than one place is read
 * from here so the copies cannot disagree. Replace with the maker's own measured values before publishing.
 */
export const BRAND = 'Nibwork';

export type Variant = {
  id: string;
  label: string;
  /** Nib width in millimetres. */
  nibMm: string;
  /** Line width on paper in millimetres. */
  lineMm: string;
  flow: string;
  /** SVG stroke width of the drawn output. */
  stroke: number;
  /** Path of the drawn output (viewBox 0 0 600 200). */
  d: string;
};

export const VARIANTS: Variant[] = [
  {
    id: 'fine',
    label: 'Fine',
    nibMm: '0.4',
    lineMm: '0.3',
    flow: 'Dry',
    stroke: 1.5,
    d: 'M16 120 C70 20 120 20 150 100 S230 180 280 100 S370 20 420 100 S520 180 584 80',
  },
  {
    id: 'medium',
    label: 'Medium',
    nibMm: '0.6',
    lineMm: '0.5',
    flow: 'Balanced',
    stroke: 3,
    d: 'M16 110 C80 30 130 40 160 100 S240 170 290 100 S360 40 420 100 S510 160 584 90',
  },
  {
    id: 'broad',
    label: 'Broad',
    nibMm: '0.9',
    lineMm: '0.8',
    flow: 'Wet',
    stroke: 5,
    d: 'M16 100 C90 50 140 60 170 100 S250 150 300 100 S370 60 430 100 S520 140 584 100',
  },
];

export const ARGUMENT_ROWS = [
  { label: 'Process', text: 'Every nib is ground and tested by hand before it is fitted.', value: 'By hand' },
  { label: 'Output', text: 'The line on this page is the pen’s own output, drawn as it would be on paper.', value: 'Drawn' },
  { label: 'Claims', text: 'Only what is made and measured is stated here.', value: 'Measured' },
];

export const MATERIAL_ROWS = [
  { label: 'Barrel', text: 'Turned from a single rod and finished by hand.', value: 'Placeholder' },
  { label: 'Section', text: 'Machined to sit under the grip without a seam.', value: 'Placeholder' },
  { label: 'Nib', text: 'Ground in three widths, listed in the measurements below.', value: 'Three widths' },
];

export const MEASUREMENTS = VARIANTS.map((v) => ({
  label: `${v.label} nib`,
  text: `Flow: ${v.flow.toLowerCase()}. Line on paper ${v.lineMm} mm.`,
  value: `${v.nibMm} mm`,
}));

export const HERO_SPECS = [
  { k: 'Nib widths', v: `${VARIANTS.length}` },
  { k: 'Range', v: `${VARIANTS[0].nibMm}–${VARIANTS[VARIANTS.length - 1].nibMm} mm` },
  { k: 'Made', v: 'By hand' },
];
