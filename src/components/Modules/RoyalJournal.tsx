import { motion } from 'framer-motion';
import { BookOpenIcon } from '@heroicons/react/24/outline';

const RoyalJournal = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex items-center justify-center first:pt-0 last:pb-0"
    >
      <div className="text-center mx-auto max-w-lg">
        <div className="w-24 h-24 bg-gradient-to-br from-royal-gold to-royal-champagne rounded-full flex items-center justify-center mx-auto mb-6 shadow-golden">
          <BookOpenIcon className="w-12 h-12 text-royal-purple" />
        </div>
        <h1 className="text-4xl font-serif font-bold text-royal-purple mb-4">
          Journal Royal
        </h1>
        <p className="text-cabinet-aubergine/70 font-sans text-lg">
          Consignez vos réflexions et votre parcours introspectif dans votre journal personnel.
        </p>
        <div className="mt-8">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-royal-gold/20 to-royal-champagne/20 rounded-full px-6 py-3 border border-royal-gold/30">
            <div className="w-3 h-3 bg-royal-gold rounded-full animate-pulse"></div>
            <span className="text-royal-purple font-sans font-medium">
              Coming Soon / Bientôt disponible
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RoyalJournal;