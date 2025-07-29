import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, StarIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  
  const { login, register, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        const success = await login(formData.email, formData.password);
        if (!success) {
          setError('Invalid credentials. Try admin@example.com / password123');
        }
      } else {
        const success = await register(formData);
        if (!success) {
          setError('Registration failed. Email may already exist.');
        }
      }
    } catch {
      setError('An error occurred. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
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

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 text-4xl animate-float opacity-30" style={{ color: '#776650' }}>👑</div>
        <div className="absolute top-40 right-20 text-3xl animate-float opacity-40" style={{ color: '#C8A96B', animationDelay: '1s' }}>✨</div>
        <div className="absolute top-60 left-1/4 text-2xl animate-float opacity-25" style={{ color: '#B79D74', animationDelay: '2s' }}>🌟</div>
        <div className="absolute bottom-40 right-1/3 text-3xl animate-float opacity-35" style={{ color: '#D4B5A5', animationDelay: '0.5s' }}>🔮</div>
        <div className="absolute top-1/3 right-10 text-2xl animate-float opacity-30" style={{ color: '#776650', animationDelay: '1.5s' }}>📜</div>
        <div className="absolute bottom-20 left-20 text-xl animate-float opacity-40" style={{ color: '#C8A96B', animationDelay: '2.5s' }}>💫</div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-lg"
        >
          {/* Header with Logo */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-8 relative"
          >
            {/* Beta Ribbon */}
            <div className="absolute -top-8 -right-8 transform rotate-12">
              <div className="bg-gradient-to-r from-rose-champagne to-imperial-gold text-white px-4 py-2 rounded-lg shadow-lg border-2 border-white">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4" />
                  <span className="text-sm font-bold font-raleway">ROYAL</span>
                  <StarIcon className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Decorative Frame */}
            <div className="absolute -inset-4 border-4 border-dashed border-imperial-gold/40 rounded-lg transform rotate-1"></div>
            
            {/* Logo */}
            <div className="relative mb-6">
              <div className="w-20 h-20 mx-auto mb-4 relative">
                <img 
                  src="/assets/images/logo-gold.webp" 
                  alt="Queen de Q" 
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </div>
            </div>

            <h1 className="relative text-4xl font-playfair font-bold text-royal-purple mb-2">
              Queen de Q
            </h1>
            
            {/* Vintage Underline */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-px bg-gradient-to-r from-transparent via-imperial-gold to-transparent flex-1"></div>
              <StarIcon className="text-imperial-gold w-5 h-5" />
              <div className="h-px bg-gradient-to-r from-transparent via-imperial-gold to-transparent flex-1"></div>
            </div>
            
            <p className="text-royal-purple/80 font-handwriting text-lg" style={{ fontFamily: 'Kalam, cursive' }}>
              Révèle ton essence royale
            </p>
          </motion.div>

          {/* Auth Card as Manuscript */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gradient-to-br from-parchment-cream to-warm-pearl rounded-2xl p-8 shadow-royal border-2 border-imperial-gold/30 relative transform rotate-1"
          >
            {/* Paper Holes */}
            <div className="absolute left-6 top-8 w-3 h-3 bg-warm-pearl rounded-full border border-patina-gold/50"></div>
            <div className="absolute left-6 top-16 w-3 h-3 bg-warm-pearl rounded-full border border-patina-gold/50"></div>
            <div className="absolute left-6 top-24 w-3 h-3 bg-warm-pearl rounded-full border border-patina-gold/50"></div>

            {/* Decorative corners */}
            <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-imperial-gold"></div>
            <div className="absolute -top-2 -right-2 w-4 h-4 border-r-2 border-t-2 border-imperial-gold"></div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 border-l-2 border-b-2 border-imperial-gold"></div>
            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-imperial-gold"></div>

            {/* Toggle */}
            <div className="flex mb-6 bg-gradient-to-r from-imperial-gold/20 to-rose-champagne/20 rounded-lg p-1 relative">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 px-4 rounded-md font-raleway font-medium transition-all duration-300 ${
                  isLogin 
                    ? 'bg-gradient-to-r from-imperial-gold to-rose-champagne text-royal-purple shadow-lg' 
                    : 'text-royal-purple/70 hover:text-royal-purple'
                }`}
              >
                Connexion
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 px-4 rounded-md font-raleway font-medium transition-all duration-300 ${
                  !isLogin 
                    ? 'bg-gradient-to-r from-imperial-gold to-rose-champagne text-royal-purple shadow-lg' 
                    : 'text-royal-purple/70 hover:text-royal-purple'
                }`}
              >
                Inscription
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 relative">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <label className="block text-royal-purple font-handwriting font-medium mb-2 text-lg" style={{ fontFamily: 'Kalam, cursive' }}>
                        Prénom
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border-2 border-patina-gold/30 focus:border-imperial-gold focus:ring-2 focus:ring-imperial-gold/20 transition-all duration-200 font-raleway bg-warm-pearl/50"
                        required={!isLogin}
                      />
                    </div>
                    <div>
                      <label className="block text-royal-purple font-handwriting font-medium mb-2 text-lg" style={{ fontFamily: 'Kalam, cursive' }}>
                        Nom
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border-2 border-patina-gold/30 focus:border-imperial-gold focus:ring-2 focus:ring-imperial-gold/20 transition-all duration-200 font-raleway bg-warm-pearl/50"
                        required={!isLogin}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-royal-purple font-handwriting font-medium mb-2 text-lg" style={{ fontFamily: 'Kalam, cursive' }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-patina-gold/30 focus:border-imperial-gold focus:ring-2 focus:ring-imperial-gold/20 transition-all duration-200 font-raleway bg-warm-pearl/50"
                  required
                />
              </div>

              <div>
                <label className="block text-royal-purple font-handwriting font-medium mb-2 text-lg" style={{ fontFamily: 'Kalam, cursive' }}>
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 rounded-lg border-2 border-patina-gold/30 focus:border-imperial-gold focus:ring-2 focus:ring-imperial-gold/20 transition-all duration-200 font-raleway bg-warm-pearl/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-royal-purple/70 hover:text-royal-purple transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-lg p-4"
                >
                  <p className="text-red-600 font-handwriting text-base" style={{ fontFamily: 'Kalam, cursive' }}>{error}</p>
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-imperial-gold to-rose-champagne text-royal-purple py-4 rounded-lg font-raleway font-bold text-lg hover:from-imperial-gold/90 hover:to-rose-champagne/90 transition-all duration-200 shadow-royal disabled:opacity-50 disabled:cursor-not-allowed border-2 border-imperial-gold/30"
              >
                {isLoading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
              </motion.button>
            </form>

            {/* Demo Credentials */}
            {isLogin && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 p-4 bg-gradient-to-r from-imperial-gold/10 to-rose-champagne/10 rounded-lg border border-imperial-gold/20"
              >
                <p className="text-royal-purple font-handwriting font-medium text-base mb-2" style={{ fontFamily: 'Kalam, cursive' }}>
                  Comptes de démonstration :
                </p>
                <div className="space-y-1 text-royal-purple/70 font-handwriting text-sm" style={{ fontFamily: 'Kalam, cursive' }}>
                  <p>Admin: admin@example.com / password123</p>
                  <p>Client: client@example.com / password123</p>
                </div>
              </motion.div>
            )}

            {/* Tea stain for authentic feel */}
            <div className="absolute top-3 right-4 w-6 h-6 bg-amber-smoke/20 rounded-full blur-sm"></div>
          </motion.div>
        </motion.div>
      </div>

      {/* Add Kalam font for handwriting effect */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap');
      `}</style>
    </main>
  );
};

export default AuthPage;