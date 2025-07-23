import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Card, JournalEntry, ProgressState, FilterState } from '../types';
import { lazyLoad, performanceUtils, a11yUtils } from '../components/Common/LazyComponent';

const STORAGE_KEY = 'queendeq-cards-progress';
const MILESTONES = [10, 25, 54];

export const useCardsCollection = (cards: Card[]) => {
  // State management
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

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedSuits: new Set(),
    selectedKeywords: new Set()
  });

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

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

  // Trigger confetti at milestones
  const triggerConfetti = useCallback(async (milestone: number) => {
    if (prefersReducedMotion) return;
    
    const confetti = await lazyLoad.confetti();
    if (!confetti) return;

    confetti({
      particleCount: milestone === 54 ? 200 : 100,
      spread: milestone === 54 ? 180 : 70,
      origin: { y: 0.6 },
      colors: ['#D6AE60', '#D4B5A5', '#3B1E50', '#B79D74']
    });

    // Announce milestone to screen readers
    a11yUtils.announce(
      `Congratulations! You've opened ${milestone} cards. / Félicitations ! Vous avez ouvert ${milestone} cartes.`,
      'assertive'
    );
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

      // Announce card opened to screen readers
      const card = cards.find(c => c.id === cardId);
      if (card) {
        a11yUtils.announce(`Opened ${card.name}`, 'polite');
      }
    }
  }, [progress, saveProgress, triggerConfetti, cards]);

  // Add entry to journal
  const addToJournal = useCallback((card: Card) => {
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

    // Announce to screen readers
    a11yUtils.announce('Added to journal / Ajouté au journal', 'polite');
    
    return entry;
  }, [progress, saveProgress]);

  // Share card as PNG
  const shareCard = useCallback(async (card: Card, element: HTMLElement | null) => {
    if (!element) return false;
    
    try {
      const html2canvas = await lazyLoad.html2canvas();
      if (!html2canvas) return false;
      
      const canvas = await html2canvas(element, {
        backgroundColor: '#FDF7F2',
        scale: 2,
        useCORS: true
      });
      
      const link = document.createElement('a');
      link.download = `${card.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      // Announce to screen readers
      a11yUtils.announce('Image shared / Image partagée', 'polite');
      
      return true;
    } catch (e) {
      console.warn('Failed to generate sharing image');
      a11yUtils.announce('Sharing failed / Échec du partage', 'assertive');
      return false;
    }
  }, []);

  // Get all unique keywords for filter
  const allKeywords = useMemo(() => {
    const keywords = new Set<string>();
    cards.forEach(card => {
      card.keywords.forEach(keyword => keywords.add(keyword));
    });
    return Array.from(keywords).sort();
  }, [cards]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => performanceUtils.debounce((query: string) => {
      setFilters(prev => ({ ...prev, searchQuery: query }));
    }, 300),
    []
  );

  // Filter cards based on search, suits, and keywords
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = card.name.toLowerCase().includes(query);
        const matchesPunchline = card.punchline.toLowerCase().includes(query);
        const matchesKeywords = card.keywords.some(k => k.toLowerCase().includes(query));
        
        if (!matchesName && !matchesPunchline && !matchesKeywords) {
          return false;
        }
      }
      
      // Suit filter
      if (filters.selectedSuits.size > 0 && !filters.selectedSuits.has(card.suit)) {
        return false;
      }
      
      // Keywords filter
      if (filters.selectedKeywords.size > 0) {
        const hasSelectedKeyword = card.keywords.some(k => filters.selectedKeywords.has(k));
        if (!hasSelectedKeyword) {
          return false;
        }
      }
      
      return true;
    });
  }, [cards, filters]);

  // Generate 3-card spread
  const generate3CardSpread = useCallback(() => {
    const shuffled = [...filteredCards]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    // Mark spread cards as opened
    shuffled.forEach(card => markCardOpened(card.id));
    
    // Announce to screen readers
    a11yUtils.announce(
      `3-card spread generated with ${shuffled.map(c => c.name).join(', ')}`,
      'polite'
    );
    
    return shuffled;
  }, [filteredCards, markCardOpened]);

  // Progress calculation
  const progressStats = useMemo(() => {
    const percentage = (progress.openedCards.size / cards.length) * 100;
    const nextMilestone = MILESTONES.find(m => m > progress.openedCards.size);
    
    return {
      percentage,
      opened: progress.openedCards.size,
      total: cards.length,
      nextMilestone,
      journalEntries: progress.journalEntries.length
    };
  }, [progress, cards]);

  // Filter management functions
  const updateSearch = useCallback((query: string) => {
    debouncedSearch(query);
  }, [debouncedSearch]);

  const toggleSuit = useCallback((suit: string) => {
    setFilters(prev => {
      const newSuits = new Set(prev.selectedSuits);
      if (newSuits.has(suit)) {
        newSuits.delete(suit);
      } else {
        newSuits.add(suit);
      }
      return { ...prev, selectedSuits: newSuits };
    });
  }, []);

  const toggleKeyword = useCallback((keyword: string) => {
    setFilters(prev => {
      const newKeywords = new Set(prev.selectedKeywords);
      if (newKeywords.has(keyword)) {
        newKeywords.delete(keyword);
      } else {
        newKeywords.add(keyword);
      }
      return { ...prev, selectedKeywords: newKeywords };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      selectedSuits: new Set(),
      selectedKeywords: new Set()
    });
  }, []);

  const isCardOpened = useCallback((cardId: string) => {
    return progress.openedCards.has(cardId);
  }, [progress.openedCards]);

  // Preload card images for better performance
  useEffect(() => {
    const preloadImages = async () => {
      const promises = cards.slice(0, 6).map(card => 
        performanceUtils.preloadImage(card.image).catch(() => {
          console.warn(`Failed to preload image: ${card.image}`);
        })
      );
      await Promise.allSettled(promises);
    };

    preloadImages();
  }, [cards]);

  return {
    // State
    progress,
    filters,
    filteredCards,
    allKeywords,
    prefersReducedMotion,
    progressStats,
    
    // Actions
    markCardOpened,
    addToJournal,
    shareCard,
    generate3CardSpread,
    
    // Filter actions
    updateSearch,
    toggleSuit,
    toggleKeyword,
    clearFilters,
    
    // Utilities
    isCardOpened
  };
}; 