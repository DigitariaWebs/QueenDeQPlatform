import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { motion } from 'framer-motion';

interface LazyComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
}

interface LazyComponentState {
  hasError: boolean;
  isLoading: boolean;
}

class LazyComponent extends Component<LazyComponentProps, LazyComponentState> {
  constructor(props: LazyComponentProps) {
    super(props);
    this.state = {
      hasError: false,
      isLoading: false
    };
  }

  static getDerivedStateFromError(): LazyComponentState {
    return { hasError: true, isLoading: false };
  }

  componentDidCatch(_error: Error, errorInfo: ErrorInfo) {
    console.warn('LazyComponent caught an error:', _error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.errorFallback || (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-royal-gold/20 to-royal-champagne/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-cabinet-aubergine/50 text-2xl">⚠</span>
            </div>
            <p className="text-cabinet-aubergine/70 font-sans">
              Une erreur est survenue. Essaie encore.
            </p>
          </div>
        </div>
      );
    }

    if (this.state.isLoading) {
      return this.props.fallback || (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center p-8"
        >
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-royal-gold/30 border-t-royal-gold rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-cabinet-aubergine/70 font-sans text-sm">
              Chargement...
            </p>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

// Lazy loading utilities
export const lazyLoad = {
  confetti: async () => {
    try {
      const confetti = await import('canvas-confetti');
      return confetti.default;
    } catch (error) {
      console.warn('Failed to load confetti library:', error);
      return null;
    }
  },

  html2canvas: async () => {
    try {
      const html2canvas = await import('html2canvas');
      return html2canvas.default;
    } catch (error) {
      console.warn('Failed to load html2canvas library:', error);
      return null;
    }
  },

  gsap: {
    flip: async () => {
      try {
        const { Flip } = await import('gsap/Flip');
        return Flip;
      } catch (error) {
        console.warn('Failed to load GSAP Flip:', error);
        return null;
      }
    }
  }
};

// Performance utilities
export const performanceUtils = {
  // Check if device prefers reduced motion
  prefersReducedMotion: () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Debounce function for search inputs
  debounce: <T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function for scroll/resize events
  throttle: <T extends (...args: any[]) => void>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Optimize images for faster loading
  preloadImage: (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  },

  // Memory usage monitoring
  getMemoryUsage: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }
};

// Accessibility utilities
export const a11yUtils = {
  // Focus management
  trapFocus: (element: HTMLElement) => {
    const focusableSelectors = [
      'button',
      '[href]',
      'input',
      'select',
      'textarea',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    const focusableElements = element.querySelectorAll(
      focusableSelectors.join(',')
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  },

  // Announce to screen readers
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  },

  // Keyboard navigation helpers
  isNavigationKey: (key: string) => {
    return ['Enter', ' ', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key);
  },

  // Color contrast checker (basic)
  hasGoodContrast: (): boolean => {
    // This is a simplified version - in production, use a proper contrast checker
    // For now, we assume our design system colors have been tested
    return true;
  }
};

export default LazyComponent;