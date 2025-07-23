import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Book, Heart, Eye, Trash2 } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';

interface JournalEntry {
  id: string;
  date: string;
  archetype?: string;
  title: string;
  content: string;
  mood: 'positive' | 'neutral' | 'negative' | 'reflective';
}

export const Journal: React.FC = () => {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<Partial<JournalEntry>>({
    title: '',
    content: '',
    mood: 'neutral'
  });
  const [isWriting, setIsWriting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Load entries from localStorage on mount
  useEffect(() => {
    const savedEntries = localStorage.getItem('journal-entries');
    if (savedEntries) {
      try {
        setEntries(JSON.parse(savedEntries));
      } catch (error) {
        console.error('Error loading journal entries:', error);
      }
    }
  }, []);

  // Save entries to localStorage
  const saveEntries = (newEntries: JournalEntry[]) => {
    localStorage.setItem('journal-entries', JSON.stringify(newEntries));
    setEntries(newEntries);
    showSaveToast();
  };

  const showSaveToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const saveEntry = () => {
    if (!currentEntry.title || !currentEntry.content) return;

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('fr-FR'),
      title: currentEntry.title,
      content: currentEntry.content,
      mood: currentEntry.mood || 'neutral',
      archetype: currentEntry.archetype
    };

    const newEntries = [newEntry, ...entries];
    saveEntries(newEntries);
    
    setCurrentEntry({ title: '', content: '', mood: 'neutral' });
    setIsWriting(false);
  };

  const deleteEntry = (id: string) => {
    const newEntries = entries.filter(entry => entry.id !== id);
    saveEntries(newEntries);
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'positive': return '✨';
      case 'negative': return '💙';
      case 'reflective': return '🤔';
      default: return '📝';
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'positive': return 'from-rose-champagne to-antique-rose';
      case 'neutral': return 'from-smoky-gold to-patina-gold';
      case 'reflective': return 'from-royal-purple to-vintage-aubergine';
      case 'melancholic': return 'from-inked-indigo to-amber-smoke';
      default: return 'from-velvet-black to-ink-black';
    }
  };

  return (
    <main className="min-h-screen pt-4 sm:pt-8 md:pt-12 lg:pt-24 xl:pt-32 pb-4 sm:pb-8 md:pb-12 lg:pb-16 xl:pb-20 px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-5 lg:mb-6">
            <Book className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-royal-purple" />
            <h1 className="font-playfair font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-royal-purple">
              {t('journal.title')}
            </h1>
          </div>
          <p className="text-royal-purple/70 text-base sm:text-lg md:text-xl lg:text-2xl max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto font-raleway px-2 sm:px-4 md:px-6">
            {t('journal.subtitle')}
          </p>
        </motion.div>

        {/* New Entry Section */}
        {!isWriting ? (
          <motion.div
            className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 lg:p-10 shadow-lg border border-rose-champagne/20 mb-6 sm:mb-8 md:mb-10 lg:mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <button
              onClick={() => setIsWriting(true)}
              className="w-full p-3 sm:p-4 md:p-5 lg:p-6 text-left bg-gradient-to-r from-royal-purple/10 to-rose-champagne/10 hover:from-royal-purple/20 hover:to-rose-champagne/20 rounded-lg sm:rounded-xl transition-all duration-300 border border-royal-purple/20 group"
            >
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-royal-purple/20 rounded-full flex items-center justify-center group-hover:bg-royal-purple/30 transition-colors">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-royal-purple" />
                </div>
                <span className="text-royal-purple/70 group-hover:text-royal-purple transition-colors font-raleway text-sm sm:text-base md:text-lg lg:text-xl">
                  {t('journal.newEntry')}
                </span>
              </div>
            </button>
          </motion.div>
        ) : (
          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 md:p-10 lg:p-12 shadow-lg border border-rose-champagne/20 mb-8 md:mb-10 lg:mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="space-y-4">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-royal-purple mb-2 font-raleway">
                  {t('journal.entryTitle')}
                </label>
                <input
                  type="text"
                  value={currentEntry.title || ''}
                  onChange={(e) => setCurrentEntry({ ...currentEntry, title: e.target.value })}
                  placeholder={t('journal.titlePlaceholder')}
                  className="w-full p-3 border border-rose-champagne/30 rounded-lg focus:ring-2 focus:ring-royal-purple/20 focus:border-royal-purple/40 bg-white/70 transition-colors"
                />
              </div>

              {/* Archetype Input */}
              <div>
                <label className="block text-sm font-medium text-royal-purple mb-2 font-raleway">
                  {t('journal.archetype')} ({t('journal.optional')})
                </label>
                <input
                  type="text"
                  value={currentEntry.archetype || ''}
                  onChange={(e) => setCurrentEntry({ ...currentEntry, archetype: e.target.value })}
                  placeholder={t('journal.archetypePlaceholder')}
                  className="w-full p-3 border border-rose-champagne/30 rounded-lg focus:ring-2 focus:ring-royal-purple/20 focus:border-royal-purple/40 bg-white/70 transition-colors"
                />
              </div>

              {/* Mood Selection */}
              <div>
                <label className="block text-sm sm:text-base md:text-lg font-medium text-royal-purple mb-2 sm:mb-3 font-raleway">
                  {t('journal.mood')}
                </label>
                <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3 md:gap-4">
                  {[
                    { value: 'positive', label: t('journal.moodPositive'), emoji: '✨' },
                    { value: 'neutral', label: t('journal.moodNeutral'), emoji: '📝' },
                    { value: 'reflective', label: t('journal.moodReflective'), emoji: '🤔' },
                    { value: 'melancholic', label: t('journal.moodMelancholic'), emoji: '💙' }
                  ].map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => setCurrentEntry({ ...currentEntry, mood: mood.value as any })}
                      className={`p-2 sm:p-3 md:p-4 rounded-lg border transition-all text-sm sm:text-base md:text-lg flex-1 sm:flex-none ${
                        currentEntry.mood === mood.value
                          ? 'border-royal-purple bg-royal-purple/10 text-royal-purple'
                          : 'border-rose-champagne/30 hover:border-royal-purple/40 text-royal-purple/60'
                      }`}
                    >
                      <span className="mr-1 sm:mr-2">{mood.emoji}</span>
                      <span className="hidden sm:inline">{mood.label}</span>
                      <span className="sm:hidden">{mood.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Textarea */}
              <div>
                <label className="block text-sm font-medium text-royal-purple mb-2 font-raleway">
                  {t('journal.reflection')}
                </label>
                <textarea
                  value={currentEntry.content || ''}
                  onChange={(e) => setCurrentEntry({ ...currentEntry, content: e.target.value })}
                  placeholder={t('journal.contentPlaceholder')}
                  rows={8}
                  className="w-full p-3 border border-rose-champagne/30 rounded-lg focus:ring-2 focus:ring-royal-purple/20 focus:border-royal-purple/40 bg-white/70 resize-none transition-colors"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
                <button
                  onClick={saveEntry}
                  disabled={!currentEntry.title || !currentEntry.content}
                  className="flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 bg-royal-purple text-white rounded-lg hover:bg-royal-purple/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-raleway text-sm sm:text-base md:text-lg"
                >
                  <Save className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  {t('journal.save')}
                </button>
                <button
                  onClick={() => {
                    setCurrentEntry({ title: '', content: '', mood: 'neutral' });
                    setIsWriting(false);
                  }}
                  className="px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 border border-rose-champagne/30 text-royal-purple rounded-lg hover:bg-rose-champagne/10 transition-colors font-raleway text-sm sm:text-base md:text-lg"
                >
                  {t('journal.cancel')}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Entries List */}
        <motion.div
          className="space-y-4 sm:space-y-6 md:space-y-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {entries.length === 0 ? (
            <div className="text-center py-12 sm:py-16 md:py-20 lg:py-24">
              <Eye className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 text-royal-purple/30 mx-auto mb-4 sm:mb-6 md:mb-8" />
              <h3 className="font-cinzel font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl text-royal-purple/60 mb-2 sm:mb-3 md:mb-4">
                {t('journal.noEntries')}
              </h3>
              <p className="text-royal-purple/40 font-raleway text-base sm:text-lg md:text-xl">
                {t('journal.startWriting')}
              </p>
            </div>
          ) : (
            entries.map((entry) => (
              <motion.div
                key={entry.id}
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 sm:p-8 md:p-10 lg:p-12 shadow-lg border border-rose-champagne/20 group hover:shadow-xl transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex justify-between items-start mb-4 sm:mb-6 md:mb-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-r ${getMoodColor(entry.mood)} rounded-full flex items-center justify-center text-xs sm:text-sm md:text-base`}>
                        {getMoodIcon(entry.mood)}
                      </div>
                      <h3 className="font-cinzel font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl text-royal-purple">
                        {entry.title}
                      </h3>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm sm:text-base md:text-lg text-royal-purple/60 font-raleway">
                      <span>{entry.date}</span>
                      {entry.archetype && (
                        <span className="bg-royal-purple/10 px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full text-xs sm:text-sm md:text-base">
                          {entry.archetype}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 sm:p-3 md:p-4 text-royal-purple/40 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  </button>
                </div>
                
                <p className="text-royal-purple/80 leading-relaxed whitespace-pre-wrap font-raleway text-sm sm:text-base md:text-lg lg:text-xl">
                  {entry.content}
                </p>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>

      {/* Save Toast */}
      {showToast && (
        <motion.div
          className="fixed bottom-6 right-6 bg-royal-purple text-white px-4 py-2 rounded-lg shadow-lg font-raleway"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
        >
          {t('journal.saved')}
        </motion.div>
      )}
    </main>
  );
};