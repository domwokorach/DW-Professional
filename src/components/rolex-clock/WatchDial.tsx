function Crown() {
  return (
    <g transform="translate(500 208)" fill="url(#edgeGold)" stroke="#604000" strokeWidth="1.7">
      <path d="M-22 24-30-10-17 7-12-18-3 7 0-25 7 7 17-18 14 9 30-10 22 24Q0 38-22 24Z" />
      {[-30, -12, 0, 17, 30].map((x, index) => <circle key={x} cx={x} cy={[-12, -20, -27, -20, -12][index]} r="3.5" />)}
      <ellipse cy="26" rx="18" ry="7" fill="#fff6c3" />
    </g>
  );
}

export default function WatchDial() {
  return (
    <g aria-hidden="true">
      <circle cx="500" cy="500" r="351" fill="url(#dial)" stroke="#aaa69c" strokeWidth="2" />
      {Array.from({ length: 60 }, (_, index) => (
        <line key={index} x1="500" y1="154" x2="500" y2={index % 5 === 0 ? 180 : 166} stroke="#111" strokeWidth={index % 5 === 0 ? 3 : 1.5} transform={`rotate(${index * 6} 500 500)`} />
      ))}
      {Array.from({ length: 12 }, (_, index) => {
        if ([3, 6, 9].includes(index)) {
          return <g key={index} transform={`rotate(${index * 30} 500 500)`}><rect x="486" y="188" width="28" height="33" rx="2" fill="url(#markerGold)" stroke="#775000" strokeWidth="2" /><rect x="493" y="195" width="14" height="19" fill="#f0edd4" /></g>;
        }
        return (
          <g key={index} transform={`rotate(${index * 30} 500 500)`}>
            <path d="M486 186H514L510 222 500 234 490 222Z" fill="url(#markerGold)" stroke="#775000" strokeWidth="2" filter="url(#smallShadow)" />
            <path d="M492 192H508L505 215 500 222 495 215Z" fill="#f1eed7" stroke="#c9bd82" />
          </g>
        );
      })}
      <Crown />
      <g textAnchor="middle" dominantBaseline="middle" fontFamily="Arial, sans-serif" fill="#0b0b0b">
        <text x="500" y="282" fontFamily="Georgia, serif" fontSize="35" fontWeight="700" letterSpacing="1">ROLEX</text>
        <text x="500" y="309" fontSize="14" letterSpacing="1.8">OYSTER PERPETUAL</text>
        <text x="500" y="331" fontSize="13.5" letterSpacing=".15">SUPERLATIVE CHRONOMETER</text>
        <text x="500" y="351" fontSize="13.5" letterSpacing=".15">OFFICIALLY CERTIFIED</text>
        <text x="500" y="372" fontSize="14" letterSpacing="2.4">COSMOGRAPH</text>
        <text x="500" y="578" fontSize="17" fontWeight="700" letterSpacing="3" fill="#b4151a">DAYTONA</text>
      </g>
      <g dominantBaseline="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="600" letterSpacing="1.6" fill="#0b0b0b">
        <text x="487" y="840" textAnchor="end">SWISS</text>
        <text x="513" y="840" textAnchor="start">MADE</text>
      </g>
    </g>
  );
}
