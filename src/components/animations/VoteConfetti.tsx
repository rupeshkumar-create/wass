"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

interface VoteConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
}

export function VoteConfetti({ trigger, onComplete }: VoteConfettiProps) {
  useEffect(() => {
    if (!trigger) return;

    const fireConfetti = () => {
      // Small burst for vote success
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#FF6A00', '#FFB37A', '#FFCEA8', '#FFF5ED'],
        gravity: 0.8,
        scalar: 0.8,
      });

      // Delayed second burst
      setTimeout(() => {
        confetti({
          particleCount: 30,
          spread: 40,
          origin: { y: 0.8 },
          colors: ['#FF6A00', '#FFB37A'],
          gravity: 0.6,
          scalar: 0.6,
        });
        onComplete?.();
      }, 200);
    };

    fireConfetti();
  }, [trigger, onComplete]);

  return null;
}

export function fireVoteConfetti() {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.8 },
    colors: ['#FF6A00', '#FFB37A', '#FFCEA8', '#FFF5ED'],
    gravity: 0.8,
    scalar: 0.8,
  });
}

export function fireCelebrationConfetti() {
  // Large celebration for major milestones
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { 
    startVelocity: 30, 
    spread: 360, 
    ticks: 60, 
    zIndex: 0,
    colors: ['#FF6A00', '#FFB37A', '#FFCEA8', '#FFF5ED', '#DB5600']
  };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    });
  }, 250);
}