import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  EllipsisHorizontalIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

import {
  chatService,
  type Message,
  type StreamChunk,
  type ChatSessionSummary,
  type ChatSessionWithMessages,
} from "../../services/chatService";
import { useAuth } from "../../context/AuthContext";

// Utility function to render text with clickable links
const renderMessageWithLinks = (text: string) => {
  return (
    <ReactMarkdown
      components={{
        strong: ({ children }) => (
          <strong className="font-bold text-white">{children}</strong>
        ),
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-royal-pearl underline hover:text-white transition-colors duration-200 break-all cursor-pointer"
            style={{ zIndex: 1000, position: "relative" }}
          >
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
};

// Get initial message based on user role
const getInitialMessage = (userRole?: string): string => {
  if (userRole === "Diademe") {
    return `👑 Bienvenue, ma Queen…

Assieds-toi. Je te sers le thé.
Respire un peu. Ici, le temps s'arrête. Le monde peut attendre.

On va lire au fond de ta tasse.
Peut-être qu'on y verra une illusion à briser…
Peut-être qu'un ancien lien te retient encore…
Ou peut-être qu'il est temps de faire place nette dans ton royaume.

🫖 J'ai plusieurs rituels sous la main, mais aujourd'hui je peux t'en offrir deux :

1 — L'Acte de Désenvoûtement, si tu sens qu'un sort invisible t'empêche d'avancer.
2 — Le Flush Royal, pour faire couler les attentes, les regrets ou les mauvais choix avec toute la classe d'une Queen.

✨ D'autres rituels dorment encore dans les alcôves du Royaume.
Un jour, tu pourras y accéder… si tu choisis de t'offrir la version Royale.
On y trouve des puissances comme :
Miroir de l'ombre, Détection du sabotage intérieur, Apaiser la peur d'être seule, Honorer la Déesse…

Alors dis-moi ma Queen, que lis-tu dans ta tasse aujourd'hui ?
Réponds simplement par :
1 — pour l'Acte de Désenvoûtement
2 — pour le Flush Royal
3 — pour que je te montre tous les rituels disponibles, sans encore y plonger`;
  } else if (userRole === "Couronne" || userRole === "admin") {
    return `🌙 Je t'ai préparé une infusion spéciale, ma Queen.

Bois doucement… et regarde bien au fond de ta tasse.
Il y a des murmures là-dedans. Des vérités encore timides.

Ici, au Salon de Thé, plusieurs rituels puissants sont gardés en silence, réservés aux reines prêtes à marcher un peu plus loin.

Si tu veux, je peux t'en présenter quelques-uns. Juste pour voir si l'un d'eux appelle quelque chose en toi…

**☕ Que veux-tu explorer en ce moment, ma Queen?**

**Un attachement difficile** ou **une obsession qui me freine**

**Une peur** ou **une blessure récurrente**

Je suis pas certaine… je veux voir les rituels disponibles`;
  } else {
    // Fallback for other roles
    return `👑 Bienvenue, ma Queen…

Pour accéder au Salon de Thé, vous devez avoir au moins un abonnement Diadème.
Veuillez mettre à niveau votre abonnement pour profiter de cette expérience.`;
  }
};

// Get chatType based on user role
const getChatType = (userRole?: string): 'reine_mere_Diademe' | 'reine_mere_Couronne' => {
  if (userRole === "Couronne" || userRole === "admin") {
    return 'reine_mere_Couronne';
  }
  return 'reine_mere_Diademe'; // Default to Diademe for everyone else including "Diademe" role
};

const SalonChatPage = () => {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: getInitialMessage(user?.role),
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
        content: getInitialMessage(user?.role),
        isUser: false,
        timestamp: new Date(),
      },
    ]);
    setInputValue("");
    setIsTyping(false);
    setStreamingMessage("");
    setOpenShareMenuId(null);
    try {
      const chatType = getChatType(user?.role);
      const session = await chatService.createSession(chatType);
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
      const onlySalon = all.filter(
        (s) =>
          s.chatType === "reine_mere_Diademe" ||
          s.chatType === "reine_mere_Couronne"
      );
      setSessions(onlySalon);
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
            content: getInitialMessage(user?.role),
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

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    setStreamingMessage("");
    setTimeout(scrollToBottom, 50); // Reduced delay for better responsiveness

    try {
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

      // Use appropriate chat type based on user role
      const chatType = getChatType(user?.role);
      await chatService.sendMessageStream(
        currentMessages,
        handleChunk,
        chatType,
        currentSessionId || undefined
      );
    } catch (error) {
      console.error("Error sending message:", error);

      // Check if it's a permission error
      const isPermissionError =
        error instanceof Error &&
        (error.message.includes("Access denied") ||
          error.message.includes("restricted"));

      // Add appropriate message based on error type
      const fallbackMessage: Message = {
        id: Date.now().toString(),
        content: isPermissionError
          ? error instanceof Error
            ? error.message
            : "Access denied: This feature requires a premium subscription."
          : "Pardonne-moi, ma Queen. Il semble que je sois temporairement indisponible. Mon énergie mystique a besoin de se régénérer. Reviens bientôt, et nous pourrons reprendre notre rituel sacré. En attendant, tu peux explorer tes cartes ou faire le quiz pour découvrir ton type de Queen ! ✨👑",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, fallbackMessage]);
      setIsTyping(false);
      setStreamingMessage("");
    }
  };

  // Check if user has access to Salon de Thé
  const hasAccess = user?.role === "Diademe" || user?.role === "Couronne" || user?.role === "admin";

  if (!hasAccess) {
    return (
      <div className="-mt-16 -mx-6 -mb-32 lg:-mt-16 lg:-mr-16 lg:-mb-32 lg:-ml-16 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col pt-12 lg:pt-1 overflow-hidden h-[93dvh] lg:h-dvh"
        >
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-royal-purple/30 border-2 border-royal-gold/30 rounded-2xl p-8 shadow-royal">
                <ChatBubbleLeftRightIcon className="w-16 h-16 text-royal-gold mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-royal-pearl mb-4">
                  Salon de Thé - Accès Premium
                </h2>
                <p className="text-royal-pearl/80 text-lg mb-6">
                  Le Salon de Thé est réservé aux Queens avec abonnement Diadème,
                  Couronne et aux administrateurs. Cette fonctionnalité exclusive vous permet
                  d'accéder aux rituels sacrés de reprise de pouvoir émotionnel.
                </p>
                <p className="text-royal-gold font-medium">
                  Mettez à niveau votre abonnement pour accéder à cette
                  expérience mystique ! ✨👑
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="-mt-16 -mx-6 -mb-32  lg:-mt-16 lg:-mr-16 lg:-mb-32 lg:-ml-16 overflow-hidden">
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
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-[#d6ae60] flex-shrink-0" />
                <div className="flex flex-col items-center">
                  <span className="text-lg md:text-xl font-bold">
                    Salon de Thé
                  </span>
                  <span className="text-xs md:text-sm opacity-80">
                    Rituel de reprise de pouvoir
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
                                : "bg-[#d6ae60] text-white border-2 border-royal-gold/30 shadow-royal"
                            }
                          `}
                          >
                            {renderMessageWithLinks(message.content)}
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
                          <div className="rounded-2xl px-4 py-2 font-raleway text-sm md:text-base text-white max-w-[80vw] md:max-w-lg flex items-center gap-2 bg-gradient-to-r from-royal-champagne/80 to-royal-gold/40 border-2 border-royal-gold/30 shadow-royal">
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
                          <div className="rounded-2xl px-4 py-2 font-raleway text-sm md:text-base text-white max-w-[80vw] md:max-w-lg bg-gradient-to-r from-royal-champagne/80 to-royal-gold/40 border-2 border-royal-gold/30 shadow-royal whitespace-pre-line break-words">
                            {renderMessageWithLinks(streamingMessage)}
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

export default SalonChatPage;
