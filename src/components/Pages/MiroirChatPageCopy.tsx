import { motion } from "framer-motion";

// Custom icon component for Unicode U+2655 (White Chess Queen)
const WhiteChessQueenIcon = ({ className = "" }: { className?: string }) => (
  <span
    className={`inline-block ${className} text-[28px] leading-[28px]`}
    role="img"
    aria-label="White Chess Queen"
  >
    {"\u2655"}
  </span>
);

const MiroirChatPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex items-center justify-center first:pt-0 last:pb-0 relative z-10"
    >
      <div className="text-center mx-auto max-w-lg">
        <div className="w-24 h-24 bg-royal-gold rounded-full flex items-center justify-center mx-auto mb-6 shadow-golden">
          <WhiteChessQueenIcon className="text-royal-purple" />
        </div>
        <h1 className="text-4xl font-serif font-bold text-royal-pearl mb-2">
          Miroir Miroir
        </h1>
        <span className="text-xs md:text-sm opacity-80 text-royal-pearl block mb-4">
          Découvre la Queen en toi
        </span>
        <p className="text-royal-pearl/70 font-sans text-lg">
          Bientôt, tu pourras dialoguer avec la Reine‑Mère et explorer ton
          royaume intérieur.
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

export default MiroirChatPage;
