import { useEffect } from 'react';
import { useMusicPlayer } from './useMusicPlayer';

/**
 * Dedicated hook for managing background music in the dashboard
 * This hook handles the auto-play logic for fresh sessions
 */
export const useBackgroundMusic = () => {
  const musicPlayer = useMusicPlayer('/audio/Roie Shpigler - Marbles.mp3', {
    autoPlay: true,
    targetVolume: 0.10
  });

  // Log the current state for debugging (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Background music state:', {
        isPlaying: musicPlayer.isPlaying,
        volume: musicPlayer.volume,
        isLoading: musicPlayer.isLoading,
        error: musicPlayer.error
      });
    }
  }, [musicPlayer.isPlaying, musicPlayer.volume, musicPlayer.isLoading, musicPlayer.error]);

  return musicPlayer;
};