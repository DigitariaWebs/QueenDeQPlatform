import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { 
  HeartIcon, 
  SparklesIcon, 
  SunIcon, 
  MoonIcon,
  FireIcon,
  BeakerIcon,
  EyeIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  StarIcon,
  ShareIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Lazy load confetti
const loadConfetti = () => import('canvas-confetti');

interface QuizQuestion {
  id: number;
  question: string;
  options: {
    id: string;
    text: string;
    icon: React.ComponentType<{ className?: string }>;
    archetype: string;
  }[];
}

interface QuizResult {
  name: string;
  portrait: string;
  description: string;
  color: string;
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "Quelle qualité te définit le mieux ?",
    options: [
      { id: 'a', text: 'Compassion', icon: HeartIcon, archetype: 'Bienveillante' },
      { id: 'b', text: 'Créativité', icon: SparklesIcon, archetype: 'Créative' },
      { id: 'c', text: 'Sagesse', icon: EyeIcon, archetype: 'Sage' },
      { id: 'd', text: 'Force', icon: ShieldCheckIcon, archetype: 'Guerrière' }
    ]
  },
  {
    id: 2,
    question: "Ton moment préféré de la journée ?",
    options: [
      { id: 'a', text: 'Lever du soleil', icon: SunIcon, archetype: 'Solaire' },
      { id: 'b', text: 'Coucher de soleil', icon: MoonIcon, archetype: 'Lunaire' },
      { id: 'c', text: 'Minuit', icon: MoonIcon, archetype: 'Mystique' },
      { id: 'd', text: 'Midi', icon: FireIcon, archetype: 'Visionnaire' }
    ]
  },
  {
    id: 3,
    question: "Ton environnement idéal ?",
    options: [
      { id: 'a', text: 'Jardin secret', icon: SparklesIcon, archetype: 'Bienveillante' },
      { id: 'b', text: 'Atelier créatif', icon: BeakerIcon, archetype: 'Créative' },
      { id: 'c', text: 'Bibliothèque', icon: EyeIcon, archetype: 'Sage' },
      { id: 'd', text: 'Sommet de montagne', icon: ShieldCheckIcon, archetype: 'Guerrière' }
    ]
  },
  {
    id: 4,
    question: "Ta façon d'aider les autres ?",
    options: [
      { id: 'a', text: 'Écouter avec le cœur', icon: HeartIcon, archetype: 'Bienveillante' },
      { id: 'b', text: 'Inspirer par l\'art', icon: SparklesIcon, archetype: 'Créative' },
      { id: 'c', text: 'Partager la connaissance', icon: EyeIcon, archetype: 'Sage' },
      { id: 'd', text: 'Montrer l\'exemple', icon: ShieldCheckIcon, archetype: 'Guerrière' }
    ]
  },
  {
    id: 5,
    question: "Ta plus grande force ?",
    options: [
      { id: 'a', text: 'Empathie', icon: HeartIcon, archetype: 'Bienveillante' },
      { id: 'b', text: 'Imagination', icon: SparklesIcon, archetype: 'Créative' },
      { id: 'c', text: 'Intuition', icon: EyeIcon, archetype: 'Sage' },
      { id: 'd', text: 'Détermination', icon: ShieldCheckIcon, archetype: 'Guerrière' }
    ]
  },
  {
    id: 6,
    question: "Comment recharges-tu tes batteries ?",
    options: [
      { id: 'a', text: 'Méditation', icon: MoonIcon, archetype: 'Lunaire' },
      { id: 'b', text: 'Création artistique', icon: SparklesIcon, archetype: 'Créative' },
      { id: 'c', text: 'Lecture', icon: EyeIcon, archetype: 'Sage' },
      { id: 'd', text: 'Sport/Défi', icon: FireIcon, archetype: 'Guerrière' }
    ]
  },
  {
    id: 7,
    question: "Ton style de leadership ?",
    options: [
      { id: 'a', text: 'Avec le cœur', icon: HeartIcon, archetype: 'Bienveillante' },
      { id: 'b', text: 'Avec innovation', icon: SparklesIcon, archetype: 'Créative' },
      { id: 'c', text: 'Avec sagesse', icon: EyeIcon, archetype: 'Sage' },
      { id: 'd', text: 'Avec courage', icon: ShieldCheckIcon, archetype: 'Guerrière' }
    ]
  },
  {
    id: 8,
    question: "Ta vision du bonheur ?",
    options: [
      { id: 'a', text: 'Harmonie collective', icon: HeartIcon, archetype: 'Bienveillante' },
      { id: 'b', text: 'Expression créative', icon: SparklesIcon, archetype: 'Créative' },
      { id: 'c', text: 'Compréhension profonde', icon: EyeIcon, archetype: 'Sage' },
      { id: 'd', text: 'Accomplissement personnel', icon: ShieldCheckIcon, archetype: 'Guerrière' }
    ]
  }
];

