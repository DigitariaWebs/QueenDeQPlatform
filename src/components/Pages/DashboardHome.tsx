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
    path: '/cards'
  },
  {
    icon: <HeartIcon className="w-12 h-12" />,
    title: 'Miroir, Miroir!',
    description: 'Découvre ton type de Queen : coeur, carreau, trèfle ou pique, tes forces, tes défis, ton langage de l\'amour et plus encore',
    chatPrompt: "T'es quel genre de Queen, toi, vraiment?",
    path: '/quiz'
  },
  {
    icon: <UserGroupIcon className="w-12 h-12" />,
    title: 'Salon de thé',
    description: 'Découvre des rituels qui pourront te faire déconnecter de relations toxiques et te reconnecter à la Queen en toi.',
    chatPrompt: "Et si on mettait les cartes sur table?",
    path: '/chat'
  }
];

const DashboardHome = () => {
  // const { user } = useAuth(); // Temporarily commented out until auth is implemented

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="first:pt-0 last:pb-0 relative z-10"
    >
      {/* Welcome Message (left-aligned) */}
      <div className="mb-16 flex flex-col items-start">
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 max-w-7xl mx-auto">
          {mysteryFeatures.map((feature, index) => (
            <div key={index} className="flex justify-center">
              <MysteryCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                index={index}
                path={feature.path}
              />
            </div>
          ))}
        </div>
      </div>

      

      {/* Le journal du Royaume */}
      <div className="bg-royal-purple/60 rounded-2xl p-8 border border-royal-gold/20 mb-12 lg:mb-16">
        <h2 className="text-2xl font-serif font-bold text-royal-pearl mb-6">
          Le journal du Royaume
        </h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-royal-purple/40 rounded-lg">
            <div className="w-10 h-10 bg-royal-gold rounded-full flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-royal-purple" />
            </div>
            <div>
              <p className="font-sans font-medium text-royal-pearl">
                Bienvenue dans ton royaume !
              </p>
              <p className="text-royal-pearl/70 text-sm">
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