import type { RefObject } from 'react';

type Props = {
  hourRef: RefObject<SVGGElement | null>;
  minuteRef: RefObject<SVGGElement | null>;
  secondRef: RefObject<SVGGElement | null>;
};

function MainHand({ length, width }: { length: number; width: number }) {
  return <path d={`M${500 - width / 2} 530 L${500 - width / 2 - 5} ${528 - length} L500 ${500 - length} L${500 + width / 2 + 5} ${528 - length} L${500 + width / 2} 530Z`} fill="url(#handGold)" stroke="#513500" strokeWidth="2" filter="url(#handShadow)" />;
}

export default function WatchHands({ hourRef, minuteRef, secondRef }: Props) {
  return (
    <g aria-hidden="true">
      <g ref={hourRef}><MainHand length={178} width={24} /><path d="M493 488V355L500 340 507 355V488Z" fill="#101010" /></g>
      <g ref={minuteRef}><MainHand length={267} width={18} /><path d="M494 486V266L500 247 506 266V486Z" fill="#101010" /></g>
      <g ref={secondRef}><line x1="500" y1="556" x2="500" y2="247" stroke="#c18a1e" strokeWidth="4" /><path d="M500 236 492 260 500 275 508 260Z" fill="url(#edgeGold)" stroke="#6f4900" /></g>
      <circle cx="500" cy="500" r="19" fill="url(#edgeGold)" stroke="#684500" strokeWidth="2" filter="url(#handShadow)" />
      <circle cx="500" cy="500" r="7" fill="#e8bc4d" stroke="#754d00" />
    </g>
  );
}