const queenResults: { [key: string]: QuizResult } = {
  'Bienveillante': {
    name: 'La Reine Solaire',
    portrait: '/assets/quiz-results/solar-queen.svg',
    description: 'Ton énergie rayonne comme le soleil, illuminant tout sur ton passage. Tu es une source naturelle d\'inspiration et de chaleur humaine. Ta présence apporte joie et réconfort à ceux qui t\'entourent.',
    color: 'from-parchment-cream to-warm-pearl'
  },
  'Créative': {
    name: 'L\'Impératrice Rebelle',
    portrait: '/assets/quiz-results/rebel-queen.svg',
    description: 'Ton esprit libre défie les conventions avec grâce et audace. Tu n\'as pas peur de tracer ton propre chemin et d\'inspirer les autres à embrasser leur authenticité. Ta créativité révolutionnaire change le monde.',
    color: 'from-antique-rose to-powder-rose'
  },
  'Sage': {
    name: 'La Souveraine Sage',
    portrait: '/assets/quiz-results/sage-queen.svg',
    description: 'Ta sagesse profonde et ton intuition te guident vers la vérité. Tu es une source de conseil et de guidance pour ceux qui cherchent des réponses. Ta connaissance éclaire le chemin des autres.',
    color: 'from-smoky-gold to-parchment-cream'
  },
  'Guerrière': {
    name: 'La Reine Lunaire',
    portrait: '/assets/quiz-results/lunar-queen.svg',
    description: 'Ta force mystique puise dans les cycles naturels et l\'intuition féminine. Tu maîtrises l\'art de la transformation et de l\'adaptation. Ta sagesse émotionnelle guide tes décisions avec une profondeur remarquable.',
    color: 'from-rose-champagne to-moon-milk'
  }
};

const QuizResultDisplay = ({ 
  result, 
  onRestart,
  onShare,
  prefersReducedMotion 
}: { 
  result: QuizResult; 
  onRestart: () => void;
  onShare: (result: QuizResult) => void;
  prefersReducedMotion: boolean;
}) => {

  useEffect(() => {
    if (!prefersReducedMotion) {
      const triggerConfetti = async () => {
        try {
          const confetti = (await loadConfetti()).default;
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#D6AE60', '#D4B5A5', '#3B1E50', '#B79D74', '#FFFFFF']
          });
        } catch (e) {
          console.warn('Failed to load confetti');
        }
      };
      triggerConfetti();
    }
  }, [prefersReducedMotion]);

  return (
    <motion.div 
      className={`relative w-full max-w-4xl mx-auto bg-gradient-to-br ${result.color} p-8 md:p-12 rounded-3xl shadow-2xl overflow-hidden border-4 border-white/50`}
      initial={{ opacity: 0, scale: 0.9, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
        <motion.div 
          className="w-48 h-48 md:w-64 md:h-64 flex-shrink-0"
          initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
          animate={{ opacity: 1, scale: 1, rotate: 0, transition: { delay: 0.2, type: 'spring', stiffness: 100 } }}
        >
          <img 
            src={result.portrait} 
            alt={`Portrait de ${result.name}`}
            className="w-full h-full object-contain filter drop-shadow-lg"
          />
        </motion.div>
        
        <div className="text-center md:text-left">
          <motion.h2 
            className="text-4xl md:text-5xl font-serif font-bold text-royal-purple leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.4, duration: 0.5 } }}
          >
            {result.name}
          </motion.h2>
          <motion.p 
            className="mt-4 text-lg text-cabinet-aubergine font-sans max-w-prose"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.6, duration: 0.5 } }}
          >
            {result.description}
          </motion.p>
        </div>
      </div>
      
      <motion.div 
        className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.8, duration: 0.5 } }}
      >
        <button
          onClick={() => onShare(result)}
          className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white/40 text-royal-purple font-semibold rounded-full shadow-md hover:bg-white/60 transition-all transform hover:scale-105"
        >
          <ShareIcon className="w-5 h-5" />
          <span>Partager mon résultat</span>
        </button>
        <button
          onClick={onRestart}
          className="inline-flex items-center justify-center gap-2 px-8 py-3 text-royal-purple font-medium rounded-full hover:bg-white/20 transition-colors"
        >
          <ArrowPathIcon className="w-5 h-5" />
          <span>Refaire le quiz</span>
        </button>
      </motion.div>
    </motion.div>
  );
};

const QuizPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [result, setResult] = useState<QuizResult | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [confettiTriggered, setConfettiTriggered] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [starPositions, setStarPositions] = useState<Array<{x: number, y: number, delay: number}>>([]);
  
  const ariaLiveRef = useRef<HTMLDivElement>(null);

  // Note colors and rotations for the manuscript style
  const noteStyles = [
    { color: 'from-parchment-cream to-warm-pearl', borderColor: 'border-patina-gold', rotation: 'rotate-1' },
    { color: 'from-powder-rose to-antique-rose', borderColor: 'border-rose-champagne', rotation: '-rotate-1' },
    { color: 'from-moon-milk to-powder-rose', borderColor: 'border-smoky-gold', rotation: 'rotate-2' },
    { color: 'from-vintage-aubergine/10 to-royal-purple/10', borderColor: 'border-imperial-gold', rotation: '-rotate-2' }
  ];

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

  // Generate random star positions for background
  useEffect(() => {
    const stars = Array.from({ length: 15 }, (_, _index) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }));
    setStarPositions(stars);
  }, []);

  useEffect(() => {
    // Staggered answer reveal animation
    if (!prefersReducedMotion) {
      const options = document.querySelectorAll('.quiz-note-option');
      gsap.fromTo(options, 
        { opacity: 0, y: 50, rotateX: -15 },
        { 
          opacity: 1, 
          y: 0,
          rotateX: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: "easeOut"
        }
      );
    }
  }, [currentQuestion, prefersReducedMotion]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showResult) return;
      
      const keyNumber = parseInt(e.key);
      if (keyNumber >= 1 && keyNumber <= 4) {
        const option = quizQuestions[currentQuestion]?.options[keyNumber - 1];
        if (option) {
          handleAnswerSelect(option.id);
          if (ariaLiveRef.current) {
            ariaLiveRef.current.textContent = `Option ${keyNumber} selected: ${option.text}`;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, showResult]);

  const handleAnswerSelect = (optionId: string) => {
    setSelectedAnswer(optionId);
  };

  const handleNext = async () => {
    if (!selectedAnswer) return;

    const newAnswers = { ...answers, [currentQuestion]: selectedAnswer };
    setAnswers(newAnswers);
    setSelectedAnswer('');

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate result
      const archetypes: { [key: string]: number } = {};
      const validArchetypes = Object.keys(queenResults);

      Object.entries(newAnswers).forEach(([questionIndex, answerId]) => {
        const question = quizQuestions[parseInt(questionIndex, 10)];
        const option = question.options.find(opt => opt.id === answerId);
        
        // Only count archetypes that have a corresponding result defined
        if (option && validArchetypes.includes(option.archetype)) {
          archetypes[option.archetype] = (archetypes[option.archetype] || 0) + 1;
        }
      });

      const topArchetype = Object.keys(archetypes).length > 0
        ? Object.keys(archetypes).reduce((a, b) => archetypes[a] > archetypes[b] ? a : b)
        : validArchetypes[0]; // Default to the first valid archetype

      setResult(queenResults[topArchetype]);
      setShowResult(true);

      if (!confettiTriggered) {
        // Track event (placeholder for Plausible)
        if (typeof window !== 'undefined' && (window as unknown as { plausible?: Function }).plausible) {
          (window as unknown as { plausible: Function }).plausible('quiz_finished', {
            props: { result: topArchetype }
          });
        }
        setConfettiTriggered(true);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1] || '');
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setSelectedAnswer('');
    setShowResult(false);
    setResult(null);
    setConfettiTriggered(false);
  };

  const handleShareResult = async (resultToShare: QuizResult) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Quiz Royal - ${resultToShare.name}`,
          text: `Je suis ${resultToShare.name}! Découvrez votre archétype royal avec le Quiz Royal de Queen de Q.`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      const text = `Je suis ${resultToShare.name}! Découvrez votre archétype royal avec le Quiz Royal de Queen de Q. ${window.location.href}`;
      navigator.clipboard.writeText(text);
      alert('Résultat copié dans le presse-papiers!');
    }
  };

  if (showResult && result) {
    return (
      <div className="w-full flex items-center justify-center p-4">
        <QuizResultDisplay 
          result={result} 
          onRestart={handleRestart}
          onShare={handleShareResult}
          prefersReducedMotion={prefersReducedMotion}
        />
      </div>
    );
  }

  const currentQ = quizQuestions[currentQuestion];

  return (
    <div className="relative min-h-screen">
      {/* Animated Background Stars */}
      {starPositions.map((star, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full pointer-events-none"
          style={{ left: `${star.x}%`, top: `${star.y}%` }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.5, 1] }}
          transition={{ duration: 3, repeat: Infinity, delay: star.delay }}
        />
      ))}

      <main className="w-full flex flex-col items-center justify-center p-4 relative z-10">
        {/* Vintage Paper Texture Background */}
        <div className="absolute inset-0 opacity-30" 
             style={{
               backgroundImage: `
                 radial-gradient(circle at 20% 80%, rgba(75, 46, 67, 0.1) 0%, transparent 50%),
                 radial-gradient(circle at 80% 20%, rgba(214, 174, 96, 0.1) 0%, transparent 50%),
                 radial-gradient(circle at 40% 40%, rgba(212, 181, 165, 0.1) 0%, transparent 50%)
               `
             }}>
        </div>

        {/* Floating Quiz Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-10 text-4xl animate-float opacity-30" style={{ color: '#776650' }}>📝</div>
          <div className="absolute top-40 right-20 text-3xl animate-float opacity-40" style={{ color: '#C8A96B', animationDelay: '1s' }}>✨</div>
          <div className="absolute top-60 left-1/4 text-2xl animate-float opacity-25" style={{ color: '#B79D74', animationDelay: '2s' }}>🌟</div>
          <div className="absolute bottom-40 right-1/3 text-3xl animate-float opacity-35" style={{ color: '#D4B5A5', animationDelay: '0.5s' }}>🔮</div>
          <div className="absolute top-1/3 right-10 text-2xl animate-float opacity-30" style={{ color: '#776650', animationDelay: '1.5s' }}>📜</div>
          <div className="absolute bottom-20 left-20 text-xl animate-float opacity-40" style={{ color: '#C8A96B', animationDelay: '2.5s' }}>💫</div>
        </div>

        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-12">
          {/* Aria-live region for keyboard selections */}
          <div
            ref={ariaLiveRef}
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          />
        
          {/* Header */}
          <div className="text-center mb-12 lg:mb-16 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              {/* Beta Ribbon */}
              <div className="absolute -top-8 -right-8 transform rotate-12">
                <div className="bg-gradient-to-r from-rose-champagne to-imperial-gold text-white px-4 py-2 rounded-lg shadow-lg border-2 border-white">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4" />
                    <span className="text-sm font-bold font-raleway">QUIZ ROYAL</span>
                    <StarIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Decorative Frame */}
              <div className="absolute -inset-4 border-4 border-dashed border-imperial-gold/40 rounded-lg transform rotate-1"></div>
              
              <h1 className="relative text-4xl lg:text-5xl font-playfair font-bold text-royal-purple mb-4">
                Miroir, Miroir
              </h1>
              
              {/* Vintage Underline */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-px bg-gradient-to-r from-transparent via-imperial-gold to-transparent flex-1"></div>
                <StarIcon className="text-imperial-gold w-5 h-5" />
                <div className="h-px bg-gradient-to-r from-transparent via-imperial-gold to-transparent flex-1"></div>
              </div>
              
              <p className="text-royal-purple/80 font-raleway text-lg max-w-2xl mx-auto">
                Découvre ton archétype royal en 8 questions. Laisse ton intuition te guider vers ta véritable essence.
              </p>
            </motion.div>

            {/* Progress Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="max-w-xl mx-auto mt-8"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-royal-purple font-raleway font-medium">
                  Question {currentQuestion + 1} / {quizQuestions.length}
                </span>
                <span className="text-royal-purple/70 font-raleway text-sm">
                  {Math.round(((currentQuestion + 1) / quizQuestions.length) * 100)}% complété
                </span>
              </div>
              <div className="w-full bg-imperial-gold/20 rounded-full h-3">
                <motion.div
                  className="bg-gradient-to-r from-imperial-gold to-smoky-gold h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="max-w-6xl mx-auto"
            >
              {/* Question Title */}
              <div className="text-center mb-12">
                <h2 id="question-title" className="text-2xl md:text-3xl font-playfair font-bold text-royal-purple">
                  {currentQ.question}
                </h2>
              </div>

              {/* Options as handwritten notes */}
              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
                role="radiogroup"
                aria-labelledby="question-title"
              >
                {currentQ.options.map((option, index) => {
                  const isSelected = selectedAnswer === option.id;
                  const noteStyle = noteStyles[index % noteStyles.length];
                  
                  return (
                    <motion.div
                      key={option.id}
                      className={`quiz-note-option relative ${index === currentQuestion ? 'z-20' : 'z-10'}`}
                      initial={{ opacity: 0, y: 50, rotateX: -15 }}
                      animate={{ 
                        opacity: 1,
                        y: 0,
                        rotateX: 0,
                        scale: isSelected ? 1.05 : 1
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                      {/* Handwritten Note */}
                      <button
                        onClick={() => handleAnswerSelect(option.id)}
                        className={`w-full bg-gradient-to-br ${noteStyle.color} p-6 md:p-8 rounded-lg shadow-xl border-2 ${noteStyle.borderColor} ${noteStyle.rotation} relative h-full flex flex-col items-center justify-center cursor-pointer hover:shadow-2xl transition-all duration-300 ${
                          isSelected ? 'ring-2 ring-imperial-gold ring-opacity-50' : ''
                        }`}
                        role="radio"
                        aria-checked={isSelected}
                        aria-labelledby={`option-${option.id}`}
                      >
                        {/* Paper Holes */}
                        <div className="absolute left-4 top-6 w-3 h-3 bg-warm-pearl rounded-full border border-patina-gold/50"></div>
                        <div className="absolute left-4 top-12 w-3 h-3 bg-warm-pearl rounded-full border border-patina-gold/50"></div>
                        <div className="absolute left-4 top-18 w-3 h-3 bg-warm-pearl rounded-full border border-patina-gold/50"></div>

                        {/* Lines like notebook paper */}
                        <div className="absolute inset-6 opacity-10">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-px bg-patina-gold mb-6"></div>
                          ))}
                        </div>

                        {/* Keyboard number indicator */}
                        <div className="absolute -top-2 -left-2 w-6 h-6 bg-imperial-gold rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-royal-purple font-raleway font-bold text-xs">
                            {index + 1}
                          </span>
                        </div>

                        {/* Selection indicator */}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-imperial-gold rounded-full flex items-center justify-center shadow-lg"
                          >
                            <div className="w-2 h-2 bg-royal-purple rounded-full"></div>
                          </motion.div>
                        )}

                        {/* Icon */}
                        <div className="mb-4">
                          <div className="w-12 h-12 bg-imperial-gold/20 rounded-full flex items-center justify-center">
                            <option.icon className="w-6 h-6 text-royal-purple" />
                          </div>
                        </div>

                        {/* Text */}
                        <div 
                          id={`option-${option.id}`}
                          className="relative z-10 font-handwriting text-lg md:text-xl leading-relaxed text-velvet-black text-center" 
                          style={{ fontFamily: 'Kalam, cursive' }}
                        >
                          {option.text}
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between max-w-xl mx-auto">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  className="flex items-center space-x-2 px-6 py-3 rounded-full border border-imperial-gold/30 text-royal-purple disabled:opacity-50 disabled:cursor-not-allowed hover:bg-imperial-gold/10 transition-colors font-raleway"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  <span>Précédent</span>
                </button>

                <button
                  onClick={handleNext}
                  disabled={!selectedAnswer}
                  className="flex items-center space-x-2 px-6 py-3 rounded-full bg-gradient-to-r from-imperial-gold/20 to-rose-champagne/20 border border-imperial-gold/30 text-royal-purple font-raleway font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-imperial-gold/30 hover:to-rose-champagne/30 transition-all duration-200"
                >
                  <span>
                    {currentQuestion === quizQuestions.length - 1 ? 'Voir résultat' : 'Suivant'}
                  </span>
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Add Kalam font for handwriting effect */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap');
        `}</style>
      </main>
    </div>
  );
};

export default QuizPage;