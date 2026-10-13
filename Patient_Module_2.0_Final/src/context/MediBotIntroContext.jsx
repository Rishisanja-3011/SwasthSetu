import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MediBotIntroOverlay } from '../components/MediBotIntroOverlay';

const MediBotIntroContext = createContext(null);

export function MediBotIntroProvider({ children }) {
  const [isIntroActive, setIsIntroActive] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isNavigatingRef = useRef(false);
  const introTimerRef = useRef(null);
  const revealTimerRef = useRef(null);

  // Preload the MediBot robot avatar image for immediate crisp display
  useEffect(() => {
    const preloadImg = new Image();
    preloadImg.src = '/images/medibot-robot-avatar.png';
  }, []);

  // Ensure timers are cleaned up on unmount
  useEffect(() => {
    return () => {
      if (introTimerRef.current) clearTimeout(introTimerRef.current);
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, []);

  const triggerMediBotIntro = useCallback(() => {
    // If the user is already on the assistant page, or the intro is already running,
    // prevent multiple timers or duplicate navigation.
    if (location.pathname === '/assistant' || isIntroActive || isNavigatingRef.current) {
      return;
    }

    isNavigatingRef.current = true;
    setIsRevealing(false);
    setIsIntroActive(true);

    const isReduced = typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = isReduced ? 1200 : 2500;

    // Keep the intro overlay fully opaque and visible for the entire duration (~2.5s).
    // At the end of the duration, navigate DIRECTLY to '/assistant'.
    // The overlay remains mounted and fully opaque during the route change so
    // no intermediate page or previous route can EVER flash.
    introTimerRef.current = setTimeout(() => {
      navigate('/assistant');
    }, duration);
  }, [location.pathname, isIntroActive, navigate]);

  // When the router successfully reaches '/assistant', MediBot is rendered
  // underneath the overlay. Now initiate the reveal so it seamlessly reveals MediBot.
  useEffect(() => {
    if (isIntroActive && location.pathname === '/assistant') {
      setIsRevealing(true);
      revealTimerRef.current = setTimeout(() => {
        setIsIntroActive(false);
        setIsRevealing(false);
        isNavigatingRef.current = false;
      }, 220);
    }
  }, [location.pathname, isIntroActive]);

  // User skip (e.g. pressed Escape): immediately navigate to /assistant
  const handleSkip = useCallback(() => {
    if (introTimerRef.current) clearTimeout(introTimerRef.current);
    navigate('/assistant');
  }, [navigate]);

  return (
    <MediBotIntroContext.Provider value={{ triggerMediBotIntro, isIntroActive }}>
      {children}
      {isIntroActive && (
        <MediBotIntroOverlay
          isRevealing={isRevealing}
          onSkip={handleSkip}
        />
      )}
    </MediBotIntroContext.Provider>
  );
}

export function useMediBotIntro() {
  const context = useContext(MediBotIntroContext);
  if (!context) {
    throw new Error('useMediBotIntro must be used within a MediBotIntroProvider');
  }
  return context;
}

export default MediBotIntroContext;
