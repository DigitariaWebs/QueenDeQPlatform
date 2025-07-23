// Palette Queen de Q - Configuration des couleurs
export const colors = {
  // PALETTE 1 — Royauté sacrée
  royal: {
    purple: '#3B1E50',      // Pourpre profond royal - Fond principal, blocs
    gold: '#D6AE60',        // Or impérial métallique - Titres, ornements, contours
    champagne: '#D4B5A5',   // Rose champagne doux - Accents émotionnels, hover
    velvet: '#1B1B1B',      // Noir velours - Texte et cadres
    pearl: '#FDF7F2',       // Blanc nacré chaud - Fond clair alternatif
  },
  
  // PALETTE 2 — Cabinet de curiosités féminin
  cabinet: {
    aubergine: '#4B2E43',   // Aubergine vieilli - Fond et profondeur
    patina: '#B79D74',      // Doré patiné - Contours, effets graphiques
    powder: '#E8C5C1',      // Rose poudre - Cœur visuel doux
    parchment: '#F5EBD6',   // Crème parchemin - Fond papier ancien
    ink: '#181818',         // Encre noire - Texte net
  },
  
  // PALETTE 3 — Rituel et lumière
  ritual: {
    indigo: '#241B2F',      // Indigo noir encré - Fond nuit/mystère
    smokedGold: '#C8A96B',  // Or doux fumé - Art déco discret
    vintage: '#E3BBB2',     // Rose ancien - Ambiance sentimentale
    moonMilk: '#FFF9F3',    // Lait de lune - Fond clair alternatif
    amber: '#776650',       // Fumée d'ambre - Liaison graphique
  },
  
  // Couleurs principales (basées sur Palette 1)
  primary: {
    50: '#FDF7F2',   // pearl
    100: '#E8D4D9',
    200: '#D4B5A5',  // champagne
    300: '#D6AE60',  // gold
    400: '#C8A96B',  // smokedGold
    500: '#3B1E50',  // purple (main)
    600: '#4B2E43',  // aubergine
    700: '#241B2F',  // indigo
    800: '#1B1B1B',  // velvet
    900: '#181818',  // ink
  },
  
  // Statuts avec la palette Queen
  success: '#B79D74',    // patina gold
  warning: '#D6AE60',    // imperial gold
  error: '#8B4B6B',      // purple variant
  info: '#C8A96B',       // smoked gold
};

// Gradients Queen de Q
export const gradients = {
  royal: 'linear-gradient(135deg, #3B1E50 0%, #4B2E43 100%)',
  mystical: 'linear-gradient(135deg, #241B2F 0%, #3B1E50 100%)',
  golden: 'linear-gradient(135deg, #D6AE60 0%, #B79D74 100%)',
  soft: 'linear-gradient(135deg, #FDF7F2 0%, #E8C5C1 100%)',
  cabinet: 'linear-gradient(135deg, #4B2E43 0%, #241B2F 100%)',
};

// Couleurs d'état pour l'interface
export const stateColors = {
  hover: {
    gold: '#E6BE70',      // gold lighter
    champagne: '#E4C5B5', // champagne lighter
    purple: '#4B2E60',    // purple lighter
  },
  active: {
    gold: '#C69E50',      // gold darker
    champagne: '#C4A595', // champagne darker
    purple: '#2B0E40',    // purple darker
  },
  disabled: {
    text: '#776650',      // amber
    bg: '#F5EBD6',        // parchment
  }
};

export default colors; 