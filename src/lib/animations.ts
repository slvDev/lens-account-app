// Animation variants for Framer Motion
// For input field - enters from bottom, exits upward
export const fadeOutUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export const fadeInUpWithDelay = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const, delay },
  },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeOut" as const } },
});

// For cards that appear after input disappears
export const fadeInUpDelayed = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const, delay: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeOut" as const } },
};

// For initial page load animations with custom stagger timing
export const fadeInUpStagger = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const, delay } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeOut" as const } },
});
