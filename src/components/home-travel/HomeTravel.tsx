'use client';

import TravellingProduct, { type Stop } from '@/components/studio/TravellingProduct';

const STOPS: Stop[] = [
  { x: 93, y: 88, rot: 0, scale: 1, opacity: 0 }, // hero: hidden, so hero interactions are untouched
  { x: 93, y: 62, rot: 0, scale: 1, opacity: 1 }, // about
  { x: 5, y: 40, rot: -180, scale: 0.9, opacity: 0.9 }, // skills
  { x: 94, y: 50, rot: 180, scale: 0.9, opacity: 0.9 }, // work
  { x: 94, y: 30, rot: 360, scale: 0.7, opacity: 0 }, // github: gone
];
const ANCHORS = ['.hero', '#about', '#skills', '#work', '#github'];

/** The site's own DO monogram travels down the early sections; hidden in the hero and under reduced motion. */
export default function HomeTravel() {
  return <TravellingProduct stops={STOPS} anchors={ANCHORS} src="/icon.svg" className="home-travel" />;
}
