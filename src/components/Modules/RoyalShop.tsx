import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Heart, Sparkles, Crown, ShoppingBag, Shirt, Shield } from 'lucide-react';

interface ShopItem {
  id: string;
  name: string;
  price: number;
  category: 'cards' | 'accessories' | 'clothing' | 'protection';
  description: string;
  badge?: string;
}

const RoyalShop: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const shopItems: ShopItem[] = [
    {
      id: '1',
      name: 'Jeu de Cartes Queen de Q • Édition Physique',
      price: 29.99,
      category: 'cards',
      description: 'Découvrez les archétypes masculins avec notre jeu de cartes physique premium',
      badge: 'Best-seller'
    },
    {
      id: '2',
      name: 'T-Shirt "Je suis une Queen"',
      price: 34.99,
      category: 'clothing',
      description: 'Portez votre couronne avec fierté dans ce t-shirt 100% coton bio',
      badge: 'Édition Limitée'
    },
    {
      id: '3',
      name: 'Kit de Protection Royale',
      price: 19.99,
      category: 'protection',
      description: 'Condoms premium et accessoires pour queens qui se respectent',
      badge: 'Essentiel'
    },
    {
      id: '4',
      name: 'Bracelet Anti-2 de Pique',
      price: 24.99,
      category: 'accessories',
      description: 'Charme symbolique pour attirer les bonnes énergies masculines',
      badge: 'Fait Main'
    }
  ];

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

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'all': return 'Tous';
      case 'cards': return 'Cartes';
      case 'clothing': return 'Vêtements';
      case 'protection': return 'Protection';
      case 'accessories': return 'Accessoires';
      default: return 'Tous';
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? shopItems 
    : shopItems.filter(item => item.category === selectedCategory);

  return (
    <div className="space-y-12 lg:space-y-16">
      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 text-4xl animate-float opacity-30" style={{ color: '#776650' }}>👑</div>
        <div className="absolute top-40 right-20 text-3xl animate-float opacity-40" style={{ color: '#C8A96B', animationDelay: '1s' }}>💎</div>
        <div className="absolute top-60 left-1/4 text-2xl animate-float opacity-25" style={{ color: '#B79D74', animationDelay: '2s' }}>👗</div>
        <div className="absolute bottom-40 right-1/3 text-3xl animate-float opacity-35" style={{ color: '#D4B5A5', animationDelay: '0.5s' }}>🛡️</div>
        <div className="absolute top-1/3 right-10 text-2xl animate-float opacity-30" style={{ color: '#776650', animationDelay: '1.5s' }}>🃏</div>
        <div className="absolute bottom-20 left-20 text-xl animate-float opacity-40" style={{ color: '#C8A96B', animationDelay: '2.5s' }}>✨</div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-12 relative"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Beta Ribbon */}
          <div className="absolute -top-8 -right-8 transform rotate-12">
            <div className="bg-gradient-to-r from-rose-champagne to-imperial-gold text-white px-4 py-2 rounded-lg shadow-lg border-2 border-white">
              <div className="flex items-center gap-2">
                <Sparkles size={14} />
                <span className="text-sm font-bold font-raleway">BOUTIQUE</span>
                <Crown size={14} />
              </div>
            </div>
          </div>

          {/* Decorative Frame */}
          <div className="absolute -inset-4 border-4 border-dashed border-imperial-gold/40 rounded-lg transform rotate-1"></div>
          
          <motion.div
            className="relative mb-6"
            animate={{ rotateY: [0, 5, 0, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          >
            <Crown className="w-16 h-16 text-imperial-gold mx-auto mb-4" />
          </motion.div>
          
          <h1 className="relative font-playfair text-4xl md:text-5xl font-bold text-royal-purple mb-4">
            Boutique Queen de Q
          </h1>
          
          {/* Vintage Underline */}
          <div className="flex items-center justify-center gap-2">
            <div className="h-px bg-gradient-to-r from-transparent via-imperial-gold to-transparent flex-1"></div>
            <Crown className="text-imperial-gold" size={20} />
            <div className="h-px bg-gradient-to-r from-transparent via-imperial-gold to-transparent flex-1"></div>
          </div>
          
          <p className="text-royal-purple/80 text-xl max-w-3xl mx-auto leading-relaxed mt-4 font-raleway">
            Les produits qui vont réveiller ta Reine intérieure
          </p>
        </motion.div>

        {/* Category Filters */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {(['all', 'cards', 'clothing', 'protection', 'accessories'] as const).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 font-raleway ${
                selectedCategory === category
                  ? 'bg-imperial-gold text-royal-purple shadow-lg shadow-imperial-gold/30'
                  : 'bg-white/20 text-royal-purple hover:bg-white/30 backdrop-blur-sm border border-imperial-gold/20'
              }`}
            >
              {getCategoryLabel(category)}
            </button>
          ))}
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              className="group relative"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              {/* Product Card */}
              <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-imperial-gold/30 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:border-imperial-gold/50">
                
                {/* Badge */}
                {item.badge && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-imperial-gold to-rose-champagne text-royal-purple px-3 py-1 rounded-full text-xs font-bold font-raleway">
                    {item.badge}
                  </div>
                )}

                {/* Category Icon */}
                <div className="absolute top-4 left-4 w-10 h-10 bg-gradient-to-br from-white/40 to-white/20 rounded-full flex items-center justify-center border border-imperial-gold/30">
                  {getCategoryIcon(item.category)}
                </div>

                {/* Product Image Placeholder */}
                <div className="w-full h-40 bg-gradient-to-br from-imperial-gold/20 to-rose-champagne/20 rounded-xl mb-6 mt-8 flex items-center justify-center border border-imperial-gold/30">
                  <div className={`w-16 h-16 bg-gradient-to-r ${getCategoryColor(item.category)} rounded-full flex items-center justify-center`}>
                    {getCategoryIcon(item.category)}
                  </div>
                </div>

                {/* Product Details */}
                <h3 className="font-bold text-lg text-royal-purple mb-3 text-center font-playfair">
                  {item.name}
                </h3>
                
                <p className="text-royal-purple/70 text-sm text-center mb-6 leading-relaxed font-raleway">
                  {item.description}
                </p>

                {/* Price & Action */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xl text-imperial-gold font-raleway">
                    ${item.price} CAD
                  </span>
                  <motion.button
                    disabled
                    className="px-4 py-2 bg-gradient-to-r from-imperial-gold/20 to-rose-champagne/20 text-royal-purple rounded-lg font-medium cursor-not-allowed opacity-60 border border-imperial-gold/30 hover:opacity-80 transition-opacity font-raleway"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Bientôt
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
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-8 border border-imperial-gold/30">
            <Crown className="w-12 h-12 text-imperial-gold mx-auto mb-4" />
            <h2 className="font-bold text-2xl text-imperial-gold mb-4 font-playfair">
              La Boutique s'Éveille
            </h2>
            <p className="text-royal-purple/80 max-w-2xl mx-auto leading-relaxed font-raleway">
              Notre collection exclusive arrive bientôt avec des produits authentiques Queen de Q. Reste connecté·e pour les premières révélations !
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RoyalShop;