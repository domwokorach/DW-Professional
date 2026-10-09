import type { RefObject } from 'react';
import { svgCoordinate } from './svgGeometry';

function Subdial({ cx, cy, labels, hand = true }: { cx: number; cy: number; labels: string[]; hand?: boolean }) {
  return (
    <g aria-hidden="true">
      <circle cx={cx} cy={cy} r="101" fill="url(#subdialGold)" stroke="#805300" strokeWidth="2" />
      <circle cx={cx} cy={cy} r="76" fill="url(#dial)" stroke="#b67b0d" strokeWidth="1.5" />
      {Array.from({ length: 12 }, (_, index) => <line key={index} x1={cx} y1={cy - 96} x2={cx} y2={cy - (index % 3 === 0 ? 78 : 85)} stroke="#211c11" strokeWidth={index % 3 === 0 ? 2.2 : 1.2} transform={`rotate(${index * 30} ${cx} ${cy})`} />)}
      {labels.map((label, index) => {
        const angle = index * (360 / labels.length);
        const rad = (angle - 90) * Math.PI / 180;
        const x = svgCoordinate(cx + Math.cos(rad) * 87);
        const y = svgCoordinate(cy + Math.sin(rad) * 87);
        return <text key={label} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="700" transform={`rotate(${angle} ${x} ${y})`}>{label}</text>;
      })}
      {hand && <line x1={cx} y1={cy + 5} x2={cx} y2={cy - 65} stroke="#bd8b28" strokeWidth="8" strokeLinecap="round" />}
      {hand && <circle cx={cx} cy={cy} r="11" fill="url(#edgeGold)" stroke="#684500" strokeWidth="1.5" />}
      {hand && <circle cx={cx} cy={cy} r="3" fill="#573700" />}
    </g>
  );
}

export default function ChronographSubdials({ subsecondRef }: { subsecondRef: RefObject<SVGGElement | null> }) {
  return (
    <g>
      <Subdial cx={340} cy={500} labels={['60', '3', '6', '9']} />
      <Subdial cx={660} cy={500} labels={['30', '10', '20']} />
      <Subdial cx={500} cy={680} labels={['60', '20', '40']} hand={false} />
      <g ref={subsecondRef} aria-hidden="true">
        <line x1="500" y1="697" x2="500" y2="611" stroke="#bd861a" strokeWidth="4" strokeLinecap="round" />
        <path d="M500 603 494 615 500 624 506 615Z" fill="url(#edgeGold)" stroke="#684500" />
        <circle cx="500" cy="680" r="10" fill="url(#edgeGold)" stroke="#684500" strokeWidth="1.5" />
        <circle cx="500" cy="680" r="3" fill="#573700" />
      </g>
    </g>
  );
}
