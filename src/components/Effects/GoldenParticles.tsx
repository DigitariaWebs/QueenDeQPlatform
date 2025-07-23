import React from 'react';
import { motion } from 'framer-motion';

interface GoldenParticlesProps {
  intensity?: 'low' | 'medium' | 'high';
  interactive?: boolean;
}

const GoldenParticles: React.FC<GoldenParticlesProps> = ({ 
  intensity = 'medium'
}) => {
  const particleCount = intensity === 'low' ? 6 : intensity === 'medium' ? 12 : 20;
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(particleCount)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-imperial-gold rounded-full opacity-30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default GoldenParticles;