import React, { useState, useEffect } from 'react';

/**
 * Animated Multilingual Guidance for Tap to Speak / Symptom Intake
 * 
 * Alternates between English and Gujarati instructions character-by-character
 * using Unicode-aware grapheme cluster segmentation (Intl.Segmenter) to prevent
 * broken Indic conjuncts or dangling vowel matras.
 */

const MESSAGES = [
  'Please tell your symptoms...',
  'કૃપા કરીને તમારા લક્ષણો જણાવો...',
  'कृपया अपने लक्षण बताएं...',
];

const TYPE_SPEED_MS = 75;      // 60–90 ms per character
const DELETE_SPEED_MS = 35;    // 30–45 ms per character
const PAUSE_FULL_MS = 1300;    // 1–1.5 seconds pause after complete message
const PAUSE_EMPTY_MS = 320;    // Brief pause before typing next message

// Unicode-aware grapheme cluster segmentation
function getGraphemes(text) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
      return Array.from(segmenter.segment(text), (s) => s.segment);
    } catch (e) {
      // Fallback below
    }
  }
  // Fallback: match base character + any combining marks/virama
  const matches = text.match(/\P{M}\p{M}*/gu);
  return matches || Array.from(text);
}

// Pre-segment messages once
const SEGMENTED_MESSAGES = MESSAGES.map((msg) => ({
  fullText: msg,
  graphemes: getGraphemes(msg),
}));

export function TypewriterGuidance({ isActive = true }) {
  // Check prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReducedMotion(e.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', onChange);
      return () => mediaQuery.removeEventListener('change', onChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(onChange);
      return () => mediaQuery.removeListener(onChange);
    }
  }, []);

  const [messageIndex, setMessageIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (reducedMotion || !isActive) {
      return;
    }

    const currentMsg = SEGMENTED_MESSAGES[messageIndex];
    const totalGraphemes = currentMsg.graphemes.length;

    let timerId;

    if (!isDeleting) {
      // Typing forward
      if (charCount < totalGraphemes) {
        timerId = setTimeout(() => {
          setCharCount((prev) => prev + 1);
        }, TYPE_SPEED_MS);
      } else {
        // Full message reached, pause briefly before deleting
        timerId = setTimeout(() => {
          setIsDeleting(true);
        }, PAUSE_FULL_MS);
      }
    } else {
      // Deleting backward
      if (charCount > 0) {
        timerId = setTimeout(() => {
          setCharCount((prev) => prev - 1);
        }, DELETE_SPEED_MS);
      } else {
        // Complete message erased, pause briefly, switch message
        timerId = setTimeout(() => {
          setIsDeleting(false);
          setMessageIndex((prev) => (prev + 1) % SEGMENTED_MESSAGES.length);
        }, PAUSE_EMPTY_MS);
      }
    }

    return () => clearTimeout(timerId);
  }, [charCount, isDeleting, messageIndex, reducedMotion, isActive]);

  // Accessibility: Respect reduced motion with clean static text and no cursor
  if (reducedMotion) {
    return (
      <span className="typewriter-guidance-content">
        Please tell your symptoms... / કૃપા કરીને તમારા લક્ષણો જણાવો... / कृपया अपने लक्षण बताएं...
      </span>
    );
  }

  const currentMsg = SEGMENTED_MESSAGES[messageIndex];
  const displayedText = currentMsg.graphemes.slice(0, charCount).join('');

  return (
    <span className="typewriter-guidance-content" aria-live="polite">
      <span className="typewriter-text">{displayedText}</span>
      {isActive && (
        <span
          className="typewriter-cursor"
          aria-hidden="true"
        />
      )}
    </span>
  );
}

export default TypewriterGuidance;
