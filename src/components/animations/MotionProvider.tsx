"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";

interface MotionContextType {
  reduceMotion: boolean;
  toggleMotion: () => void;
}

const MotionContext = createContext<MotionContextType>({
  reduceMotion: false,
  toggleMotion: () => {},
});

export const useMotionPreference = () => useContext(MotionContext);

interface MotionProviderProps {
  children: React.ReactNode;
}

export function MotionProvider({ children }: MotionProviderProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // Check system preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mediaQuery.matches);

    // Check localStorage preference
    const stored = localStorage.getItem("reduce-motion");
    if (stored !== null) {
      setReduceMotion(stored === "true");
    }

    // Listen for changes
    const handleChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem("reduce-motion") === null) {
        setReduceMotion(e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    // Apply CSS class to document
    if (reduceMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
  }, [reduceMotion]);

  const toggleMotion = () => {
    const newValue = !reduceMotion;
    setReduceMotion(newValue);
    localStorage.setItem("reduce-motion", newValue.toString());
  };

  return (
    <MotionContext.Provider value={{ reduceMotion, toggleMotion }}>
      <MotionConfig reducedMotion={reduceMotion ? "always" : "never"}>
        {children}
      </MotionConfig>
    </MotionContext.Provider>
  );
}

export function ReduceMotionToggle() {
  const { reduceMotion, toggleMotion } = useMotionPreference();

  return (
    <button
      onClick={toggleMotion}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
      aria-label={reduceMotion ? "Enable animations" : "Reduce animations"}
    >
      {reduceMotion ? "Enable animations" : "Reduce motion"}
    </button>
  );
}