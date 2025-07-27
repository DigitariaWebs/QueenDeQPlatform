import React, { useState, useRef, useEffect } from 'react';
import type { RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatService, type Message, type StreamChunk } from '../../services/chatService';

// ChatLayout: full height, flex column, input fixed at bottom
const ChatLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div
      className="min-h-screen w-full flex flex-col z-0 mb"
      style={{
        background: 'linear-gradient(135deg, #3B1E50 0%, #5A2A6D 50%, #4B2E43 100%)'
      }}
    >
      <div className="flex items-center justify-center w-full h-full min-h-screen">
        <div className="w-full max-w-2xl h-full min-h-screen flex flex-col flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

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
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 pb-4" style={{scrollbarGutter:'stable', maxHeight: 'calc(100vh - 90px)'}}>
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
                <div className="rounded-2xl px-4 py-2 font-raleway text-base text-royal-purple max-w-[80vw] md:max-w-lg">
                  {streamingMessage}
                  <span className="ml-2 animate-pulse text-royal-gold">...</span>
                </div>
              </div>
            </motion.div>
          )}
          {/* Typing indicator */}
          {isTyping && !streamingMessage && (
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
                <div className="rounded-2xl px-4 py-2 font-raleway text-base text-royal-purple max-w-[80vw] md:max-w-lg flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-2 h-2 bg-royal-gold rounded-full animate-bounce" style={{animationDelay:'0s'}}></span>
                    <span className="w-2 h-2 bg-royal-gold rounded-full animate-bounce" style={{animationDelay:'0.2s'}}></span>
                    <span className="w-2 h-2 bg-royal-gold rounded-full animate-bounce" style={{animationDelay:'0.4s'}}></span>
                  </span>
                  <span className="text-xs text-royal-gold/80">La Reine-Mère écrit...</span>
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

// ChatInputBar: fixed at bottom, shadow divider
const ChatInputBar: React.FC<{
  inputValue: string;
  setInputValue: (v: string) => void;
  onSend: () => void;
  isTyping: boolean;
}> = ({ inputValue, setInputValue, onSend, isTyping }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (!isTyping) {
      inputRef.current?.focus();
    }
  }, [isTyping]);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
      // focus will be restored by useEffect after isTyping becomes false
    }
  };
  return (
    <div className="sticky bottom-0 left-0 w-full bg-white backdrop-blur-lg border-t rounded-full border-royal-gold/10 shadow-lg mb-3 z-20">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-end gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Décrivez votre rêve à la Reine-Mère..."
          className="chat-input-field flex-1 py-3 px-4 rounded-full bg-white text-royal-purple placeholder-royal-purple/60 font-raleway focus:outline-none focus:ring-2 focus:ring-royal-gold/40 transition-all duration-200 shadow-sm"
          disabled={isTyping}
        />
        <button
          onClick={onSend}
          disabled={!inputValue.trim() || isTyping}
          className="w-12 h-12 bg-gradient-to-r from-royal-gold to-royal-champagne hover:from-royal-gold/90 hover:to-royal-champagne/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Bienvenue, ma chère âme. Je suis la Reine-Mère, ta confidente et guide spirituelle. Je suis là pour t'écouter, partager ma sagesse, et t'accompagner dans ton cheminement. Que souhaites-tu explorer aujourd'hui ?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsTyping(true);
    setStreamingMessage('');
    const currentMessages = [...messages, newMessage];
    let streamingResponse = '';
    const streamingId = (Date.now() + 1).toString();
    const handleChunk = (chunk: StreamChunk) => {
      if (chunk.type === 'chunk' && chunk.content) {
        streamingResponse += chunk.content;
        setStreamingMessage(() => streamingResponse);
      } else if (chunk.type === 'complete') {
        const finalMessage: Message = {
          id: streamingId,
          content: chunk.fullMessage || streamingResponse,
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, finalMessage]);
        setStreamingMessage('');
        setIsTyping(false);
      } else if (chunk.type === 'error') {
        const errorMessage: Message = {
          id: streamingId,
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
  };

  const copyMessage = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  return (
    <ChatLayout>
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
    </ChatLayout>
  );
};

export default ChatPage;