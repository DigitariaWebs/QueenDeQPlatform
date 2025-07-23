import { useState, useEffect, useRef, useCallback } from 'react';

interface MusicPlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  isLoading: boolean;
  error: string | null;
}

interface MusicPlayerControls {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unmute: () => void;
}

interface MusicPlayerOptions {
  autoPlay?: boolean;
  targetVolume?: number;
}

export const useMusicPlayer = (
  audioSrc: string = '/audio/Roie Shpigler - Marbles.mp3',
  options: MusicPlayerOptions = {}
) => {
  const { autoPlay = false, targetVolume = 0.10 } = options;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);
  const pendingInteractionRef = useRef<boolean>(false);
  
  const [state, setState] = useState<MusicPlayerState>({
    isPlaying: false,
    isMuted: false,
    volume: targetVolume,
    isLoading: false,
    error: null
  });

  // Initialize audio element
  const initializeAudio = useCallback(() => {
    if (!audioRef.current) {
      // Check if audio element already exists in DOM
      let existingAudio = document.getElementById('bg-audio') as HTMLAudioElement;
      
      if (!existingAudio) {
        existingAudio = document.createElement('audio');
        existingAudio.id = 'bg-audio';
        existingAudio.src = audioSrc;
        existingAudio.loop = true;
        existingAudio.volume = 0.0; // Start silent for fade-in
        existingAudio.preload = 'none'; // Don't preload until needed
        document.body.appendChild(existingAudio);
      }
      
      audioRef.current = existingAudio;
    }
  }, [audioSrc]);

  // Check if user prefers reduced motion or save data
  const shouldAutoMute = useCallback(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = ('connection' in navigator) && (navigator.connection as { saveData?: boolean })?.saveData;
    return prefersReducedMotion || saveData;
  }, []);

  // Check if this is a fresh session (not a refresh)
  const isFreshSession = useCallback(() => {
    // Check if it's a hard refresh (F5)
    if (performance.navigation && performance.navigation.type === 1) {
      return false;
    }
    
    // Check if it's a fresh navigation
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return navigation && navigation.type === 'navigate';
  }, []);

  // Load saved preference from localStorage
  const loadMusicPreference = useCallback(() => {
    const savedPreference = localStorage.getItem('bgMusic');
    return savedPreference === 'on' && !shouldAutoMute();
  }, [shouldAutoMute]);

  // Save preference to localStorage
  const saveMusicPreference = useCallback((isOn: boolean) => {
    localStorage.setItem('bgMusic', isOn ? 'on' : 'off');
  }, []);

  // Fade in volume smoothly
  const fadeInVolume = useCallback(() => {
    if (!audioRef.current) return;
    
    // Clear any existing fade
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }
    
    const startVolume = 0.0;
    const endVolume = targetVolume;
    const duration = 800; // 800ms fade
    const steps = 50; // Number of volume steps
    const stepDuration = duration / steps;
    const volumeStep = (endVolume - startVolume) / steps;
    
    let currentStep = 0;
    audioRef.current.volume = startVolume;
    
    fadeIntervalRef.current = window.setInterval(() => {
      if (!audioRef.current) return;
      
      currentStep++;
      const newVolume = startVolume + (volumeStep * currentStep);
      audioRef.current.volume = Math.min(newVolume, endVolume);
      
      if (currentStep >= steps) {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
        setState(prev => ({ ...prev, volume: endVolume }));
      }
    }, stepDuration);
  }, [targetVolume]);

  // Setup one-time interaction listener for blocked autoplay
  const setupInteractionListener = useCallback(() => {
    const handleInteraction = () => {
      if (pendingInteractionRef.current && audioRef.current) {
        audioRef.current.play()
          .then(() => {
            fadeInVolume();
            pendingInteractionRef.current = false;
          })
          .catch(console.error);
      }
      
      // Remove listeners after first interaction
      document.body.removeEventListener('pointerdown', handleInteraction);
      document.body.removeEventListener('keydown', handleInteraction);
    };
    
    document.body.addEventListener('pointerdown', handleInteraction);
    document.body.addEventListener('keydown', handleInteraction);
  }, [fadeInVolume]);

  // Handle visibility change (auto-pause when tab is hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!audioRef.current) return;

      if (document.visibilityState === 'hidden') {
        if (state.isPlaying) {
          audioRef.current.pause();
        }
      } else if (document.visibilityState === 'visible') {
        const shouldBePlaying = loadMusicPreference();
        if (shouldBePlaying && !state.isPlaying) {
          audioRef.current.play().catch(console.error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.isPlaying, loadMusicPreference]);

  // Handle prefers-reduced-motion changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches && audioRef.current) {
        audioRef.current.pause();
        setState(prev => ({ ...prev, isPlaying: false }));
        saveMusicPreference(false);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [saveMusicPreference]);

  // Initialize on mount
  useEffect(() => {
    initializeAudio();
    
    // Auto-play logic
    if (autoPlay && isFreshSession()) {
      const savedPreference = localStorage.getItem('bgMusic');
      
      // Only auto-play if user hasn't explicitly turned it off
      if (savedPreference !== 'off' && !shouldAutoMute()) {
        setState(prev => ({ ...prev, isLoading: true }));
        
        // Attempt to play immediately
        if (audioRef.current) {
          audioRef.current.play()
            .then(() => {
              fadeInVolume();
              saveMusicPreference(true);
            })
            .catch(() => {
              // If autoplay is blocked, set up interaction listener
              pendingInteractionRef.current = true;
              setupInteractionListener();
              setState(prev => ({ ...prev, isLoading: false }));
            });
        }
      }
    } else {
      // Non-auto-play mode: load saved preference
      const shouldAutoPlay = loadMusicPreference();
      if (shouldAutoPlay) {
        setState(prev => ({ ...prev, isPlaying: true }));
      }
    }
  }, [initializeAudio, loadMusicPreference, autoPlay, isFreshSession, shouldAutoMute, fadeInVolume, saveMusicPreference, setupInteractionListener]);

  // Audio event handlers
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const handlePlay = () => {
      setState(prev => ({ ...prev, isPlaying: true, isLoading: false, error: null }));
    };

    const handlePause = () => {
      setState(prev => ({ ...prev, isPlaying: false, isLoading: false }));
    };

    const handleError = () => {
      setState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        isLoading: false, 
        error: 'Failed to load audio' 
      }));
    };

    const handleLoadStart = () => {
      setState(prev => ({ ...prev, isLoading: true }));
    };

    const handleCanPlayThrough = () => {
      setState(prev => ({ ...prev, isLoading: false }));
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
    };
  }, []);

  // Control functions
  const play = useCallback(() => {
    if (!audioRef.current) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    audioRef.current.play()
      .then(() => {
        fadeInVolume();
        saveMusicPreference(true);
      })
      .catch((error) => {
        setState(prev => ({ 
          ...prev, 
          isPlaying: false, 
          isLoading: false, 
          error: 'Playback failed' 
        }));
        console.error('Audio play failed:', error);
      });
  }, [saveMusicPreference, fadeInVolume]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    
    // Clear any ongoing fade
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    
    audioRef.current.pause();
    saveMusicPreference(false);
  }, [saveMusicPreference]);

  const toggle = useCallback(() => {
    if (shouldAutoMute()) {
      return; // Don't allow toggling if user prefers reduced motion
    }
    
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause, shouldAutoMute]);

  const setVolume = useCallback((volume: number) => {
    if (!audioRef.current) return;
    
    const clampedVolume = Math.max(0, Math.min(1, volume));
    audioRef.current.volume = clampedVolume;
    setState(prev => ({ ...prev, volume: clampedVolume }));
  }, []);

  const mute = useCallback(() => {
    if (!audioRef.current) return;
    
    audioRef.current.muted = true;
    setState(prev => ({ ...prev, isMuted: true }));
  }, []);

  const unmute = useCallback(() => {
    if (!audioRef.current) return;
    
    audioRef.current.muted = false;
    setState(prev => ({ ...prev, isMuted: false }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
      
      // Remove interaction listeners if they exist
      const handleInteraction = () => {};
      document.body.removeEventListener('pointerdown', handleInteraction);
      document.body.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  const controls: MusicPlayerControls = {
    play,
    pause,
    toggle,
    setVolume,
    mute,
    unmute
  };

  return {
    ...state,
    controls
  };
};