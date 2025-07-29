import { motion } from 'framer-motion';
import { BookOpenIcon } from '@heroicons/react/24/outline';

const JournalPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex items-center justify-center first:pt-0 last:pb-0 relative z-10"
    >
      <div className="text-center mx-auto max-w-lg">
        <div className="w-24 h-24 bg-royal-gold rounded-full flex items-center justify-center mx-auto mb-6 shadow-golden">
          <BookOpenIcon className="w-12 h-12 text-royal-purple" />
        </div>
        <h1 className="text-4xl font-serif font-bold text-royal-pearl mb-4">
          Journal du Royaume
        </h1>
        <p className="text-royal-pearl/70 font-sans text-lg">
          Discover the latest news from the kingdom here.
        </p>
        <div className="mt-8">
          <div className="inline-flex items-center space-x-2 bg-royal-purple/60 rounded-full px-6 py-3 border border-royal-gold/30">
            <div className="w-3 h-3 bg-royal-gold rounded-full animate-pulse"></div>
            <span className="text-royal-pearl font-sans font-medium">
              Coming Soon / Bientôt disponible
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default JournalPage;