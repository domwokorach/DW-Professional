'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

// The form (with its Base UI combobox and upload progress) is the heaviest script on the page and
// sits at the very bottom, so it loads only as it approaches the viewport. It needs JavaScript to
// submit anyway. The placeholder reserves the form's height, so nothing jumps when it arrives.
const ContactForm = dynamic(() => import('./ContactForm'), {
  ssr: false,
  loading: () => <div className="contact-form contact-form--placeholder" aria-hidden="true" />,
});

export default function LazyContactForm({ directUploads }: { directUploads: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { setNear(true); return; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNear(true); io.disconnect(); }
    }, { rootMargin: '1200px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return near ? <ContactForm directUploads={directUploads} /> : <div ref={ref} className="contact-form contact-form--placeholder" aria-hidden="true" />;
}
