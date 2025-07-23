import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Heart, Gem, Sparkles, Moon, Eye, Zap, Crown, ShoppingBag, Shirt, Shield } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';

type TranslationFunction = ReturnType<typeof useTranslation>['t'];

interface ShopItem {
  id: string;
  name: string;
  price: number;
  category: 'cards' | 'accessories' | 'clothing' | 'protection';
  description: string;
  badge?: string;
}

const getShopItems = (t: TranslationFunction): ShopItem[] => [
  {
    id: '1',
    name: t('shop.items.physicalCards.name'),
    price: 29.99,
    category: 'cards',
    description: t('shop.items.physicalCards.description'),
    badge: t('shop.badges.bestseller')
  },
  {
    id: '2',
    name: t('shop.items.queenShirt.name'),
    price: 34.99,
    category: 'clothing',
    description: t('shop.items.queenShirt.description'),
    badge: t('shop.badges.limitedEdition')
  },
  {
    id: '3',
    name: t('shop.items.protectionKit.name'),
    price: 19.99,
    category: 'protection',
    description: t('shop.items.protectionKit.description'),
    badge: t('shop.badges.essential')
  },
  {
    id: '4',
    name: t('shop.items.charmBracelet.name'),
    price: 24.99,
    category: 'accessories',
    description: t('shop.items.charmBracelet.description'),
    badge: t('shop.badges.handcrafted')
  }
];

export const Shop: React.FC = () => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [starPositions, setStarPositions] = useState<Array<{x: number, y: number, delay: number}>>([]);
  
  const shopItems = getShopItems(t);

  useEffect(() => {
    // Generate random star positions for background
    const stars = Array.from({ length: 15 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }));
    setStarPositions(stars);
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cards': return <Star className="w-6 h-6 text-imperial-gold" />;
      case 'clothing': return <Shirt className="w-6 h-6 text-royal-purple" />;
      case 'protection': return <Shield className="w-6 h-6 text-rose-champagne" />;
      case 'accessories': return <Heart className="w-6 h-6 text-patina-gold" />;
      default: return <ShoppingBag className="w-6 h-6 text-amber-smoke" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cards': return 'from-imperial-gold to-smoky-gold';
      case 'clothing': return 'from-royal-purple to-vintage-aubergine';
      case 'protection': return 'from-rose-champagne to-antique-rose';
      case 'accessories': return 'from-patina-gold to-amber-smoke';
      default: return 'from-velvet-black to-ink-black';
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? shopItems 
    : shopItems.filter(item => item.category === selectedCategory);

  return (
    <main className="min-h-screen px-2 sm:px-4 lg:px-6 pt-4 sm:pt-8 lg:pt-32 pb-4 sm:pb-8 lg:pb-12 relative overflow-hidden">
      {/* Animated Background Stars */}
      {starPositions.map((star, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{ left: `${star.x}%`, top: `${star.y}%` }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.5, 1] }}
          transition={{ duration: 3, repeat: Infinity, delay: star.delay }}
        />
      ))}

      <div className="w-full relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-8 sm:mb-10 lg:mb-12 relative"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-imperial-gold/20 to-transparent blur-3xl"></div>
          
          <motion.div
            className="relative mb-4 sm:mb-6"
            animate={{ rotateY: [0, 5, 0, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          >
            <Crown className="w-12 h-12 sm:w-16 sm:h-16 text-imperial-gold mx-auto mb-3 sm:mb-4" />
          </motion.div>
          
          <h1 className="font-playfair font-bold text-3xl sm:text-4xl lg:text-5xl bg-gradient-to-r from-imperial-gold via-rose-champagne to-antique-rose bg-clip-text text-transparent mb-3 sm:mb-4 px-2">
            {t('shop.title')}
          </h1>
          <p className="text-rose-champagne/80 text-base sm:text-lg lg:text-xl max-w-full sm:max-w-3xl mx-auto leading-relaxed font-raleway px-2">
            {t('shop.subtitle')}
          </p>
        </motion.div>

        {/* Category Filters */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4 mb-8 sm:mb-10 lg:mb-12 px-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {(['all', 'cards', 'clothing', 'protection', 'accessories'] as const).map((category) => {
            const getCategoryLabel = (cat: string) => {
              switch (cat) {
                case 'all': return t('shop.categories.all');
                case 'cards': return t('shop.categories.cards');
                case 'clothing': return t('shop.categories.clothing');
                case 'protection': return t('shop.categories.protection');
                case 'accessories': return t('shop.categories.accessories');
                default: return t('shop.categories.all');
              }
            };

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-full font-medium transition-all duration-300 text-sm sm:text-base ${
                  selectedCategory === category
                    ? 'bg-imperial-gold text-royal-purple shadow-lg shadow-imperial-gold/30'
                    : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                }`}
              >
                {getCategoryLabel(category)}
              </button>
            );
          })}
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              className="group relative"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              {/* Product Card */}
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:border-imperial-gold/50">
                
                {/* Badge */}
                {item.badge && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-imperial-gold to-rose-champagne text-royal-purple px-3 py-1 rounded-full text-xs font-bold font-raleway">
                    {item.badge}
                  </div>
                )}

                {/* Category Icon */}
                <div className="absolute top-4 left-4 w-10 h-10 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center border border-white/30">
                  {getCategoryIcon(item.category)}
                </div>

                {/* Product Image Placeholder */}
                <div className="w-full h-40 bg-gradient-to-br from-imperial-gold/20 to-rose-champagne/20 rounded-xl mb-6 mt-8 flex items-center justify-center border border-imperial-gold/30">
                  <div className={`w-16 h-16 bg-gradient-to-r ${getCategoryColor(item.category)} rounded-full flex items-center justify-center`}>
                    {getCategoryIcon(item.category)}
                  </div>
                </div>

                {/* Product Details */}
                <h3 className="font-cinzel font-bold text-lg text-white mb-3 text-center">
                  {item.name}
                </h3>
                
                                  <p className="text-rose-champagne/80 text-sm text-center mb-6 leading-relaxed font-raleway">
                  {item.description}
                </p>

                {/* Price & Action */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xl bg-gradient-to-r from-imperial-gold to-rose-champagne bg-clip-text text-transparent">
                    ${item.price} {t('currency.cad')}
                  </span>
                  <motion.button
                    disabled
                    className="px-4 py-2 bg-gradient-to-r from-imperial-gold/20 to-rose-champagne/20 text-white rounded-lg font-medium cursor-not-allowed opacity-60 border border-imperial-gold/30 hover:opacity-80 transition-opacity font-raleway"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {t('shop.comingSoon')}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Coming Soon Footer */}
        <motion.div
          className="mt-20 text-center relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
        >
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
            <Crown className="w-12 h-12 text-imperial-gold mx-auto mb-4" />
            <h2 className="font-cinzel font-bold text-2xl text-imperial-gold mb-4">
              {t('shop.awakeningTitle')}
            </h2>
            <p className="text-rose-champagne/80 max-w-2xl mx-auto leading-relaxed font-raleway">
              {t('shop.awakeningDesc')}
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}; 