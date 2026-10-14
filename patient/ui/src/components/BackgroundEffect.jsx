import React from 'react';
import './BackgroundEffect.css';

// Decorative porcelain arcs from the design reference, kept outside the content flow.
export function BackgroundEffect() {
  return (
    <div className="patient-background" aria-hidden="true">
      <div className="patient-background-ring ring-top" />
      <div className="patient-background-disc" />
      <div className="patient-background-ring ring-bottom" />
    </div>
  );
}
