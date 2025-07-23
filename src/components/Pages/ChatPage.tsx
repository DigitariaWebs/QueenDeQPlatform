import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Je veux que tu agisses comme une interprète de rêves. Je te donnerai des descriptions de mes rêves, et tu me fourniras des interprétations basées sur les symboles et les thèmes présents dans le rêve. Ne donne pas d\'opinions personnelles ou d\'hypothèses sur le rêveur. Fournis seulement des interprétations factuelles basées sur les informations données. Mon premier rêve était : [J\'ai vu une petite fée volant dans le ciel. Elle portait une robe scintillante quand elle a volé, tout le ciel scintillait de lumière]',
      isUser: true,
      timestamp: new Date(Date.now() - 300000)
    },
    {
      id: '2',
      content: 'Dans votre rêve, l\'apparition d\'une petite fée volant dans le ciel peut symboliser un sentiment d\'émerveillement, de magie et d\'enchantement dans votre vie. Les fées sont souvent associées à l\'imagination, à la créativité et aux royaumes invisibles de l\'existence. Le fait qu\'elle portait une robe scintillante et faisait scintiller tout le ciel de lumière suggère un sentiment d\'admiration et de beauté entourant cette expérience. Ce rêve peut indiquer un désir de plus de joie, de légèreté et de fantaisie dans votre vie éveillée, ou il pourrait signifier un besoin de vous reconnecter avec votre enfant intérieur et d\'embrasser la magie et l\'émerveillement du monde qui vous entoure.',
      isUser: false,
      timestamp: new Date(Date.now() - 240000)
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simuler la réponse de la Reine-Mère
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Bientôt disponible, ma chère âme. La Reine-Mère prépare ses réponses mystiques pour vous guider dans l\'interprétation de vos rêves et visions.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const TypingIndicator = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex items-center space-x-2 text-slate-500"
    >
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-royal-gold rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
      <span className="text-sm">La Reine-Mère écrit...</span>
    </motion.div>
  );

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header - Design Royal Amélioré */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mb-8"
        >
          {/* Background avec gradient sophistiqué */}
          <div className="relative bg-gradient-to-br from-white/30 via-white/20 to-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden">
            
            {/* Texture ornementale */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-royal-gold/10 via-transparent to-royal-champagne/10"></div>
              <div className="absolute top-6 left-6 w-2 h-2 bg-royal-gold/40 rounded-full"></div>
              <div className="absolute top-4 right-8 w-1 h-1 bg-royal-champagne/60 rounded-full"></div>
              <div className="absolute bottom-4 left-12 w-1 h-1 bg-royal-gold/50 rounded-full"></div>
            </div>

            {/* Contenu principal */}
            <div className="relative p-8">
              <div className="flex items-center justify-between">
                
                {/* Section gauche : Avatar et titre */}
                <div className="flex items-center space-x-6">
                  
                  {/* Avatar sophistiqué avec tasse de thé */}
                  <div className="relative">
                    {/* Halo doré subtil */}
                    <div className="absolute -inset-3 bg-gradient-to-r from-royal-gold/20 to-royal-champagne/20 rounded-full blur-lg"></div>
                    
                    {/* Container avatar avec bordure dorée */}
                    <div className="relative w-16 h-16 bg-gradient-to-br from-royal-gold/80 via-royal-champagne/70 to-royal-gold/80 rounded-full p-0.5 shadow-lg">
                      <div className="w-full h-full bg-gradient-to-br from-white/40 to-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <img 
                          src="/assets/icons/teacup.svg" 
                          alt="Tasse de Thé Royal" 
                          className="w-8 h-8 filter drop-shadow-sm"
                        />
                      </div>
                    </div>
                    
                    {/* Petite couronne flottante */}
                    <div className="absolute -top-1 -right-1 w-4 h-4 text-royal-gold/80">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full animate-pulse">
                        <path d="M12 6L13.13 10.26L17 9L15.87 13.14L19 15L15.87 16.86L17 21L13.13 19.74L12 24L10.87 19.74L7 21L8.13 16.86L5 15L8.13 13.14L7 9L10.87 10.26L12 6Z"/>
                      </svg>
                    </div>
                  </div>

                  {/* Titre et description */}
                  <div className="space-y-1">
                    <h1 className="text-3xl font-playfair font-bold bg-gradient-to-r from-royal-purple via-royal-purple/90 to-royal-gold bg-clip-text text-transparent">
                      Salon de Thé Royal
                    </h1>
                    <p className="text-royal-purple/80 font-raleway text-lg flex items-center space-x-2">
                      <span>Interprétation des rêves avec la Reine-Mère</span>
                      <span className="text-royal-gold/70 animate-pulse">✨</span>
                    </p>
                  </div>
                </div>

                {/* Section droite : Statut */}
                <div className="flex flex-col items-end space-y-1">
                  <div className="flex items-center space-x-2 text-royal-purple/70 font-raleway text-sm">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span>Disponible</span>
                  </div>
                  <div className="text-royal-purple/50 font-raleway text-xs">
                    Guidance mystique
                  </div>
                </div>
              </div>
            </div>

            {/* Ligne dorée décorative en bas */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-royal-gold/40 to-transparent"></div>
          </div>

          {/* Ornements flottants */}
          <div className="absolute -top-2 -right-2 w-3 h-3 bg-royal-gold/30 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-royal-champagne/40 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
        </motion.div>

        {/* Messages Section - Sans scroll fixe */}
        <div className="space-y-6 mb-6">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-3xl ${message.isUser ? 'order-2' : 'order-1'}`}>
                  {!message.isUser && (
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-royal-gold/80 to-royal-champagne/80 rounded-full flex items-center justify-center shadow-sm">
                        <img 
                          src="/assets/icons/teacup.svg" 
                          alt="Tasse de Thé Royal" 
                          className="w-5 h-5"
                        />
                      </div>
                      <span className="text-sm font-raleway text-royal-purple/70 font-medium">
                        Reine-Mère
                      </span>
                    </div>
                  )}
                  
                  <div className={`rounded-2xl p-4 ${
                    message.isUser 
                      ? 'bg-gradient-to-r from-royal-purple to-royal-purple/80 text-white ml-12' 
                      : 'bg-white/20 backdrop-blur-sm border border-white/30 text-royal-purple mr-12'
                  }`}>
                    <p className="font-raleway leading-relaxed">{message.content}</p>
                    
                    {/* Action Buttons for bot messages */}
                    {!message.isUser && (
                      <div className="flex items-center space-x-2 mt-4">
                        <button className="w-8 h-8 rounded-full bg-royal-gold/20 hover:bg-royal-gold/30 flex items-center justify-center transition-colors">
                          <svg className="w-4 h-4 text-royal-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                        <button className="w-8 h-8 rounded-full bg-royal-gold/20 hover:bg-royal-gold/30 flex items-center justify-center transition-colors">
                          <svg className="w-4 h-4 text-royal-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13l3 3 7-7" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => copyMessage(message.id, message.content)}
                          className="px-3 py-1 rounded-full bg-royal-gold/20 hover:bg-royal-gold/30 text-royal-gold text-sm font-raleway transition-colors"
                        >
                          {copiedMessageId === message.id ? 'Copié' : 'Copier'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-3xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-royal-gold/80 to-royal-champagne/80 rounded-full flex items-center justify-center shadow-sm">
                      <img 
                        src="/assets/icons/teacup.svg" 
                        alt="Tasse de Thé Royal" 
                        className="w-5 h-5"
                      />
                    </div>
                    <span className="text-sm font-raleway text-royal-purple/70 font-medium">
                      Reine-Mère
                    </span>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl p-4 mr-12">
                    <TypingIndicator />
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Sticky au bas */}
        <div className="sticky bottom-0 bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-6 border-t border-white/20">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Décrivez votre rêve à la Reine-Mère..."
                className="w-full py-3 px-4 bg-white/20 backdrop-blur-sm rounded-full 
                         text-royal-purple placeholder-royal-purple/60 font-raleway
                         focus:outline-none focus:ring-2 focus:ring-royal-gold/50
                         transition-all duration-200"
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="w-12 h-12 bg-gradient-to-r from-royal-gold to-royal-champagne hover:from-royal-gold/90 hover:to-royal-champagne/90 
                       disabled:opacity-50 disabled:cursor-not-allowed
                       rounded-full flex items-center justify-center transition-all duration-200
                       shadow-lg hover:shadow-xl"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;