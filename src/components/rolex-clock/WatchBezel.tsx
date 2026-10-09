import { svgCoordinate } from './svgGeometry';

const values = [
  ['60', 0], ['400', 53], ['300', 73], ['240', 91], ['200', 103], ['180', 115],
  ['160', 127], ['150', 138], ['140', 150], ['130', 165], ['120', 180], ['110', 195],
  ['100', 213], ['90', 238], ['85', 255], ['80', 273], ['75', 290], ['70', 310], ['65', 335],
] as const;

function angularDistance(a: number, b: number) {
  const difference = Math.abs(a - b) % 360;
  return Math.min(difference, 360 - difference);
}

export default function WatchBezel() {
  return (
    <g aria-hidden="true">
      <circle cx="500" cy="500" r="474" fill="url(#bezelGold)" stroke="#684000" strokeWidth="2" />
      <circle cx="500" cy="500" r="466" fill="none" stroke="url(#edgeGold)" strokeWidth="7" />
      <circle cx="500" cy="500" r="371" fill="#c8c7c3" stroke="#6f6c64" strokeWidth="3" />
      <circle cx="500" cy="500" r="364" fill="url(#steel)" stroke="#fff8df" strokeWidth="3" />
      <path d="M118 305 A435 435 0 0 1 770 103" fill="none" stroke="#fff3b1" strokeOpacity=".68" strokeWidth="12" strokeLinecap="round" />
      {values.map(([text, angle]) => {
        const radians = (angle - 90) * Math.PI / 180;
        const textRadius = 421;
        const dotRadius = 387;
        const x = svgCoordinate(500 + Math.cos(radians) * textRadius);
        const y = svgCoordinate(500 + Math.sin(radians) * textRadius);
        const dotX = svgCoordinate(500 + Math.cos(radians) * dotRadius);
        const dotY = svgCoordinate(500 + Math.sin(radians) * dotRadius);
        return (
          <g key={text}>
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontFamily="Arial Narrow, Arial, sans-serif" fontSize={text === '60' ? 43 : 31} fontWeight="600" letterSpacing="-.8" fill="#090909">{text}</text>
            <circle cx={dotX} cy={dotY} r="4.5" fill="#070707" />
          </g>
        );
      })}
      {Array.from({ length: 36 }, (_, index) => {
        const angle = index * 10;
        if (values.some(([, labelAngle]) => angularDistance(angle, labelAngle) <= 6)) return null;
        return <line key={index} x1="500" y1="70" x2="500" y2={index % 3 === 0 ? 87 : 82} stroke="#111" strokeWidth="2.4" strokeLinecap="round" transform={`rotate(${angle} 500 500)`} />;
      })}
      <text x="654" y="105" transform="rotate(19 654 105)" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="600" letterSpacing="3.2">UNITS PER</text>
      <text x="670" y="133" transform="rotate(19 670 133)" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="600" letterSpacing="3.2">HOUR</text>
    </g>
  );
}
