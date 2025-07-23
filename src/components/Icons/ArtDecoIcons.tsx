import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// Icône Art Déco pour les cartes (style tarot mystique)
export const CardsIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10l2 2 4-4"/>
    <circle cx="12" cy="12" r="1" fill="currentColor"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7l10 10M17 7l-10 10"/>
  </svg>
);

// Icône Art Déco pour le miroir (style cristal mystique)
export const MirrorIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
    <circle cx="12" cy="10" r="6" strokeWidth={1.5}/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16v6M8 22h8"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 9l6 2M15 9l-6 2"/>
    <circle cx="12" cy="10" r="2" fill="currentColor" opacity="0.3"/>
  </svg>
);

// Icône Art Déco pour le thé (style service royal)
export const TeaIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 11h1a3 3 0 010 6h-1"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 7v10a2 2 0 002 2h8a2 2 0 002-2V7"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 7h14l-1-4H6l-1 4z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 11h6M9 13h4"/>
    <circle cx="12" cy="5" r="1" fill="currentColor"/>
  </svg>
);

// Icône Art Déco pour la boutique (style coffret royal)
export const BoutiqueIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10l4 9H3l4-9z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8V6a2 2 0 012-2h6a2 2 0 012 2v2"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6M10 15h4"/>
    <circle cx="12" cy="4" r="1" fill="currentColor"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 8l8 8M16 8l-8 8"/>
  </svg>
);

// Icône Art Déco pour le journal (style grimoire)
export const JournalIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7h8M8 10h6M8 13h4"/>
    <circle cx="12" cy="5" r="1" fill="currentColor"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18 7l-8 8M18 15l-8-8"/>
  </svg>
);

// Icône Art Déco pour la couronne (dashboard principal)
export const CrownIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 16l3-8 4 8 4-8 3 8H5z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 20h16"/>
    <circle cx="8" cy="8" r="1" fill="currentColor"/>
    <circle cx="12" cy="4" r="1" fill="currentColor"/>
    <circle cx="16" cy="8" r="1" fill="currentColor"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 12v4"/>
  </svg>
);

// Icône Art Déco pour les étoiles mystiques
export const MysticalStarIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.3"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 8l8 8M16 8l-8 8"/>
  </svg>
);

// Icône Art Déco pour les cristaux
export const CrystalIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 2l6 4 6-4v6l-6 4-6-4V2z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 8l6 4 6-4v6l-6 4-6-4V8z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 14l6 4 6-4v6l-6 4-6-4v-6z"/>
    <circle cx="12" cy="12" r="1" fill="currentColor"/>
  </svg>
);

// Icône Art Déco pour les ornements
export const OrnamentIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v20M2 12h20"/>
    <circle cx="12" cy="12" r="6" strokeWidth={1.5}/>
    <circle cx="12" cy="12" r="3" strokeWidth={1}/>
    <circle cx="12" cy="12" r="1" fill="currentColor"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 8l8 8M16 8l-8 8"/>
  </svg>
);

export default {
  CardsIcon,
  MirrorIcon,
  TeaIcon,
  BoutiqueIcon,
  JournalIcon,
  CrownIcon,
  MysticalStarIcon,
  CrystalIcon,
  OrnamentIcon
};