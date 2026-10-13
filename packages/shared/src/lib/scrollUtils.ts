/**
 * Custom smooth scroll with duration and easing with cancellation support
 */
let currentAnimationId: number | null = null;
let currentCleanupListener: (() => void) | null = null;

export const cancelSlowMotionScroll = () => {
  if (currentAnimationId !== null) {
    window.cancelAnimationFrame(currentAnimationId);
    currentAnimationId = null;
  }
  if (currentCleanupListener) {
    currentCleanupListener();
    currentCleanupListener = null;
  }
};

export const slowMotionScroll = (targetY: number, duration: number = 1000): (() => void) => {
  cancelSlowMotionScroll();

  const startY = window.pageYOffset || document.documentElement.scrollTop;
  const diff = targetY - startY;
  if (Math.abs(diff) < 5) return () => {};

  let start: number | null = null;

  const onUserInteraction = () => {
    cancelSlowMotionScroll();
  };

  window.addEventListener('wheel', onUserInteraction, { passive: true });
  window.addEventListener('touchmove', onUserInteraction, { passive: true });
  currentCleanupListener = () => {
    window.removeEventListener('wheel', onUserInteraction);
    window.removeEventListener('touchmove', onUserInteraction);
  };

  const step = (timestamp: number) => {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    const time = Math.min(progress / duration, 1);

    // Easing: easeInOutCubic
    const ease = time < 0.5
      ? 4 * time * time * time
      : 1 - Math.pow(-2 * time + 2, 3) / 2;

    window.scrollTo(0, startY + diff * ease);

    if (progress < duration) {
      currentAnimationId = window.requestAnimationFrame(step);
    } else {
      cancelSlowMotionScroll();
    }
  };

  currentAnimationId = window.requestAnimationFrame(step);
  return cancelSlowMotionScroll;
};
