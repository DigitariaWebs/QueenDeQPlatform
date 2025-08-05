import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface MysteryCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
  path: string;
  isFlipped: boolean;
  onFlip: () => void;
  image: string;
}

export const MysteryCard: React.FC<MysteryCardProps> = ({ icon, title, description, index, path, isFlipped, onFlip, image }) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const handleClick = () => {
    onFlip();
  };

  const handleMouseEnter = () => {
    // Only use hover on non-touch devices
    if (!isTouchDevice) {
      onFlip();
    }
  };

  const handleMouseLeave = () => {
    // Only use hover on non-touch devices and if card is flipped
    if (!isTouchDevice && isFlipped) {
      onFlip();
    }
  };

  const handleTouchStart = () => {
    setIsTouchDevice(true);
  };

  return (
    <motion.div 
      className="relative aspect-[3/5] w-full max-w-48 sm:max-w-60 lg:max-w-72 mx-auto cursor-pointer mystery-card-particles rounded-2xl overflow-hidden touch-manipulation select-none"
      initial={{ opacity: 1, y: 0, rotateZ: (index - 1) * 2 }}
      animate={{ opacity: 1, y: 0, rotateZ: (index - 1) * 2 }}
      whileHover={{ 
        y: -10, 
        scale: 1.05, 
        rotateZ: (index - 1) * 2,
        boxShadow: "0 20px 40px rgba(214, 174, 96, 0.3)"
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0, delay: 0 }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
    >
      <div
        className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Face */}
        <div 
          className="absolute inset-0 w-full h-full rounded-2xl backface-hidden border border-royal-gold/30 shadow-2xl overflow-hidden"
          style={{ 
            backgroundImage: `url('${image}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(0deg)'
          }}
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-royal-gold/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
        {/* Back Face */}
        <div 
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-rose-champagne/80 via-white to-rose-champagne/90 backdrop-blur-md rounded-2xl p-4 sm:p-6 lg:p-8 flex flex-col justify-center items-center text-center gilded-finish backface-hidden border border-royal-gold/30 shadow-2xl"
          style={{ 
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="text-royal-purple transform scale-90 transition-transform duration-300 flex justify-center items-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex items-center justify-center">
              {icon}
            </div>
          </div>
          <h4 className="font-serif text-base sm:text-lg lg:text-xl font-bold text-royal-purple mb-2 sm:mb-3 lg:mb-3 leading-tight text-center px-1">
            {title}
          </h4>
          <p className="text-royal-purple/90 text-xs sm:text-sm lg:text-base leading-relaxed font-sans mb-6 sm:mb-8 lg:mb-8 text-center px-1">
            {description}
          </p>
          <Link
            to={path}
            className="inline-block px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 lg:py-3 rounded-full bg-gradient-to-r from-imperial-gold via-rose-champagne to-imperial-gold text-royal-purple font-bold text-sm sm:text-base lg:text-lg border-2 border-imperial-gold ring-1 sm:ring-2 ring-white/80 shadow-lg hover:from-imperial-gold hover:to-rose-champagne hover:shadow-royal hover:scale-105 hover:brightness-110 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-imperial-gold focus:ring-offset-2 focus:ring-offset-white transition-all duration-200 drop-shadow-[0_4px_16px_rgba(214,174,96,0.35)]"
            tabIndex={0}
            aria-label={`Commencer sur ${title}`}
          >
            {title}
          </Link>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-30 pointer-events-none" />
          <div className="absolute inset-0 rounded-2xl border-2 border-royal-gold/70 animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}; 