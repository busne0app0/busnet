/**
 * Custom smooth scroll with duration and easing
 */
export const slowMotionScroll = (targetY: number, duration: number = 1000) => {
  const startY = window.pageYOffset;
  const diff = targetY - startY;
  let start: number | null = null;

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
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
};
