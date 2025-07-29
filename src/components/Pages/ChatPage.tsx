import React, { useState, useRef, useEffect } from 'react';
import type { RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatService, type Message, type StreamChunk } from '../../services/chatService';

interface ChatMessagesProps {
  messages: Message[];
  streamingMessage: string;
  isTyping: boolean;
  copiedMessageId: string | null;
  onCopy: (id: string, content: string) => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ 
  messages, 
  streamingMessage, 
  isTyping, 
  copiedMessageId, 
  onCopy, 
  messagesEndRef 
}) => {
  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 pb-32" style={{scrollbarGutter:'stable', height: 'calc(100vh - 200px)'}}>
      <div className="max-w-2xl mx-auto flex flex-col gap-4 py-6">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: 20 }}
              transition={{ duration: 0.25 }}
              className={`flex w-full ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-end gap-2 ${message.isUser ? 'flex-row-reverse' : ''}`}> 
                {/* Avatar */}
                {!message.isUser && (
                  <div className="w-8 h-8 bg-royal-gold rounded-full flex items-center justify-center shadow-sm">
                    <img src="/assets/icons/teacup.svg" alt="Tasse de Thé Royal" className="w-5 h-5" />
                  </div>
                )}
                {/* Bubble */}
                <div
                  className={`rounded-2xl px-4 py-2 font-raleway text-base whitespace-pre-line break-words max-w-[80vw] md:max-w-lg
                    ${message.isUser
                      ? 'bg-gradient-to-r from-royal-purple/90 to-royal-gold/30 text-white border-2 border-royal-gold shadow-golden'
                      : 'bg-gradient-to-r from-royal-champagne/80 to-royal-gold/40 text-cabinet-ink border-2 border-royal-gold/30 shadow-royal'}
                  `}
                >
                  {message.content}
                  {/* Copy button for bot messages */}
                  {!message.isUser && (
                    <button
                      onClick={() => onCopy(message.id, message.content)}
                      className="ml-2 px-2 py-0.5 rounded-full text-xs bg-royal-gold/80 hover:bg-royal-gold text-cabinet-ink font-semibold border border-royal-gold/60 shadow-golden transition-colors"
                    >
                      {copiedMessageId === message.id ? 'Copié' : 'Copier'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              key="typing-indicator"
              initial={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: 20 }}
              transition={{ duration: 0.25 }}
              className="flex w-full justify-start"
            >
              <div className="flex items-end gap-2">
                <div className="w-8 h-8 bg-royal-gold rounded-full flex items-center justify-center shadow-sm">
                  <img src="/assets/icons/teacup.svg" alt="Tasse de Thé Royal" className="w-5 h-5" />
                </div>
                <div className="rounded-2xl px-4 py-2 font-raleway text-base text-royal-purple max-w-[80vw] md:max-w-lg flex items-center gap-2 bg-gradient-to-r from-royal-champagne/80 to-royal-gold/40 border-2 border-royal-gold/30 shadow-royal">
                  <span className="flex gap-1">
                    <span className="w-2 h-2 bg-royal-gold rounded-full animate-bounce" style={{animationDelay:'0s'}}></span>
                    <span className="w-2 h-2 bg-royal-gold rounded-full animate-bounce" style={{animationDelay:'0.2s'}}></span>
                    <span className="w-2 h-2 bg-royal-gold rounded-full animate-bounce" style={{animationDelay:'0.4s'}}></span>
                  </span>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Streaming message */}
          {streamingMessage && (
            <motion.div
              key="streaming-message"
              initial={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: 20 }}
              transition={{ duration: 0.25 }}
              className="flex w-full justify-start"
            >
              <div className="flex items-end gap-2">
                <div className="w-8 h-8 bg-royal-gold rounded-full flex items-center justify-center shadow-sm">
                  <img src="/assets/icons/teacup.svg" alt="Tasse de Thé Royal" className="w-5 h-5" />
                </div>
                <div className="rounded-2xl px-4 py-2 font-raleway text-base text-royal-purple max-w-[80vw] md:max-w-lg bg-gradient-to-r from-royal-champagne/80 to-royal-gold/40 border-2 border-royal-gold/30 shadow-royal">
                  {streamingMessage}
                  <span className="ml-2 animate-pulse text-royal-gold">...</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

const ChatInputBar: React.FC<{
  inputValue: string;
  setInputValue: (v: string) => void;
  onSend: () => void;
  isTyping: boolean;
}> = ({ inputValue, setInputValue, onSend, isTyping }) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isTyping && inputValue.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-royal-purple/20 backdrop-blur-sm border-t border-royal-gold/20 p-4 z-50">
      <div className="max-w-2xl mx-auto flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écris ton message ici..."
            className="w-full px-4 py-3 pr-12 rounded-2xl bg-royal-purple/40 border-2 border-royal-gold/30 text-royal-pearl placeholder-royal-pearl/50 font-raleway resize-none focus:outline-none focus:border-royal-gold focus:ring-2 focus:ring-royal-gold/20 transition-all duration-200"
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
        </div>
        <button
          onClick={onSend}
          disabled={isTyping || !inputValue.trim()}
          className="px-6 py-3 bg-royal-gold text-royal-purple rounded-2xl font-bold font-raleway hover:bg-royal-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-golden"
        >
          {isTyping ? 'Envoi...' : 'Envoyer'}
        </button>
      </div>
    </div>
  );
};

