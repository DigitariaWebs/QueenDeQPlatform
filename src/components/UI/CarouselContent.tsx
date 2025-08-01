import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface SlideData {
  id: string;
  illustration: string;
  title: string;
  caption: string;
  ariaLabel: string;
}

interface CarouselContentProps {
  slideData: SlideData[];
  KeenSlider: any;
  prefersReducedMotion: boolean;
  className?: string;
}

const CarouselContent = ({ slideData, KeenSlider, prefersReducedMotion, className = '' }: CarouselContentProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoplayPaused, setAutoplayPaused] = useState(false);
  const [hasPulseAnimated, setHasPulseAnimated] = useState(false);
  const [sliderRef, setSliderRef] = useState<any>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Setup keen-slider
  const { useKeenSlider } = KeenSlider;
  const [sliderReference] = useKeenSlider({
    loop: true,
    slides: {
      perView: 1,
      spacing: 24,
    },
    breakpoints: {
      '(min-width: 768px)': {
        slides: {
          perView: 2,
          spacing: 24,
        },
      },
      '(min-width: 1024px)': {
        slides: {
          perView: 4,
          spacing: 24,
        },
      },
    },
    slideChanged(slider: any) {
      setCurrentSlide(slider.track.details.rel);
    },
    created(slider: any) {
      setSliderRef(slider);
    },
  });

  // Setup autoplay
  const startAutoplay = useCallback(() => {
    if (prefersReducedMotion || autoplayPaused) return;
    
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideData.length);
      if (sliderRef?.next) {
        sliderRef.next();
      }
    }, 6000);
  }, [prefersReducedMotion, autoplayPaused, sliderRef, slideData.length]);

  const stopAutoplay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Handle autoplay
  useEffect(() => {
    if (!prefersReducedMotion) {
      startAutoplay();
    }
    
    return () => stopAutoplay();
  }, [prefersReducedMotion, startAutoplay, stopAutoplay]);

  // Pause autoplay on hover/focus
  const handleMouseEnter = useCallback(() => {
    setAutoplayPaused(true);
    stopAutoplay();
  }, [stopAutoplay]);

  const handleMouseLeave = useCallback(() => {
    setAutoplayPaused(false);
    if (!prefersReducedMotion) {
      startAutoplay();
    }
  }, [prefersReducedMotion, startAutoplay]);

  // Pulse animation for first slide
  useEffect(() => {
    if (!hasPulseAnimated) {
      const timer = setTimeout(() => {
        setHasPulseAnimated(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasPulseAnimated]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setCurrentSlide(index);
      if (sliderRef?.moveToIdx) {
        sliderRef.moveToIdx(index);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      setCurrentSlide(index - 1);
      if (sliderRef?.prev) {
        sliderRef.prev();
      }
    } else if (e.key === 'ArrowRight' && index < slideData.length - 1) {
      setCurrentSlide(index + 1);
      if (sliderRef?.next) {
        sliderRef.next();
      }
    }
  };

  return (
    <section 
      ref={containerRef}
      className={`mt-20 ${className}`}
      role="region"
      aria-label="How to use your cards"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="max-w-6xl mx-auto px-4">
        {/* Header Section - Design Royal Cohérent */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative inline-block"
          >
            <h2 className="text-4xl font-playfair font-bold text-royal-gold mb-4">
              Comment utiliser tes cartes
            </h2>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-royal-gold rounded-full"></div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-royal-pearl/80 font-raleway max-w-3xl mx-auto mt-6"
          >
            Quatre étapes simples pour commencer ton voyage introspectif.
          </motion.p>
        </div>

        {/* Carousel avec design royal */}
        <div className="relative">
          <div ref={sliderReference} className="keen-slider">
            {slideData.map((slide, index) => (
              <div key={slide.id} className="keen-slider__slide">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className="relative group"
                  tabIndex={0}
                  role="button"
                  aria-label={slide.ariaLabel}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onClick={() => {
                    setCurrentSlide(index);
                    if (sliderRef?.moveToIdx) {
                      sliderRef.moveToIdx(index);
                    }
                  }}
                >
                  {/* Card Background */}
                  <div className="absolute inset-0 bg-royal-purple/40 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                  
                  {/* Card Content */}
                  <div className={`relative bg-royal-purple/60 backdrop-blur-xl rounded-2xl p-6 border border-royal-gold/40 shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-2 h-[320px] flex flex-col cursor-pointer
                    ${currentSlide === index ? 'ring-2 ring-royal-gold/50' : ''}
                    ${!hasPulseAnimated && index === 0 ? 'animate-pulse' : ''}
                  `}>
                    
                    {/* Texture ornementale */}
                    <div className="absolute inset-0 opacity-10 rounded-2xl overflow-hidden">
                      <div className="absolute top-4 right-4 w-2 h-2 bg-royal-gold rounded-full"></div>
                      <div className="absolute bottom-6 left-6 w-1 h-1 bg-royal-champagne rounded-full"></div>
                    </div>

                    {/* Icon Container */}
                    <div className="relative mb-4 flex justify-center flex-shrink-0">
                      <div className="w-20 h-20 bg-royal-purple/40 rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                        <div className="w-16 h-16 bg-royal-gold rounded-full flex items-center justify-center shadow-lg">
                          <img 
                            src={slide.illustration} 
                            alt="" 
                            className="w-8 h-8 filter brightness-0 invert"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-playfair font-bold text-royal-pearl text-xl mb-3 text-center flex-shrink-0">
                      {slide.title}
                    </h3>

                    {/* Caption */}
                    <div className="flex-grow flex items-center justify-center">
                      <p className="font-raleway text-royal-pearl/80 leading-relaxed text-center text-base">
                        {slide.caption}
                      </p>
                    </div>

                    {/* Numéro de l'étape */}
                    <div className="absolute top-4 left-4 w-8 h-8 bg-royal-gold/80 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    </div>

                    {/* Ligne décorative en bas */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-royal-gold/40"></div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>

          {/* Dots Navigation améliorée */}
          <div className="flex justify-center mt-8 space-x-3">
            {slideData.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentSlide(index);
                  if (sliderRef?.moveToIdx) {
                    sliderRef.moveToIdx(index);
                  }
                }}
                className={`w-3 h-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-royal-gold/60 ${
                  currentSlide === index 
                    ? 'bg-royal-gold shadow-lg scale-125' 
                    : 'bg-royal-gold/30 hover:bg-royal-gold/50 hover:scale-110'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Ornements décoratifs */}
          <div className="absolute top-10 left-10 w-4 h-4 bg-royal-gold/30 rounded-full animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-3 h-3 bg-royal-champagne/40 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
      </div>
    </section>
  );
};

export default CarouselContent;