import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface MysteryCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
  path: string;
}

export const MysteryCard: React.FC<MysteryCardProps> = ({ icon, title, description, index, path }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleInteraction = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <motion.div 
      className="relative aspect-[3/5] w-full max-w-72 mx-auto cursor-pointer mystery-card-particles rounded-2xl overflow-hidden"
      initial={{ opacity: 0, y: 50, rotateZ: (index - 1) * 5 }}
      whileInView={{ opacity: 1, y: 0, rotateZ: (index - 1) * 2 }}
      whileHover={{ 
        y: -10, 
        scale: 1.05, 
        rotateZ: (index - 1) * 2,
        boxShadow: "0 20px 40px rgba(214, 174, 96, 0.3)"
      }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: index * 0.1 }}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <div
        className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Face */}
        <div 
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-royal-gold/90 via-rose-champagne/90 to-royal-gold/90 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-center items-center text-center backface-hidden border border-royal-gold/30 shadow-2xl"
          style={{ 
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(0deg)'
          }}
        >
          <div className="text-royal-purple mb-4 transform transition-all duration-300 hover:scale-110 hover:text-royal-gold drop-shadow-[0_2px_6px_rgba(0,0,0,0.10)]">
            {icon}
          </div>
          <h4 className="font-serif text-2xl font-bold text-royal-purple mb-4 transition-colors duration-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.10)]">
            {title}
          </h4>
          <div className="text-royal-purple/80 text-sm font-sans italic drop-shadow-[0_2px_6px_rgba(0,0,0,0.10)]">
            <span className="hidden md:inline">Survole pour découvrir</span>
            <span className="md:hidden">Touche pour découvrir</span>
          </div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-royal-gold/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
        {/* Back Face */}
        <div 
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-rose-champagne/80 via-white to-rose-champagne/90 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-center items-center text-center gilded-finish backface-hidden border border-royal-gold/30 shadow-2xl"
          style={{ 
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="text-royal-purple mb-4 transform scale-90 transition-transform duration-300">
            {icon}
          </div>
          <h4 className="font-serif text-xl font-bold text-royal-purple mb-4">
            {title}
          </h4>
          <p className="text-royal-purple/90 text-sm leading-relaxed font-sans">
            {description}
          </p>
          <Link
            to={path}
            className="mt-8 inline-block px-8 py-3 rounded-full bg-gradient-to-r from-imperial-gold via-rose-champagne to-imperial-gold text-royal-purple font-bold text-lg border-4 border-imperial-gold ring-2 ring-white/80 shadow-lg hover:from-imperial-gold hover:to-rose-champagne hover:shadow-royal hover:scale-105 hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-imperial-gold focus:ring-offset-2 focus:ring-offset-white transition-all duration-200 drop-shadow-[0_4px_16px_rgba(214,174,96,0.35)]"
            tabIndex={0}
            aria-label={`Commencer sur ${title}`}
          >
            Commencer
          </Link>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-30 pointer-events-none" />
          <div className="absolute inset-0 rounded-2xl border-2 border-royal-gold/70 animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}; 