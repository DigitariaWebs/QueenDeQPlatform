import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useMediaQuery } from 'react-responsive';
import CarouselContent from './CarouselContent';

// Lazy load keen-slider
const loadKeenSlider = () => import('keen-slider/react');

const slideData = [
  {
    id: 'explore',
    illustration: '/assets/illustrations/explore.svg',
    title: 'Explorer / Explore',
    caption: 'Clique sur une carte pour révéler son message / Click a card to reveal its message.',
    ariaLabel: 'Explorer - découvrez comment explorer vos cartes'
  },
  {
    id: 'spread',
    illustration: '/assets/illustrations/spread.svg',
    title: 'Tirage / Spread',
    caption: 'Utilise le tirage 3 cartes pour une méditation guidée / Use the 3-card spread for guided reflection.',
    ariaLabel: 'Tirage - découvrez comment faire un tirage de cartes'
  },
  {
    id: 'journal',
    illustration: '/assets/illustrations/journal.svg',
    title: 'Le journal du Royaume',
    caption: 'Ajoute la question miroir à ton journal / Add the mirror question to your journal.',
    ariaLabel: 'Journaler - découvrez comment utiliser votre journal'
  },
  {
    id: 'progress',
    illustration: '/assets/illustrations/progress.svg',
    title: 'Progresser / Progress',
    caption: 'Débloque des célébrations en découvrant plus de cartes / Unlock celebrations as you reveal more cards.',
    ariaLabel: 'Progresser - découvrez comment suivre votre progression'
  }
];

interface CardInstructionCarouselProps {
  className?: string;
}

const CardInstructionCarousel = ({ className = '' }: CardInstructionCarouselProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [KeenSlider, setKeenSlider] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useMediaQuery({ query: '(prefers-reduced-motion: reduce)' });

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Load keen-slider when component becomes visible
  useEffect(() => {
    if (isVisible && !isLoaded) {
      loadKeenSlider()
        .then((module) => {
          setKeenSlider(module);
          setIsLoaded(true);
        })
        .catch(() => {
          console.warn('Failed to load keen-slider, using fallback');
        });
    }
  }, [isVisible, isLoaded]);

  // Render loading state
  if (!isVisible || !isLoaded) {
    return (
      <div ref={containerRef} className={`mt-20 ${className}`}>
        <div className="max-w-5xl mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-royal-gold/20 rounded mb-4 max-w-md mx-auto"></div>
            <div className="h-4 bg-royal-gold/10 rounded mb-8 max-w-lg mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-royal-pearl/30 rounded-xl p-6 border border-royal-gold/20">
                  <div className="w-8 h-8 bg-royal-gold/20 rounded mb-4"></div>
                  <div className="h-4 bg-royal-gold/20 rounded mb-2"></div>
                  <div className="h-3 bg-royal-gold/10 rounded mb-3"></div>
                  <div className="h-3 bg-royal-gold/10 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render with keen-slider
  if (KeenSlider && isLoaded) {
    return (
      <CarouselContent
        slideData={slideData}
        KeenSlider={KeenSlider}
        prefersReducedMotion={prefersReducedMotion}
        className={className}
      />
    );
  }

  // Fallback static version - Design Royal Amélioré
  return (
    <section 
      ref={containerRef}
      className={`mt-20 ${className}`}
      role="region"
      aria-label="How to use your cards"
    >
      <div className="max-w-6xl mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative inline-block"
          >
            <h2 className="text-4xl font-playfair font-bold bg-gradient-to-r from-royal-purple via-royal-purple to-royal-gold bg-clip-text text-transparent mb-4">
              Comment utiliser vos cartes
            </h2>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-royal-gold to-royal-champagne rounded-full"></div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-royal-purple/80 font-raleway max-w-3xl mx-auto mt-6"
          >
            Quatre étapes simples pour commencer votre voyage introspectif.
          </motion.p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {slideData.map((slide, index) => (
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative group h-full"
            >
              {/* Card Background avec gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-white/10 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
              
              {/* Card Content */}
              <div className="relative bg-gradient-to-br from-white/30 via-white/20 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/40 shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-2 h-[320px] flex flex-col">
                
                {/* Texture ornementale */}
                <div className="absolute inset-0 opacity-10 rounded-2xl overflow-hidden">
                  <div className="absolute top-4 right-4 w-2 h-2 bg-royal-gold rounded-full"></div>
                  <div className="absolute bottom-6 left-6 w-1 h-1 bg-royal-champagne rounded-full"></div>
                </div>

                {/* Icon Container */}
                <div className="relative mb-4 flex justify-center flex-shrink-0">
                  <div className="w-20 h-20 bg-gradient-to-br from-royal-gold/20 to-royal-champagne/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <div className="w-16 h-16 bg-gradient-to-br from-royal-gold/80 to-royal-champagne/80 rounded-full flex items-center justify-center shadow-lg">
                      <img 
                        src={slide.illustration} 
                        alt="" 
                        className="w-8 h-8 filter brightness-0 invert"
                      />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-playfair font-bold text-royal-purple text-xl mb-3 text-center flex-shrink-0">
                  {slide.title}
                </h3>

                {/* Caption */}
                <div className="flex-grow flex items-center justify-center">
                  <p className="font-raleway text-royal-purple/80 leading-relaxed text-center text-base">
                    {slide.caption}
                  </p>
                </div>

                {/* Numéro de l'étape */}
                <div className="absolute top-4 left-4 w-8 h-8 bg-royal-gold/80 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">{index + 1}</span>
                </div>

                {/* Ligne décorative en bas */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-royal-gold/40 to-transparent"></div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Ornements décoratifs */}
        <div className="absolute top-10 left-10 w-4 h-4 bg-royal-gold/30 rounded-full animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-3 h-3 bg-royal-champagne/40 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
    </section>
  );
};

export default CardInstructionCarousel;