// Animation variants for Framer Motion
// For input field - enters from bottom, exits upward
export const fadeOutUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeOut" } },
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeOut" } },
};

export const fadeInUpWithDelay = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut", delay },
  },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeOut" } },
});

// For cards that appear after input disappears
export const fadeInUpDelayed = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut", delay: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeOut" } },
};

// For initial page load animations with custom stagger timing
export const fadeInUpStagger = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut", delay } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeOut" } },
});
