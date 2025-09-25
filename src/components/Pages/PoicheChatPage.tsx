import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from "react-markdown";
import {
  PaperAirplaneIcon,
  EllipsisHorizontalIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

// Custom icon component for Unicode U+26E8 (Black Cross On Shield)
const BlackCrossOnShieldIcon = ({ className = "" }: { className?: string }) => (
  <span
    className={`inline-block ${className} text-[20px] leading-[20px]`}
    role="img"
    aria-label="Black Cross On Shield"
  >
    {"\u26E8"}
  </span>
);
import {
  chatService,
  type Message,
  type StreamChunk,
  type ChatSessionSummary,
  type ChatSessionWithMessages,
} from "../../services/chatService";

const PoicheChatPage = () => {
  // Streaming support detection
  const [streamingSupported, setStreamingSupported] = useState(true);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      typeof window.ReadableStream === "undefined"
    ) {
      setStreamingSupported(false);
    }
  }, []);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Tire pas tout de suite, ma Queen. Avant de piger, regarde bien le jeu…\n\nIci, je mets la lumière sur **lui**, pas sur toi. Je décode son profil, je lève les drapeaux 🚩🟡✅, je nomme les risques et les moves archétypaux. C'est un spotlight : je braque le faisceau, je dis ce que je vois.\n\nTu as trois façons de jouer :\n   1️⃣ **Le Hint rapide** → un message, une situation, et je te dis vert, jaune ou rouge.\n   2️⃣ **Le Sniff intuitif** → tu veux juste valider ton gut feeling, et je te dis ce que ça sent.\n   3️⃣ **Le Portrait complet** → je t'amène plus loin avec au moins 15 questions pour révéler sa carte exacte.\n\nAlors, ma Queen… choisis : 1, 2 ou 3 ?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [openShareMenuId, setOpenShareMenuId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const streamingTimeoutRef = useRef<number | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const firstBotMessageId = messages.find((m) => !m.isUser)?.id;

  useEffect(() => {
    return () => {
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
      }
    };
  }, []);

  // Close share menu on outside click
  useEffect(() => {
    const handleDocClick = () => setOpenShareMenuId(null);
    document.addEventListener("click", handleDocClick);
    return () => document.removeEventListener("click", handleDocClick);
  }, []);

  // const scrollToBottom = () => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // };

  const scrollToBottom = () => {
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      const chatContainer = document.querySelector(".chat-messages-container");
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    });
  };

  const handleNewConversation = async () => {
    // Clear any ongoing streaming
    if (streamingTimeoutRef.current) {
      clearTimeout(streamingTimeoutRef.current);
      streamingTimeoutRef.current = null;
    }

    // Reset all state
    setMessages([
      {
        id: "1",
        content:
          "Tire pas tout de suite, ma Queen. Avant de piger, regarde bien le jeu…\n\nIci, je mets la lumière sur **lui**, pas sur toi. Je décode son profil, je lève les drapeaux 🚩🟡✅, je nomme les risques et les moves archétypaux. C'est un spotlight : je braque le faisceau, je dis ce que je vois.\n\nTu as trois façons de jouer :\n   1️⃣ **Le Hint rapide** → un message, une situation, et je te dis vert, jaune ou rouge.\n   2️⃣ **Le Sniff intuitif** → tu veux juste valider ton gut feeling, et je te dis ce que ça sent.\n   3️⃣ **Le Portrait complet** → je t'amène plus loin avec au moins 15 questions pour révéler sa carte exacte.\n\nAlors, ma Queen… choisis : 1, 2 ou 3 ?",
        isUser: false,
        timestamp: new Date(),
      },
    ]);
    setInputValue("");
    setIsTyping(false);
    setStreamingMessage("");
    setOpenShareMenuId(null);
    try {
      const session = await chatService.createSession("poiche");
      const id = (session._id || (session as any).id) as string;
      setCurrentSessionId(id);
    } catch (e) {
      console.error("Failed to create session", e);
    }
  };

  const handleShowHistory = async () => {
    try {
      if (showHistory) {
        setShowHistory(false);
        return;
      }
      const all = await chatService.listSessions();
      const onlyPoiche = all.filter((s) => s.chatType === "poiche");
      setSessions(onlyPoiche);
      setShowHistory(true);
    } catch (e) {
      console.error("Failed to load sessions", e);
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      const session = (await chatService.getSession(
        sessionId
      )) as ChatSessionWithMessages;
      setCurrentSessionId(sessionId);
      const converted: Message[] = session.messages.map((m, idx) => ({
        id: String(idx + 1),
        content: m.content,
        isUser: m.sender === "user",
        timestamp: new Date(m.createdAt || Date.now()),
      }));
      setMessages(converted);
      setShowHistory(false);
      setTimeout(scrollToBottom, 50);
    } catch (e) {
      console.error("Failed to load session messages", e);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await chatService.deleteSession(sessionId);
      // Remove from local state
      setSessions((prev) =>
        prev.filter((s) => {
          const id = (s._id || (s as any).id) as string;
          return id !== sessionId;
        })
      );
      setDeleteConfirmId(null);

      // If we're currently viewing the deleted session, clear it
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([
          {
            id: "1",
            content:
              "Tire pas tout de suite, ma Queen. Avant de piger, regarde bien le jeu…\n\nIci, je mets la lumière sur **lui**, pas sur toi. Je décode son profil, je lève les drapeaux 🚩🟡✅, je nomme les risques et les moves archétypaux. C'est un spotlight : je braque le faisceau, je dis ce que je vois.\n\nTu as trois façons de jouer :\n   1️⃣ **Le Hint rapide** → un message, une situation, et je te dis vert, jaune ou rouge.\n   2️⃣ **Le Sniff intuitif** → tu veux juste valider ton gut feeling, et je te dis ce que ça sent.\n   3️⃣ **Le Portrait complet** → je t'amène plus loin avec au moins 15 questions pour révéler sa carte exacte.\n\nAlors, ma Queen… choisis : 1, 2 ou 3 ?",
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (e) {
      console.error("Failed to delete session", e);
      setDeleteConfirmId(null);
    }
  };

  const buildShareLinks = (text: string) => {
    const pageUrl = encodeURIComponent(window.location.href);
    const encoded = encodeURIComponent(text);
    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}&quote=${encoded}`,
      x: `https://twitter.com/intent/tweet?text=${encoded}&url=${pageUrl}`,
      messenger: `https://www.messenger.com/t/?link=${pageUrl}`,
      instagram: `https://www.instagram.com/?url=${pageUrl}`,
    };
  };

  const onShareClick = async (messageId: string, text: string) => {
    const nav = navigator as any;
    if (nav?.share) {
      try {
        await nav.share({
          title: "Queen de Q",
          text,
          url: window.location.href,
        });
        return;
      } catch (e) {
        // ignore and show fallback menu
      }
    }
    setOpenShareMenuId((prev) => (prev === messageId ? null : messageId));
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    // Immediately update UI for better responsiveness
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    setStreamingMessage("");
    setTimeout(scrollToBottom, 50);

    try {
      // Handle session creation in background if needed
      let sessionIdToUse: string | undefined = currentSessionId ?? undefined;
      if (!sessionIdToUse) {
        try {
          const session = await chatService.createSession("poiche");
          sessionIdToUse = session.id ?? session._id ?? undefined;
          if (sessionIdToUse) setCurrentSessionId(sessionIdToUse);
        } catch (error) {
          console.warn("Failed to create session, continuing without session ID:", error);
        }
      }

      const currentMessages = [...messages, userMessage];
      let streamingResponse = "";

      const handleChunk = (chunk: StreamChunk) => {
        if (chunk.type === "chunk" && chunk.content) {
          streamingResponse += chunk.content;
          // Clear any existing timeout
          if (streamingTimeoutRef.current) {
            window.clearTimeout(streamingTimeoutRef.current);
          }
          // Add a small delay before showing streaming to make typing indicator visible
          streamingTimeoutRef.current = window.setTimeout(() => {
            setStreamingMessage(streamingResponse);
          }, 100);
        } else if (chunk.type === "complete") {
          // Clear any pending timeout
          if (streamingTimeoutRef.current) {
            window.clearTimeout(streamingTimeoutRef.current);
            streamingTimeoutRef.current = null;
          }
          // Clear streaming message first to avoid duplication
          setStreamingMessage("");
          setIsTyping(false);

          const botMessage: Message = {
            id: Date.now().toString(),
            content: chunk.fullMessage || streamingResponse,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);
          setTimeout(scrollToBottom, 50); // Reduced delay for better responsiveness
        } else if (chunk.type === "error") {
          // Clear any pending timeout
          if (streamingTimeoutRef.current) {
            window.clearTimeout(streamingTimeoutRef.current);
            streamingTimeoutRef.current = null;
          }
          const errorMessage: Message = {
            id: Date.now().toString(),
            content:
              chunk.fallbackMessage ||
              chunk.error ||
              "Une erreur est survenue.",
            isUser: false,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          setStreamingMessage("");
          setIsTyping(false);
        }
      };

      // Use poiche chat type for this page
      await chatService.sendMessageStream(
        currentMessages,
        handleChunk,
        "poiche",
        sessionIdToUse
      );
    } catch (error) {
      console.error("Error sending message:", error);

      // Add fallback message when chat bot isn't working
      const fallbackMessage: Message = {
        id: Date.now().toString(),
        content:
          "Pardonne-moi, ma Queen. Il semble que je sois temporairement indisponible. Mon intuition a besoin de se reposer. Reviens bientôt, et nous pourrons reprendre ta lecture royale. En attendant, tu peux explorer tes cartes ou faire le quiz pour découvrir ton type de Queen ! ✨👑",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, fallbackMessage]);
      setIsTyping(false);
      setStreamingMessage("");
    }
  };

  return (
    <div className="-mt-16 -mx-6 -mb-32  lg:-mt-16 lg:-mr-16 lg:-mb-32 lg:-ml-16 overflow-hidden">
      {!streamingSupported && (
        <div className="bg-yellow-100 text-yellow-900 p-4 rounded mb-4 text-center">
          Ce navigateur ne supporte pas le streaming des réponses. Veuillez
          utiliser un navigateur moderne ou passer en mode chat standard.
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col pt-12 lg:pt-1 overflow-hidden h-[93dvh] lg:h-dvh"
      >
        {/* Bot identifier banner */}
        <div className="flex-shrink-0 p-2">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center py-2 px-4 bg-[#4b2e43] border-2 border-royal-gold/30 rounded-2xl shadow-royal">
              <div className="flex items-center gap-4 [&_*]:!text-[#d6ae60]">
                <BlackCrossOnShieldIcon className="text-[#d6ae60] flex-shrink-0" />
                <div className="flex flex-col items-center">
                  <span className="text-lg md:text-xl font-bold">
                    Ta Pioche
                  </span>
                  <span className="text-xs md:text-sm opacity-80">
                    Est-ce que tu dates un 2 de pique ou un king
                  </span>
                </div>
              </div>
            </div>
            {showHistory && (
              <div className="mt-3 bg-royal-purple/30 border border-royal-gold/30 rounded-xl p-3 max-h-60 overflow-y-auto">
                {sessions.length === 0 ? (
                  <div className="text-sm text-royal-pearl/70">
                    Aucune conversation
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {sessions.map((s) => {
                      const id = (s._id || (s as any).id) as string;
                      return (
                        <li key={id}>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => loadSession(id)}
                              className="flex-1 text-left px-3 py-2 rounded-lg bg-royal-purple/40 hover:bg-royal-purple/60 border border-royal-gold/30 text-sm"
                            >
                              {s.title || "Conversation"}
                              <span className="ml-2 text-xs opacity-70">
                                {new Date(
                                  s.updatedAt || s.createdAt || Date.now()
                                ).toLocaleString()}
                              </span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(
                                  deleteConfirmId === id ? null : id
                                );
                              }}
                              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 text-red-400 hover:text-red-300 transition-colors"
                              title="Supprimer la conversation"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                          {deleteConfirmId === id && (
                            <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                              <p className="text-xs text-red-300 mb-2">
                                Êtes-vous sûr de vouloir supprimer cette
                                conversation ?
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteSession(id);
                                  }}
                                  className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                                >
                                  Supprimer
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmId(null);
                                  }}
                                  className="px-3 py-1 bg-royal-purple/60 text-royal-pearl rounded text-xs hover:bg-royal-purple/80 transition-colors"
                                >
                                  Annuler
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Top buttons section - Always visible */}
        <div className="flex-shrink-0 p-1 mt-1">
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-row justify-center gap-2">
              <button
                onClick={handleNewConversation}
                className="flex-1 min-w-0 px-3 sm:px-6 py-2.5 sm:py-3 bg-royal-purple/60 text-royal-pearl rounded-xl 
                font-medium hover:bg-royal-purple/80 transition-all duration-200 border border-royal-gold/30 
                backdrop-blur-sm shadow-soft text-sm sm:text-base whitespace-nowrap overflow-hidden text-ellipsis"
              >
                <span className="hidden sm:inline">Nouvelle conversation</span>
                <span className="sm:hidden">Nouveau</span>
              </button>
              <button
                onClick={handleShowHistory}
                className="flex-1 min-w-0 px-3 sm:px-6 py-2.5 sm:py-3 bg-royal-purple/60 text-royal-pearl rounded-xl 
                font-medium hover:bg-royal-purple/80 transition-all duration-200 border border-royal-gold/30 
                backdrop-blur-sm shadow-soft text-sm sm:text-base whitespace-nowrap overflow-hidden text-ellipsis"
              >
                Historique
              </button>
            </div>
          </div>
        </div>

        {/* Chat content area */}
        <div className="flex-1 overflow-hidden p-1">
          <div className="max-w-5xl mx-auto h-full">
            <div className="h-full">
              {/* Chat Messages */}
              <div className="h-full px-3 sm:px-6 md:px-8 overflow-y-auto scrollbar-hide chat-messages-container">
                <div className="max-w-2xl mx-auto flex flex-col gap-4 py-4">
                  <AnimatePresence initial={false}>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        exit={{ opacity: 0, translateY: 20 }}
                        transition={{ duration: 0.25 }}
                        className={`flex w-full ${
                          message.isUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`flex items-end gap-2 ${
                            message.isUser ? "flex-row-reverse" : ""
                          }`}
                        >
                          {/* Bubble */}
                          <div
                            className={`relative rounded-2xl px-4 py-2 font-raleway text-sm md:text-base whitespace-pre-line break-words max-w-[80vw] md:max-w-lg
                            ${
                              message.isUser
                                ? "bg-gradient-to-r from-royal-purple/90 to-royal-gold/30 text-white border-2 border-royal-gold shadow-golden"
                                : "bg-cabinet-aubergine text-royal-pearl border-2 border-royal-gold/30 shadow-royal"
                            }
                          `}
                          >
                            <ReactMarkdown
                              components={{
                                strong: ({ children }) => (
                                  <strong className="font-bold text-white">
                                    {children}
                                  </strong>
                                ),
                                p: ({ children }) => (
                                  <p className="mb-2 last:mb-0">{children}</p>
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                            {/* Share menu for bot messages (hidden for first bot message) */}
                            {!message.isUser &&
                              message.id !== firstBotMessageId && (
                                <div className="absolute -bottom-2 -right-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onShareClick(message.id, message.content);
                                    }}
                                    className="w-8 h-8 rounded-full bg-royal-gold/80 hover:bg-royal-gold text-royal-purple border border-royal-gold/60 shadow-golden flex items-center justify-center"
                                    aria-label="Partager"
                                  >
                                    <EllipsisHorizontalIcon className="w-5 h-5" />
                                  </button>
                                  {openShareMenuId === message.id && (
                                    <div className="absolute bottom-12 right-0 w-44 bg-royal-purple text-royal-pearl border border-royal-gold/30 rounded-lg shadow-royal p-2 space-y-1 z-50 max-h-56 overflow-auto">
                                      {(() => {
                                        const links = buildShareLinks(
                                          message.content
                                        );
                                        return (
                                          <>
                                            <a
                                              href={links.facebook}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="block px-2 py-1 rounded hover:bg-royal-purple/60 text-sm"
                                            >
                                              Facebook
                                            </a>
                                            <a
                                              href={links.x}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="block px-2 py-1 rounded hover:bg-royal-purple/60 text-sm"
                                            >
                                              X
                                            </a>
                                            <a
                                              href={links.messenger}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="block px-2 py-1 rounded hover:bg-royal-purple/60 text-sm"
                                            >
                                              Messenger
                                            </a>
                                            <a
                                              href={links.instagram}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="block px-2 py-1 rounded hover:bg-royal-purple/60 text-sm"
                                            >
                                              Instagram
                                            </a>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
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
                        <div className="flex items-end">
                          <div className="rounded-2xl px-4 py-2 font-raleway text-sm md:text-base text-cabinet-ink max-w-[80vw] md:max-w-lg flex items-center gap-2 bg-cabinet-parchment border-2 border-royal-gold/30 shadow-royal">
                            <span className="flex gap-1">
                              <span
                                className="w-2 h-2 bg-royal-gold rounded-full animate-bounce"
                                style={{ animationDelay: "0s" }}
                              ></span>
                              <span
                                className="w-2 h-2 bg-royal-gold rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></span>
                              <span
                                className="w-2 h-2 bg-royal-gold rounded-full animate-bounce"
                                style={{ animationDelay: "0.4s" }}
                              ></span>
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
                        <div className="flex items-end">
                          <div className="rounded-2xl px-4 py-2 font-raleway text-sm md:text-base text-cabinet-ink max-w-[80vw] md:max-w-lg bg-cabinet-parchment border-2 border-royal-gold/30 shadow-royal">
                            <ReactMarkdown
                              components={{
                                strong: ({ children }) => (
                                  <strong className="font-bold text-white">
                                    {children}
                                  </strong>
                                ),
                                p: ({ children }) => (
                                  <p className="mb-2 last:mb-0">{children}</p>
                                ),
                              }}
                            >
                              {streamingMessage}
                            </ReactMarkdown>
                            <span className="ml-2 animate-pulse text-royal-gold">
                              ...
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Input Component - Always visible */}
        <div className="flex-shrink-0 m-1 bg-royal-purple/20 backdrop-blur-sm border-t border-royal-gold/20 p-2 rounded-2xl shadow-soft">
          <div className="max-w-2xl mx-auto flex items-stretch gap-3">
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ton message..."
                className="w-full h-12 px-4 py-3 pr-12 rounded-2xl bg-royal-purple/40 border-2
                border-royal-gold/30 text-royal-pearl placeholder-royal-pearl/50 font-raleway resize-none
                focus:outline-none focus:border-royal-gold focus:ring-2 focus:ring-royal-gold/20 transition-all
                duration-200 overflow-hidden scrollbar-hide flex items-center text-sm md:text-base"
                rows={1}
                style={{ lineHeight: "1.2" }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={isTyping || !inputValue.trim()}
              className="px-4 lg:px-6 h-12 bg-royal-gold text-royal-purple rounded-2xl font-bold font-raleway
              hover:bg-royal-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
              shadow-golden flex items-center justify-center"
            >
              <span className="hidden lg:inline">
                {isTyping ? "Envoi..." : "Envoyer"}
              </span>
              <PaperAirplaneIcon className="w-5 h-5 lg:hidden" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PoicheChatPage;