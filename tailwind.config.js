/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Queen de Q Color Palette
      colors: {
        // Royal palette
        royal: {
          purple: '#3B1E50',
          gold: '#D6AE60',
          champagne: '#D4B5A5',
          velvet: '#1B1B1B',
          pearl: '#FDF7F2',
        },
        // Cabinet palette
        cabinet: {
          aubergine: '#4B2E43',
          patina: '#B79D74',
          powder: '#E8C5C1',
          parchment: '#F5EBD6',
          ink: '#181818',
        },
        // Ritual palette
        ritual: {
          indigo: '#241B2F',
          smokedGold: '#C8A96B',
          vintage: '#E3BBB2',
          moonMilk: '#FFF9F3',
          amber: '#776650',
        },
        // Primary scale based on royal purple
        primary: {
          50: '#FDF7F2',
          100: '#E8D4D9',
          200: '#D4B5A5',
          300: '#D6AE60',
          400: '#C8A96B',
          500: '#3B1E50',
          600: '#4B2E43',
          700: '#241B2F',
          800: '#1B1B1B',
          900: '#181818',
        },
        // Additional color tokens for ChatPage
        'parchment-cream': '#F5EBD6',
        'warm-pearl': '#FDF7F2',
        'powder-rose': '#E8C5C1',
        'antique-rose': '#E3BBB2',
        'moon-milk': '#FFF9F3',
        'amber-smoke': '#776650',
        'patina-gold': '#B79D74',
        'smoky-gold': '#C8A96B',
        'velvet-black': '#1B1B1B',
        'rose-champagne': '#D4B5A5',
        'imperial-gold': '#D6AE60',
        'vintage-aubergine': '#4B2E43',
      },
      // Queen de Q Typography
      fontFamily: {
        'title': ['"Playfair Display"', 'serif'],
        'body': ['"Raleway"', 'sans-serif'],
        'quote': ['"Playfair Display"', 'serif'],
        'sans': ['"Raleway"', 'system-ui', 'sans-serif'],
        'serif': ['"Playfair Display"', 'Georgia', 'serif'],
        'handwriting': ['"Kalam"', 'cursive'],
        'playfair': ['"Playfair Display"', 'serif'],
        'raleway': ['"Raleway"', 'sans-serif'],
        'inter': ['"Inter"', 'system-ui', 'sans-serif'],
      },
      // Solid backgrounds (replacing gradients)
      backgroundImage: {
        'solid-royal': 'linear-gradient(0deg, #3B1E50 0%, #3B1E50 100%)',
        'solid-mystical': 'linear-gradient(0deg, #3B1E50 0%, #3B1E50 100%)',
        'solid-golden': 'linear-gradient(0deg, #D6AE60 0%, #D6AE60 100%)',
        'solid-soft': 'linear-gradient(0deg, #FDF7F2 0%, #FDF7F2 100%)',
        'solid-cabinet': 'linear-gradient(0deg, #3B1E50 0%, #3B1E50 100%)',
      },
      // Queen de Q Shadows
      boxShadow: {
        'royal': '0 4px 20px rgba(59, 30, 80, 0.15)',
        'golden': '0 4px 20px rgba(214, 174, 96, 0.15)',
        'soft': '0 2px 10px rgba(75, 46, 67, 0.1)',
      },
      // Animations mystiques
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.8s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'steam': 'steam 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(214, 174, 96, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(214, 174, 96, 0.6)' },
        },
        sparkle: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.7, transform: 'scale(1.1)' },
        },
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        steam: {
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '50%': { opacity: 1, transform: 'translateY(-6px)' },
          '100%': { opacity: 0, transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
}

