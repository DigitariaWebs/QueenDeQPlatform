import { motion } from "framer-motion";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

const SalonChatPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex items-center justify-center first:pt-0 last:pb-0 relative z-10"
    >
      <div className="text-center mx-auto max-w-lg">
        <div className="w-24 h-24 bg-royal-gold rounded-full flex items-center justify-center mx-auto mb-6 shadow-golden">
          <ChatBubbleLeftRightIcon className="w-12 h-12 text-royal-purple" />
        </div>
        <h1 className="text-4xl font-serif font-bold text-royal-pearl mb-2">
          Salon de Thé
        </h1>
        <span className="text-xs md:text-sm opacity-80 text-royal-pearl block mb-4">
          Rituel de reprise de pouvoir
        </span>
        <p className="text-royal-pearl/70 font-sans text-lg">
          Bientôt, tu pourras vivre des rituels guidés avec la Reine‑Mère pour
          reprendre ton pouvoir intérieur.
        </p>
        <div className="mt-8">
          <div className="inline-flex items-center space-x-2 bg-royal-purple/60 rounded-full px-6 py-3 border border-royal-gold/30">
            <div className="w-3 h-3 bg-royal-gold rounded-full animate-pulse"></div>
            <span className="text-royal-pearl font-sans font-medium">
              Bientôt disponible
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SalonChatPage;
