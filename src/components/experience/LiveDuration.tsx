'use client';

import { useEffect, useState } from 'react';
import { formatDuration, monthsBetween } from '@/lib/experience-duration';

/** Ongoing duration. Starts from the server-rendered text, then re-computes from today's date. */
export default function LiveDuration({ startIso, initial }: { startIso: string; initial: string }) {
  const [text, setText] = useState(initial);
  useEffect(() => setText(formatDuration(monthsBetween(startIso))), [startIso]);
  return <>{text}</>;
}
