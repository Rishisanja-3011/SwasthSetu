import React, { useEffect, useMemo, useState } from 'react';

const MESSAGES = ['Please tell your symptoms...', 'કૃપા કરીને તમારા લક્ષણો જણાવો...', 'कृपया अपने लक्षण बताएं...'];

function graphemes(text) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), (item) => item.segment);
  }
  return Array.from(text);
}

export default function TypewriterGuidance({ active = true }) {
  const messages = useMemo(() => MESSAGES.map((message) => ({ message, parts: graphemes(message) })), []);
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return undefined;
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (!active || reducedMotion) return undefined;
    const current = messages[index];
    const complete = count === current.parts.length;
    const empty = count === 0;
    const delay = complete && !deleting ? 1300 : empty && deleting ? 320 : deleting ? 35 : 75;
    const timer = setTimeout(() => {
      if (!deleting && !complete) setCount((value) => value + 1);
      else if (!deleting) setDeleting(true);
      else if (!empty) setCount((value) => value - 1);
      else { setDeleting(false); setIndex((value) => (value + 1) % messages.length); }
    }, delay);
    return () => clearTimeout(timer);
  }, [active, count, deleting, index, messages, reducedMotion]);

  const text = reducedMotion ? messages.map((item) => item.message).join(' / ') : messages[index].parts.slice(0, count).join('');
  return <span className="typewriter-guidance-content" aria-live="polite"><span className="typewriter-text">{text}</span>{active && !reducedMotion && <span className="typewriter-cursor" aria-hidden="true" />}</span>;
}
