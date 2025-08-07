import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  RectangleStackIcon, 
  HeartIcon,
  UserGroupIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
// import { useAuth } from '../../contexts/AuthContext'; // Temporarily commented out until auth is implemented
import { MysteryCard } from '../MysteryCard';


const mysteryFeatures = [
  {
    icon: <RectangleStackIcon className="w-12 h-12" />,
    title: 'Ta pioche',
    description: 'Découvre les archétypes masculins que tu attires pour commencer ton voyage de découverte.',
    chatPrompt: "Tu veux qu'on parle de tes cartes?",
    path: '/poiche',
    image: '/assets/cards/TaPioche.svg'
  },
  {
    icon: <HeartIcon className="w-12 h-12" />,
    title: 'Miroir, Miroir!',
    description: 'Découvre ton type de Queen : coeur, carreau, trèfle ou pique, tes forces, tes défis, ton langage de l\'amour et plus encore',
    chatPrompt: "T'es quel genre de Queen, toi, vraiment?",
    path: '/salon',
    image: '/assets/cards/MiroirMiroir.svg'
  },
  {
    icon: <UserGroupIcon className="w-12 h-12" />,
    title: 'Salon de thé',
    description: 'Découvre des rituels qui pourront te faire déconnecter de relations toxiques et te reconnecter à la Queen en toi.',
    chatPrompt: "Et si on mettait les cartes sur table?",
    path: '/chat',
    image: '/assets/cards/SalonDeThe.svg'
  }
];

const DashboardHome = () => {
  // const { user } = useAuth(); // Temporarily commented out until auth is implemented
  const [flippedCardIndex, setFlippedCardIndex] = useState<number | null>(null);

  const handleCardFlip = (index: number) => {
    setFlippedCardIndex(flippedCardIndex === index ? null : index);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="first:pt-0 last:pb-0 relative z-10"
    >
      {/* Welcome Message (left-aligned) - Hidden on mobile */}
      <div className="mb-16 flex-col items-start hidden lg:flex">
        <h2 className="text-3xl font-serif font-bold text-royal-gold mb-5">
          Bonjour, Client
        </h2>
        <p className="text-royal-pearl/80 text-lg font-sans">
            Bienvenue dans ton royaume personnel
        </p>
      </div>
      {/* Mystery Cards Section */}
      <div className="mb-12 lg:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-8"
        >
            <h2 className="text-3xl font-serif font-bold text-royal-purple mb-4">
              Ton Royaume Intérieur
          </h2>
            <p className="text-cabinet-aubergine/70 font-sans text-lg max-w-2xl mx-auto">
              Trois portes s'ouvrent vers ta transformation. Choisis ton chemin de découverte.
          </p>
        </motion.div>
        
        {/* Responsive Grid: Mobile single column, Tablet 2 cols, Desktop 3 cols */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
          {mysteryFeatures.map((feature, index) => (
            <div key={index} className="flex justify-center">
              <MysteryCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                index={index}
                path={feature.path}
                isFlipped={flippedCardIndex === index}
                onFlip={() => handleCardFlip(index)}
                image={feature.image}
              />
            </div>
          ))}
        </div>
      </div>

      

      {/* Le journal du Royaume */}
      <div className="bg-royal-purple/60 rounded-2xl p-4 sm:p-6 lg:p-8 border border-royal-gold/20 mb-8 sm:mb-12 lg:mb-16">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-royal-pearl mb-4 sm:mb-6 text-center sm:text-left">
          Le journal du Royaume
        </h2>
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-3 sm:p-4 bg-royal-purple/40 rounded-lg">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-royal-gold rounded-full flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
              <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-royal-purple" />
            </div>
            <div className="text-center sm:text-left flex-1">
              <p className="font-sans font-medium text-royal-pearl text-sm sm:text-base">
                Bienvenue dans ton royaume !
              </p>
              <p className="text-royal-pearl/70 text-xs sm:text-sm mt-1">
                Explore tes premières cartes pour commencer ton voyage royal
              </p>
            </div>
          </div>
        </div>
      </div>


    </motion.div>
  );
};

export default DashboardHome;