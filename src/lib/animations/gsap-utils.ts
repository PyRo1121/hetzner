/**
 * GSAP Animation Utilities
 * Reusable animation presets for consistent UX
 */

import { gsap } from 'gsap';

/**
 * Fade in animation
 */
export function fadeIn(element: HTMLElement, duration = 0.5, delay = 0) {
  return gsap.fromTo(
    element,
    { opacity: 0, y: 20 },
    {
      opacity: 1,
      y: 0,
      duration,
      delay,
      ease: 'power2.out',
    }
  );
}

/**
 * Fade out animation
 */
export function fadeOut(element: HTMLElement, duration = 0.3) {
  return gsap.to(element, {
    opacity: 0,
    y: -20,
    duration,
    ease: 'power2.in',
  });
}

/**
 * Scale pulse animation
 */
export function scalePulse(element: HTMLElement, scale = 1.05, duration = 0.3) {
  return gsap.to(element, {
    scale,
    duration,
    ease: 'power2.out',
    yoyo: true,
    repeat: 1,
  });
}

/**
 * Shake animation (for errors)
 */
export function shake(element: HTMLElement) {
  return gsap.fromTo(
    element,
    { x: -5 },
    {
      x: 5,
      duration: 0.1,
      repeat: 5,
      yoyo: true,
      ease: 'power1.inOut',
      onComplete: () => {
        gsap.set(element, { x: 0 });
      },
    }
  );
}

/**
 * Bounce in animation
 */
export function bounceIn(element: HTMLElement, delay = 0) {
  return gsap.fromTo(
    element,
    {
      opacity: 0,
      scale: 0.3,
      y: -100,
    },
    {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.6,
      delay,
      ease: 'bounce.out',
    }
  );
}

/**
 * Slide in from direction
 */
export function slideIn(
  element: HTMLElement,
  direction: 'left' | 'right' | 'top' | 'bottom' = 'left',
  duration = 0.5,
  delay = 0
) {
  const fromVars: any = { opacity: 0 };
  
  switch (direction) {
    case 'left':
      fromVars.x = -100;
      break;
    case 'right':
      fromVars.x = 100;
      break;
    case 'top':
      fromVars.y = -100;
      break;
    case 'bottom':
      fromVars.y = 100;
      break;
  }

  return gsap.fromTo(
    element,
    fromVars,
    {
      opacity: 1,
      x: 0,
      y: 0,
      duration,
      delay,
      ease: 'power3.out',
    }
  );
}

/**
 * Stagger animation for lists
 */
export function staggerIn(elements: HTMLElement[], staggerDelay = 0.1) {
  return gsap.fromTo(
    elements,
    {
      opacity: 0,
      y: 30,
    },
    {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: staggerDelay,
      ease: 'power2.out',
    }
  );
}

/**
 * Number counter animation
 */
export function animateNumber(
  element: HTMLElement,
  from: number,
  to: number,
  duration = 1,
  decimals = 0
) {
  const obj = { value: from };
  
  return gsap.to(obj, {
    value: to,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      element.textContent = obj.value.toFixed(decimals);
    },
  });
}

/**
 * Glow pulse animation
 */
export function glowPulse(element: HTMLElement, color = 'rgba(59, 130, 246, 0.8)') {
  return gsap.fromTo(
    element,
    {
      boxShadow: `0 0 0px ${color}`,
    },
    {
      boxShadow: `0 0 20px ${color}`,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    }
  );
}

/**
 * Rotate animation
 */
export function rotate(element: HTMLElement, degrees = 360, duration = 1) {
  return gsap.to(element, {
    rotation: degrees,
    duration,
    ease: 'power2.inOut',
  });
}

/**
 * Flip animation
 */
export function flip(element: HTMLElement, axis: 'x' | 'y' = 'y', duration = 0.6) {
  const property = axis === 'x' ? 'rotationX' : 'rotationY';
  
  return gsap.fromTo(
    element,
    { [property]: 0 },
    {
      [property]: 180,
      duration,
      ease: 'power2.inOut',
    }
  );
}

/**
 * Morph animation (for SVG paths)
 */
export function morphPath(element: SVGPathElement, newPath: string, duration = 0.5) {
  return gsap.to(element, {
    attr: { d: newPath },
    duration,
    ease: 'power2.inOut',
  });
}

/**
 * Parallax scroll effect
 */
export function parallax(element: HTMLElement, speed = 0.5) {
  const handleScroll = () => {
    const scrollY = window.scrollY;
    gsap.to(element, {
      y: scrollY * speed,
      duration: 0.3,
      ease: 'power1.out',
    });
  };

  window.addEventListener('scroll', handleScroll);
  
  return () => window.removeEventListener('scroll', handleScroll);
}

/**
 * Typewriter effect
 */
export function typewriter(element: HTMLElement, text: string, duration = 2) {
  const chars = text.split('');
  element.textContent = '';
  
  return gsap.to({}, {
    duration,
    ease: 'none',
    onUpdate() {
      const progress = this.progress();
      const currentIndex = Math.floor(progress * chars.length);
      element.textContent = chars.slice(0, currentIndex).join('');
    },
  });
}

/**
 * Kill all animations on element
 */
export function killAnimations(element: HTMLElement) {
  gsap.killTweensOf(element);
}

/**
 * Reset element to default state
 */
export function resetElement(element: HTMLElement) {
  gsap.set(element, {
    clearProps: 'all',
  });
}
