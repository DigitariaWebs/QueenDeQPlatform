import { useState, useRef, useEffect, useMemo, useCallback, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { 
  XMarkIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon,
  ArrowPathIcon,
  PlayIcon,
  BookOpenIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import Tilt from 'react-parallax-tilt';
import { Dialog, Transition } from '@headlessui/react';
import CardInstructionCarousel from '../UI/CardInstructionCarousel';

gsap.registerPlugin(Flip);

// Lazy load heavy libraries
const loadConfetti = () => import('canvas-confetti');
const loadHtml2Canvas = () => import('html2canvas');

interface Card {
  id: string;
  name: string;
  suit: '♦' | '♠' | '♥' | '♣';
  rank: string;
  punchline: string;
  mirrorQuestion: string;
  image: string;
  color: string;
  keywords: string[];
}

interface JournalEntry {
  id: string;
  cardId: string;
  cardName: string;
  question: string;
  timestamp: number;
}

interface ProgressState {
  openedCards: Set<string>;
  journalEntries: JournalEntry[];
}

const demoCards: Card[] = [
  {
    id: '1',
    name: '4♦ Solar Manipulator',
    suit: '♦',
    rank: '4',
    punchline: 'Votre charisme commande naturellement le respect et l\'attention de tous',
    mirrorQuestion: 'Comment votre présence influence-t-elle positivement votre entourage ?',
    image: '/assets/images/3carrau.png',
    color: 'from-royal-gold to-royal-champagne',
    keywords: ['charisme', 'leadership', 'influence', 'respect']
  },
  {
    id: '2',
    name: '7♠ Shadow Architect',
    suit: '♠',
    rank: '7',
    punchline: 'Vous construisez des stratégies dans l\'ombre avec une précision chirurgicale',
    mirrorQuestion: 'Quelle est votre stratégie la plus brillante et comment l\'avez-vous développée ?',
    image: '/assets/images/3carrau.png',
    color: 'from-royal-purple to-cabinet-aubergine',
    keywords: ['stratégie', 'planification', 'analyse', 'précision']
  },
  {
    id: '3',
    name: 'K♥ Emotional Alchemist',
    suit: '♥',
    rank: 'K',
    punchline: 'Vous transformez la douleur en force et la vulnérabilité en pouvoir authentique',
    mirrorQuestion: 'Comment transformez-vous vos émotions les plus intenses en sources de force ?',
    image: '/assets/images/3carrau.png',
    color: 'from-ritual-smokedGold to-ritual-vintage',
    keywords: ['émotions', 'transformation', 'résilience', 'authenticité']
  },
  {
    id: '4',
    name: 'A♣ Intellectual Dominator',
    suit: '♣',
    rank: 'A',
    punchline: 'Votre esprit analytique déconstruit et maîtrise tous les systèmes complexes',
    mirrorQuestion: 'Quel système complexe avez-vous le mieux maîtrisé et décomposé ?',
    image: '/assets/images/3carrau.png',
    color: 'from-royal-champagne to-cabinet-powder',
    keywords: ['intellect', 'analyse', 'système', 'maîtrise']
  },
  {
    id: '5',
    name: 'J♦ Charismatic Rebel',
    suit: '♦',
    rank: 'J',
    punchline: 'Vous défiez les conventions avec un style et une audace inégalés',
    mirrorQuestion: 'Quelle règle ou convention avez-vous brisée avec élégance et succès ?',
    image: '/assets/images/3carrau.png',
    color: 'from-ritual-indigo to-royal-purple',
    keywords: ['rébellion', 'innovation', 'audace', 'originalité']
  },
  {
    id: '6',
    name: 'Q♠ Strategic Phantom',
    suit: '♠',
    rank: 'Q',
    punchline: 'Votre vision à long terme anticipe et influence tous les mouvements',
    mirrorQuestion: 'Quelle vision d\'avenir guide vos décisions les plus importantes ?',
    image: '/assets/images/3carrau.png',
    color: 'from-ritual-vintage to-ritual-smokedGold',
    keywords: ['vision', 'anticipation', 'stratégie', 'influence']
  },
  {
    id: '7',
    name: '10♥ Passionate Conqueror',
    suit: '♥',
    rank: '10',
    punchline: 'Votre intensité émotionnelle consume et transforme tout sur son passage',
    mirrorQuestion: 'Quelle passion brûlante vous consume et vous pousse vers l\'excellence ?',
    image: '/assets/images/3carrau.png',
    color: 'from-cabinet-powder to-royal-champagne',
    keywords: ['passion', 'intensité', 'transformation', 'excellence']
  },
  {
    id: '8',
    name: '9♣ Tactical Mastermind',
    suit: '♣',
    rank: '9',
    punchline: 'Vous orchestrez des plans complexes avec une patience et intelligence redoutables',
    mirrorQuestion: 'Quel plan complexe avez-vous mené à bien grâce à votre patience ?',
    image: '/assets/images/3carrau.png',
    color: 'from-royal-gold to-cabinet-patina',
    keywords: ['tactique', 'patience', 'orchestration', 'intelligence']
  }
];

const STORAGE_KEY = 'queendeq-cards-progress';
const MILESTONES = [10, 25, 54];

const CardsPage = () => {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSuits, setSelectedSuits] = useState<Set<string>>(new Set());
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [spreadMode, setSpreadMode] = useState(false);
  const [spreadCards, setSpreadCards] = useState<Card[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  
  const [progress, setProgress] = useState<ProgressState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        return {
          openedCards: new Set(data.openedCards || []),
          journalEntries: data.journalEntries || []
        };
      }
    } catch (e) {
      console.warn('Failed to load progress from localStorage');
    }
    return { openedCards: new Set(), journalEntries: [] };
  });

  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const modalPanelRef = useRef<HTMLDivElement>(null);

  // Save progress to localStorage
  const saveProgress = useCallback((newProgress: ProgressState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        openedCards: Array.from(newProgress.openedCards),
        journalEntries: newProgress.journalEntries
      }));
      setProgress(newProgress);
    } catch (e) {
      console.warn('Failed to save progress to localStorage');
    }
  }, []);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Trigger confetti at milestones
  const triggerConfetti = useCallback(async (milestone: number) => {
    if (prefersReducedMotion) return;
    
    try {
      const confetti = (await loadConfetti()).default;
      confetti({
        particleCount: milestone === 54 ? 200 : 100,
        spread: milestone === 54 ? 180 : 70,
        origin: { y: 0.6 },
        colors: ['#D6AE60', '#D4B5A5', '#3B1E50', '#B79D74']
      });
    } catch (e) {
      console.warn('Failed to load confetti library');
    }
  }, [prefersReducedMotion]);

  // Mark card as opened and check milestones
  const markCardOpened = useCallback((cardId: string) => {
    const newOpenedCards = new Set(progress.openedCards);
    const wasAlreadyOpened = newOpenedCards.has(cardId);
    
    if (!wasAlreadyOpened) {
      newOpenedCards.add(cardId);
      const newProgress = { ...progress, openedCards: newOpenedCards };
      saveProgress(newProgress);
      
      const count = newOpenedCards.size;
      const nextMilestone = MILESTONES.find(m => m === count);
      if (nextMilestone) {
        setTimeout(() => triggerConfetti(nextMilestone), 500);
      }
    }
  }, [progress, saveProgress, triggerConfetti]);

  // Add entry to journal
  const handleAddToJournal = useCallback((card: Card) => {
    const entry: JournalEntry = {
      id: Date.now().toString(),
      cardId: card.id,
      cardName: card.name,
      question: card.mirrorQuestion,
      timestamp: Date.now()
    };
    
    const newEntries = [...progress.journalEntries, entry];
    const newProgress = { ...progress, journalEntries: newEntries };
    saveProgress(newProgress);
    
    setShowToast('Ajouté au journal ! / Added to journal!');
    setTimeout(() => setShowToast(null), 3000);
  }, [progress, saveProgress]);

  // Share card as PNG
  const handleSharePNG = useCallback(async (card: Card) => {
    if (isSharing) return;
    
    const elementToCapture = modalPanelRef.current;
    if (!elementToCapture) return;

    setIsSharing(true);
    try {
      const html2canvas = (await loadHtml2Canvas()).default;
      const canvas = await html2canvas(elementToCapture, {
        backgroundColor: null, // Use transparent background
        scale: 2,
        useCORS: true
      });
      
      const link = document.createElement('a');
      link.download = `${card.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      setShowToast('Image partagée ! / Image shared!');
      setTimeout(() => setShowToast(null), 3000);
    } catch (e) {
      console.warn('Failed to generate sharing image', e);
      setShowToast('Erreur lors du partage / Sharing error');
      setTimeout(() => setShowToast(null), 3000);
    } finally {
      setIsSharing(false);
    }
  }, [isSharing]);

  // Get all unique keywords for filter
  const allKeywords = useMemo(() => {
    const keywords = new Set<string>();
    demoCards.forEach(card => {
      card.keywords.forEach(keyword => keywords.add(keyword));
    });
    return Array.from(keywords).sort();
  }, []);

  // Filter cards based on search, suits, and keywords
  const filteredCards = useMemo(() => {
    return demoCards.filter(card => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = card.name.toLowerCase().includes(query);
        const matchesPunchline = card.punchline.toLowerCase().includes(query);
        const matchesKeywords = card.keywords.some(k => k.toLowerCase().includes(query));
        
        if (!matchesName && !matchesPunchline && !matchesKeywords) {
          return false;
        }
      }
      
      // Suit filter
      if (selectedSuits.size > 0 && !selectedSuits.has(card.suit)) {
        return false;
      }
      
      // Keywords filter
      if (selectedKeywords.size > 0) {
        const hasSelectedKeyword = card.keywords.some(k => selectedKeywords.has(k));
        if (!hasSelectedKeyword) {
          return false;
        }
      }
      
      return true;
    });
  }, [searchQuery, selectedSuits, selectedKeywords]);

  // Handle card click
  const handleCardClick = (card: Card) => {
    if (spreadMode) return;
    
    markCardOpened(card.id);
    setSelectedCard(card);
  };

  // Handle close card
  const handleCloseCard = () => {
    setSelectedCard(null);
  };

  // 3-card spread animation
  const trigger3CardSpread = () => {
    if (prefersReducedMotion) return;
    
    const randomCards = [...filteredCards]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    setSpreadCards(randomCards);
    setSpreadMode(true);
    
    // Mark spread cards as opened
    randomCards.forEach(card => markCardOpened(card.id));
  };

  // Progress calculation
  const progressPercentage = (progress.openedCards.size / demoCards.length) * 100;
  const nextMilestone = MILESTONES.find(m => m > progress.openedCards.size);

  // Animate cards on mount
  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const cards = Object.values(cardRefs.current).filter(Boolean);
    gsap.fromTo(cards, 
      { opacity: 0, y: 50, rotateX: 15 },
      { 
        opacity: 1, 
        y: 0, 
        rotateX: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out"
      }
    );
  }, [prefersReducedMotion, filteredCards]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="first:pt-0 last:pb-0 relative"
    >
      {/* Progress Ring - Top Right */}
      <div className="fixed top-24 right-6 z-40">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-royal-gold/20"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={`${progressPercentage * 1.75} 175`}
              className="text-royal-gold transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-royal-purple font-sans font-bold text-sm">
              {progress.openedCards.size}
            </span>
          </div>
        </div>
        {nextMilestone && (
          <div className="text-center mt-2">
            <span className="text-xs text-cabinet-aubergine font-sans">
              Next: {nextMilestone}
            </span>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-royal-purple text-royal-pearl px-6 py-3 rounded-full shadow-royal font-sans"
          >
            {showToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-12 lg:mb-16">
        <div>
          <h1 className="text-4xl lg:text-5xl font-serif font-bold text-royal-purple mb-4">
            Cards Collection
        </h1>
          <p className="text-cabinet-aubergine/70 font-sans text-lg max-w-2xl">
            Découvrez les archétypes masculins qui reflètent votre essence. 
            {progress.openedCards.size > 0 && (
              <span className="ml-2 text-royal-gold font-medium">
                {progress.openedCards.size}/{demoCards.length} révélées
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* 3-Card Spread Button */}
          <button
            onClick={trigger3CardSpread}
            disabled={filteredCards.length < 3 || spreadMode}
            className="flex items-center space-x-2 bg-gradient-to-r from-ritual-smokedGold/20 to-ritual-vintage/20 border border-ritual-smokedGold/30 rounded-lg px-4 py-2 text-cabinet-aubergine font-sans font-medium hover:from-ritual-smokedGold/30 hover:to-ritual-vintage/30 transition-all duration-200 disabled:opacity-50"
          >
            <PlayIcon className="w-5 h-5" />
            <span className="hidden sm:inline">3-Card Spread</span>
          </button>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 border rounded-lg px-4 py-2 font-sans font-medium transition-all duration-200 ${
              showFilters
                ? 'bg-gradient-to-r from-royal-gold/30 to-royal-champagne/30 border-royal-gold text-royal-purple'
                : 'bg-gradient-to-r from-royal-gold/20 to-royal-champagne/20 border-royal-gold/30 text-royal-purple hover:from-royal-gold/30 hover:to-royal-champagne/30'
            }`}
          >
            <FunnelIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-royal-pearl to-royal-champagne/30 rounded-xl p-6 border border-royal-gold/20 mb-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Search */}
              <div>
                <label className="block text-royal-purple font-sans font-medium mb-2">
                  Search / Recherche
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cabinet-aubergine/50" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nom, description, mots-clés..."
                    className="w-full pl-10 pr-4 py-2 bg-royal-pearl border border-royal-gold/30 rounded-lg text-cabinet-aubergine placeholder-cabinet-aubergine/50 font-sans focus:border-royal-gold focus:outline-none"
                  />
                </div>
              </div>

              {/* Suits */}
              <div>
                <label className="block text-royal-purple font-sans font-medium mb-2">
                  Suits / Couleurs
                </label>
                <div className="flex flex-wrap gap-2">
                  {['♦', '♠', '♥', '♣'].map(suit => (
                    <button
                      key={suit}
                      onClick={() => {
                        const newSuits = new Set(selectedSuits);
                        if (newSuits.has(suit)) {
                          newSuits.delete(suit);
                        } else {
                          newSuits.add(suit);
                        }
                        setSelectedSuits(newSuits);
                      }}
                      className={`w-10 h-10 rounded-lg border-2 font-serif text-xl transition-all duration-200 ${
                        selectedSuits.has(suit)
                          ? 'bg-royal-gold border-royal-gold text-royal-purple'
                          : 'bg-royal-pearl border-royal-gold/30 text-cabinet-aubergine hover:border-royal-gold/50'
                      }`}
                    >
                      {suit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-royal-purple font-sans font-medium mb-2">
                  Keywords / Mots-clés
                </label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {allKeywords.map(keyword => (
                    <button
                      key={keyword}
                      onClick={() => {
                        const newKeywords = new Set(selectedKeywords);
                        if (newKeywords.has(keyword)) {
                          newKeywords.delete(keyword);
                        } else {
                          newKeywords.add(keyword);
                        }
                        setSelectedKeywords(newKeywords);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-sans border transition-all duration-200 ${
                        selectedKeywords.has(keyword)
                          ? 'bg-royal-gold border-royal-gold text-royal-purple'
                          : 'bg-royal-pearl border-royal-gold/30 text-cabinet-aubergine hover:border-royal-gold/50'
                      }`}
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filter Summary */}
            <div className="mt-4 pt-4 border-t border-royal-gold/20">
              <div className="flex items-center justify-between">
                <span className="text-cabinet-aubergine font-sans text-sm">
                  {filteredCards.length} of {demoCards.length} cards shown
                </span>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSuits(new Set());
                    setSelectedKeywords(new Set());
                  }}
                  className="text-royal-purple font-sans text-sm hover:text-royal-gold transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3-Card Spread Mode */}
      <AnimatePresence onExitComplete={() => setSpreadCards([])}>
        {spreadMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-royal-velvet/90 backdrop-blur-md z-40 flex flex-col items-center justify-center p-4"
          >
            <div className="text-center">
              <motion.h2 
                className="text-3xl md:text-4xl font-serif font-bold text-royal-pearl mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.5 } }}
              >
                Your 3-Card Spread / Votre Tirage 3 Cartes
              </motion.h2>
              <motion.p 
                className="text-royal-pearl/80 font-sans text-lg mb-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.7, duration: 0.5 } }}
              >
                Méditation sur ces trois archétypes...
              </motion.p>

              <div className="flex justify-center items-center space-x-[-4rem] md:space-x-[-6rem]">
                {spreadCards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: -100, scale: 0.5, rotate: 0 }}
                    animate={{
                      opacity: 1,
                      y: index === 1 ? -20 : 0,
                      scale: 1,
                      rotate: (index - 1) * 15,
                      x: (index - 1) * 30,
                      transition: {
                        type: 'spring',
                        stiffness: 80,
                        damping: 12,
                        delay: 0.8 + index * 0.15,
                      },
                    }}
                    exit={{ opacity: 0, y: 50, transition: { duration: 0.2 } }}
                    whileHover={{
                      scale: 1.1,
                      y: -35,
                      zIndex: 100,
                      rotate: 0,
                      boxShadow: '0px 15px 30px rgba(0, 0, 0, 0.5)',
                    }}
                    className="w-48 h-72 relative cursor-pointer"
                    style={{ zIndex: spreadCards.length - Math.abs(index - 1) }}
                    onClick={() => handleCardClick(card)}
                  >
                    <Tilt
                      tiltEnable={!prefersReducedMotion}
                      tiltMaxAngleX={8}
                      tiltMaxAngleY={8}
                      glareEnable={true}
                      glareMaxOpacity={0.15}
                      glarePosition="all"
                      className="w-full h-full"
                    >
                      <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${card.color} border-2 border-royal-gold/70 shadow-golden-strong overflow-hidden`}>
                        <img 
                          src={card.image} 
                          alt={card.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Tilt>
                  </motion.div>
                ))}
              </div>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 1.5, duration: 0.5 } }}
                onClick={() => setSpreadMode(false)} 
                className="mt-12 text-royal-pearl/80 hover:text-white transition-colors flex items-center gap-2 mx-auto bg-white/10 hover:bg-white/20 px-6 py-2 rounded-full"
              >
                <XMarkIcon className="w-5 h-5" />
                <span>Fermer</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards Grid - Fixed Size Layout */}
      <div
        ref={containerRef}
        className="grid gap-4 md:gap-6 justify-items-center grid-cols-[repeat(auto-fit,160px)] md:grid-cols-[repeat(auto-fit,220px)]"
      >
        {filteredCards.map((card) => {
          const isOpened = progress.openedCards.has(card.id);
          
          return (
            <Tilt
              key={card.id}
              tiltEnable={!prefersReducedMotion && !spreadMode}
              tiltMaxAngleX={6}
              tiltMaxAngleY={6}
              perspective={1000}
              className="w-full"
            >
              <motion.div
                ref={(el) => {
                  if (el) cardRefs.current[card.id] = el;
                }}
                className={`relative rounded-xl overflow-hidden cursor-pointer group shadow-royal transition-all duration-300 w-[160px] h-[240px] md:w-[220px] md:h-[330px] ${
                  isOpened 
                    ? 'border border-royal-gold/50 shadow-golden' 
                    : 'border border-royal-gold/30'
                }`}
                onClick={() => handleCardClick(card)}
                whileHover={prefersReducedMotion ? {} : { y: -6, scale: 1.02 }}
                layout
              >
                {/* Halo effect for opened cards */}
                {isOpened && !prefersReducedMotion && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-royal-gold/30 to-royal-champagne/30 rounded-xl blur-sm"></div>
                )}
                
                {/* Full Art Background */}
                <img 
                  src={card.image} 
                  alt={card.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
                
                {/* Opened indicator */}
                {isOpened && (
                  <div className="absolute top-3 right-3 w-2 h-2 md:w-3 md:h-3 bg-royal-gold rounded-full shadow-soft animate-pulse z-20"></div>
                )}
                
                {/* Hover indicator */}
                <div className="absolute top-3 left-3 w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"></div>
                
                {/* Title and Content - Hidden by default, shown on hover */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
                
                <div className="absolute inset-0 p-3 md:p-4 flex flex-col justify-end z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="text-white space-y-2">
                    {/* Title */}
                    <h3 className="font-serif font-bold text-sm md:text-base leading-tight line-clamp-2">
                      {card.name}
                    </h3>
                    
                    {/* Punchline - Truncated */}
                    <p className="text-white/90 font-sans text-xs leading-relaxed line-clamp-2">
                      {card.punchline}
                    </p>
                    
                    {/* Tags Container */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {card.keywords.slice(0, 2).map(keyword => (
                        <span 
                          key={keyword}
                          className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm truncate max-w-[4rem] md:max-w-[5rem]"
                          title={keyword}
                        >
                          {keyword}
                        </span>
                      ))}
                      {card.keywords.length > 2 && (
                        <span className="text-xs text-white/60 px-1">
                          +{card.keywords.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </Tilt>
          );
        })}
      </div>

      {/* Card Detail Modal */}
      <Transition appear show={!!selectedCard} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleCloseCard}>
          <Transition.Child
            as={Fragment}
            enter={prefersReducedMotion ? "" : "ease-out duration-300"}
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave={prefersReducedMotion ? "" : "ease-in duration-200"}
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-royal-velvet/80 backdrop-blur-lg" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter={prefersReducedMotion ? "" : "ease-out duration-300"}
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave={prefersReducedMotion ? "" : "ease-in duration-200"}
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel 
                  ref={modalPanelRef}
                  className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-gradient-to-b from-royal-pearl/95 to-royal-champagne/95 p-8 text-left align-middle shadow-2xl transition-all border border-royal-gold/30"
                >
                  {selectedCard && (
                    <>
                      {/* Close button */}
                      <button 
                        onClick={handleCloseCard}
                        className="absolute top-4 right-4 text-cabinet-aubergine/60 hover:text-royal-purple transition-colors z-10"
                      >
                        <XMarkIcon className="w-6 h-6" />
                      </button>

                      {/* Card Art */}
                      <motion.div 
                        className="w-64 h-96 mx-auto mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: 0.1, duration: 0.4 } }}
                      >
                        <Tilt
                          tiltEnable={!prefersReducedMotion}
                          glareEnable={true}
                          glareMaxOpacity={0.1}
                          glarePosition="all"
                        >
                          <img 
                            src={selectedCard.image} 
                            alt={selectedCard.name}
                            className="w-full h-full object-cover rounded-2xl shadow-lg"
                          />
                        </Tilt>
                      </motion.div>
                      
                      {/* Card Info */}
                      <motion.div
                        className="text-center"
                        initial="hidden"
                        animate="visible"
                        variants={{
                          visible: {
                            transition: {
                              staggerChildren: 0.1,
                              delayChildren: 0.2,
                            },
                          },
                        }}
                      >
                        <motion.h3 variants={{hidden: {opacity:0, y:10}, visible:{opacity:1, y:0}}} className="text-3xl font-playfair font-bold text-royal-purple leading-tight">
                          {selectedCard.name}
                        </motion.h3>
                        
                        <motion.p variants={{hidden: {opacity:0, y:10}, visible:{opacity:1, y:0}}} className="font-sans italic text-cabinet-aubergine/80 mt-2 mb-4 text-lg">
                          "{selectedCard.mirrorQuestion}"
                        </motion.p>

                        <motion.p variants={{hidden: {opacity:0, y:10}, visible:{opacity:1, y:0}}} className="text-cabinet-aubergine font-sans mb-6 text-base max-w-md mx-auto">
                          {selectedCard.punchline}
                        </motion.p>
                        
                        <motion.div variants={{hidden: {opacity:0, y:10}, visible:{opacity:1, y:0}}} className="flex justify-center flex-wrap gap-2 mb-8">
                          {selectedCard.keywords.map((keyword) => (
                            <span
                              key={keyword}
                              className="px-4 py-1.5 rounded-full text-xs font-sans border transition-all duration-200 bg-royal-gold/10 border-royal-gold/30 text-royal-purple hover:bg-royal-gold/20"
                            >
                              {keyword}
                            </span>
                          ))}
                        </motion.div>

                        <motion.div variants={{hidden: {opacity:0, y:10}, visible:{opacity:1, y:0}}} className="flex flex-col sm:flex-row justify-center gap-4">
                          <button
                            onClick={() => handleAddToJournal(selectedCard)}
                            className="w-full sm:w-auto flex-grow inline-flex items-center justify-center gap-3 text-center bg-gradient-to-r from-ritual-smokedGold to-ritual-vintage border border-ritual-smokedGold/50 rounded-lg px-6 py-3 text-royal-purple font-sans font-semibold hover:from-ritual-smokedGold/80 hover:to-ritual-vintage/80 transition-all duration-200 shadow-md"
                          >
                            <BookOpenIcon className="w-5 h-5" />
                            <span>Ajouter au Journal</span>
                          </button>
                          <button
                            onClick={() => handleSharePNG(selectedCard)}
                            disabled={isSharing}
                            className="w-full sm:w-auto flex-grow inline-flex items-center justify-center gap-3 text-center bg-transparent border border-ritual-smokedGold/50 rounded-lg px-6 py-3 text-royal-purple font-sans font-medium hover:bg-ritual-smokedGold/20 transition-all duration-200 disabled:opacity-60"
                          >
                            {isSharing ? (
                              <>
                                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                <span>Partage...</span>
                              </>
                            ) : (
                              <>
                                <ShareIcon className="w-5 h-5" />
                                <span>Partager (PNG)</span>
                              </>
                            )}
                          </button>
                        </motion.div>
                      </motion.div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Empty State */}
      {filteredCards.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-br from-royal-gold/20 to-royal-champagne/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <MagnifyingGlassIcon className="w-12 h-12 text-cabinet-aubergine/50" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-royal-purple mb-4">
            Aucune carte trouvée / No cards found
          </h3>
          <p className="text-cabinet-aubergine/70 font-sans">
            Essayez d'ajuster vos filtres ou votre recherche
          </p>
        </div>
      )}

      {/* Instructions Carousel */}
      <CardInstructionCarousel />
    </motion.div>
  );
};

export default CardsPage;