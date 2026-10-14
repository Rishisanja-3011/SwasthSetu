import React, { useState, useEffect, useRef } from 'react';

/**
 * Cubic ease-out mathematical curve: f(t) = 1 - (1 - t)^3.
 * Starts with strong positive momentum and gently decelerates as it approaches the final value.
 * @param {number} t - Progress between 0 and 1
 * @returns {number} Eased progress between 0 and 1
 */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Custom React hook for animating numerical values smoothly.
 *
 * @param {number|null|undefined} target - Final numerical target value
 * @param {Object} options
 * @param {number} [options.duration=1200] - Total duration in ms for initial load count (1.2s)
 * @param {number} [options.updateDuration=600] - Total duration in ms for incremental value changes (0.6s)
 * @param {boolean} [options.enabled=true] - Whether the counter animation is active
 * @returns {{ count: number, isAnimating: boolean, hasLoaded: boolean }}
 */
export function useAnimatedCounter(target, options = {}) {
  const {
    duration = 1200,
    updateDuration = 600,
    enabled = true,
  } = options;

  const isTargetValid = typeof target === 'number' && !isNaN(target);
  const numericTarget = isTargetValid ? Math.round(target) : 0;

  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const prevTargetRef = useRef(null);
  const currentCountRef = useRef(0);
  const animFrameRef = useRef(null);
  const isFirstRunRef = useRef(true);

  // Sync ref with current state for smooth transition continuity
  currentCountRef.current = count;

  useEffect(() => {
    // If not enabled or target is not yet available, do not animate
    if (!enabled || !isTargetValid) {
      return;
    }

    // Check system prefers-reduced-motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setCount(numericTarget);
      setHasLoaded(true);
      prevTargetRef.current = numericTarget;
      isFirstRunRef.current = false;
      return;
    }

    // Prevent duplicate re-animations if target did not change
    if (prevTargetRef.current === numericTarget) {
      return;
    }

    // Initial mount counts from 0; subsequent API polls count from previous value
    const startValue = isFirstRunRef.current ? 0 : currentCountRef.current;
    const endValue = numericTarget;
    prevTargetRef.current = numericTarget;

    // If start and end are already equal after initial run, nothing to animate
    if (startValue === endValue && !isFirstRunRef.current) {
      return;
    }

    // If start and end are 0 on initial mount, set immediately without waiting
    if (startValue === endValue && isFirstRunRef.current) {
      setCount(endValue);
      setIsAnimating(false);
      setHasLoaded(true);
      isFirstRunRef.current = false;
      return;
    }

    isFirstRunRef.current = false;
    setIsAnimating(true);
    setHasLoaded(true);

    const animDuration = startValue === 0 ? duration : Math.min(updateDuration, duration);
    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / animDuration, 1);
      const easedProgress = easeOutCubic(progress);

      const current = Math.round(startValue + (endValue - startValue) * easedProgress);
      setCount(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        setCount(endValue);
        setIsAnimating(false);
      }
    };

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [numericTarget, enabled, isTargetValid, duration, updateDuration]);

  return { count, isAnimating, hasLoaded };
}

/**
 * AnimatedCounter Component
 *
 * Renders an animated integer value that smoothly counts up from 0 (or from its previous value)
 * to its actual target. Retains the parent typography, color, size, and layout without any visual shift.
 */
export function AnimatedCounter({
  value,
  duration = 1200,
  updateDuration = 600,
  enabled = true,
  className = '',
  style = {},
  fallback = '—',
}) {
  const isTargetValid = typeof value === 'number' && !isNaN(value);
  const { count, hasLoaded } = useAnimatedCounter(value, {
    duration,
    updateDuration,
    enabled: enabled && isTargetValid,
  });

  if (!isTargetValid) {
    return (
      <span
        className={`animated-counter-loading ${className}`.trim()}
        style={{
          display: 'inline-block',
          fontVariantNumeric: 'tabular-nums',
          opacity: 0.35,
          userSelect: 'none',
          ...style,
        }}
        aria-busy="true"
        aria-label="Loading..."
      >
        {fallback}
      </span>
    );
  }

  return (
    <span
      className={`animated-counter ${className}`.trim()}
      style={{
        display: 'inline-block',
        fontVariantNumeric: 'tabular-nums',
        transition: 'opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: hasLoaded ? 1 : 0.65,
        ...style,
      }}
      aria-label={String(value)}
      aria-live="polite"
    >
      {count}
    </span>
  );
}

export default AnimatedCounter;