const SideNavButtons: React.FC = () => {
  return (
    <div className="flex justify-center gap-4 mb-4">
      <button className="px-4 py-2 bg-royal-purple/60 text-royal-pearl rounded-lg font-medium hover:bg-royal-purple/80 transition-colors border border-royal-gold/30">
        Nouvelle conversation
      </button>
      <button className="px-4 py-2 bg-royal-purple/60 text-royal-pearl rounded-lg font-medium hover:bg-royal-purple/80 transition-colors border border-royal-gold/30">
        Historique
      </button>
    </div>
  );
};

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Bienvenue, ma chère âme. Je suis la Reine-Mère, ta confidente et guide spirituelle. Je suis là pour t'écouter, partager ma sagesse, et t'accompagner dans ton cheminement. Qu'aimerais-tu explorer aujourd'hui ?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setStreamingMessage('');

    try {
      const currentMessages = [...messages, userMessage];
      let streamingResponse = '';
      
      const handleChunk = (chunk: StreamChunk) => {
        if (chunk.type === 'chunk' && chunk.content) {
          streamingResponse += chunk.content;
          // Add a small delay before showing streaming to make typing indicator visible
          setTimeout(() => {
            setStreamingMessage(streamingResponse);
          }, 500);
        } else if (chunk.type === 'complete') {
          const botMessage: Message = {
            id: Date.now().toString(),
            content: chunk.fullMessage || streamingResponse,
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botMessage]);
          setStreamingMessage('');
          setIsTyping(false);
        } else if (chunk.type === 'error') {
          const errorMessage: Message = {
            id: Date.now().toString(),
            content: chunk.fallbackMessage || chunk.error || 'Une erreur est survenue.',
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
          setStreamingMessage('');
          setIsTyping(false);
        }
      };

      await chatService.sendMessageStream(currentMessages, handleChunk);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add fallback message when chat bot isn't working
      const fallbackMessage: Message = {
        id: Date.now().toString(),
        content: "Désolée, ma chère. Il semble que je sois temporairement indisponible. Je suis en train de me reposer pour mieux te servir. Reviens bientôt, et nous pourrons continuer notre conversation royale. En attendant, tu peux explorer tes cartes ou faire le quiz pour découvrir ton type de Queen ! ✨👑",
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      setIsTyping(false);
      setStreamingMessage('');
    }
  };

  const copyMessage = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
      <SideNavButtons />
      <ChatMessages
        messages={messages}
        streamingMessage={streamingMessage}
        isTyping={isTyping}
        copiedMessageId={copiedMessageId}
        onCopy={copyMessage}
        messagesEndRef={messagesEndRef}
      />
      <ChatInputBar
        inputValue={inputValue}
        setInputValue={setInputValue}
        onSend={handleSendMessage}
        isTyping={isTyping}
      />
    </div>
  );
};

export default ChatPage;