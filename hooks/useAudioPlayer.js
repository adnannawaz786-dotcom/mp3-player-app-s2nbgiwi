import { useState, useRef, useEffect, useCallback } from 'react';

export const useAudioPlayer = () => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState('none'); // 'none', 'one', 'all'
  const [playbackRate, setPlaybackRate] = useState(1);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata';
      
      const audio = audioRef.current;
      
      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
        setIsLoading(false);
      };
      
      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
        handleTrackEnd();
      };
      
      const handleError = (e) => {
        setError('Failed to load audio file');
        setIsLoading(false);
        setIsPlaying(false);
      };
      
      const handleCanPlay = () => {
        setIsLoading(false);
      };
      
      const handleLoadStart = () => {
        setIsLoading(true);
      };
      
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('loadstart', handleLoadStart);
      
      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('loadstart', handleLoadStart);
      };
    }
  }, []);

  // Handle track end based on repeat mode
  const handleTrackEnd = useCallback(() => {
    if (repeatMode === 'one') {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    } else if (repeatMode === 'all' || currentTrackIndex < playlist.length - 1) {
      playNext();
    }
  }, [repeatMode, currentTrackIndex, playlist.length]);

  // Load track
  const loadTrack = useCallback((track, trackIndex = 0) => {
    if (!audioRef.current || !track) return;
    
    setError(null);
    setIsLoading(true);
    setCurrentTrack(track);
    setCurrentTrackIndex(trackIndex);
    
    audioRef.current.src = track.url || track.src;
    audioRef.current.volume = isMuted ? 0 : volume;
    audioRef.current.playbackRate = playbackRate;
  }, [volume, isMuted, playbackRate]);

  // Play/Pause
  const togglePlayPause = useCallback(async () => {
    if (!audioRef.current || !currentTrack) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      setError('Playback failed');
      setIsPlaying(false);
    }
  }, [isPlaying, currentTrack]);

  // Play specific track
  const playTrack = useCallback(async (track, trackIndex = 0) => {
    loadTrack(track, trackIndex);
    
    // Wait for the track to load before playing
    setTimeout(async () => {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        setError('Playback failed');
        setIsPlaying(false);
      }
    }, 100);
  }, [loadTrack]);

  // Seek to specific time
  const seekTo = useCallback((time) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(time, duration));
    setCurrentTime(audioRef.current.currentTime);
  }, [duration]);

  // Set volume
  const changeVolume = useCallback((newVolume) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : clampedVolume;
    }
  }, [isMuted]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = !isMuted ? 0 : volume;
    }
  }, [isMuted, volume]);

  // Play next track
  const playNext = useCallback(() => {
    if (playlist.length === 0) return;
    
    let nextIndex;
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (currentTrackIndex + 1) % playlist.length;
    }
    
    const nextTrack = playlist[nextIndex];
    playTrack(nextTrack, nextIndex);
  }, [playlist, currentTrackIndex, isShuffled, playTrack]);

  // Play previous track
  const playPrevious = useCallback(() => {
    if (playlist.length === 0) return;
    
    let prevIndex;
    if (isShuffled) {
      prevIndex = Math.floor(Math.random() * playlist.length);
    } else {
      prevIndex = currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
    }
    
    const prevTrack = playlist[prevIndex];
    playTrack(prevTrack, prevIndex);
  }, [playlist, currentTrackIndex, isShuffled, playTrack]);

  // Toggle shuffle
  const toggleShuffle = useCallback(() => {
    setIsShuffled(!isShuffled);
  }, [isShuffled]);

  // Cycle repeat mode
  const toggleRepeat = useCallback(() => {
    const modes = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeatMode(modes[nextIndex]);
  }, [repeatMode]);

  // Change playback rate
  const changePlaybackRate = useCallback((rate) => {
    const clampedRate = Math.max(0.25, Math.min(2, rate));
    setPlaybackRate(clampedRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = clampedRate;
    }
  }, []);

  // Set playlist
  const setPlaylistTracks = useCallback((tracks) => {
    setPlaylist(tracks);
    if (tracks.length > 0 && !currentTrack) {
      setCurrentTrack(tracks[0]);
      setCurrentTrackIndex(0);
    }
  }, [currentTrack]);

  // Add track to playlist
  const addToPlaylist = useCallback((track) => {
    setPlaylist(prev => [...prev, track]);
  }, []);

  // Remove track from playlist
  const removeFromPlaylist = useCallback((index) => {
    setPlaylist(prev => {
      const newPlaylist = prev.filter((_, i) => i !== index);
      if (index === currentTrackIndex && newPlaylist.length > 0) {
        const newIndex = Math.min(currentTrackIndex, newPlaylist.length - 1);
        setCurrentTrackIndex(newIndex);
        setCurrentTrack(newPlaylist[newIndex]);
      } else if (index < currentTrackIndex) {
        setCurrentTrackIndex(prev => prev - 1);
      }
      return newPlaylist;
    });
  }, [currentTrackIndex]);

  // Get formatted time
  const formatTime = useCallback((time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Get progress percentage
  const getProgress = useCallback(() => {
    return duration > 0 ? (currentTime / duration) * 100 : 0;
  }, [currentTime, duration]);

  return {
    // State
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLoading,
    error,
    currentTrack,
    playlist,
    currentTrackIndex,
    isShuffled,
    repeatMode,
    playbackRate,
    
    // Actions
    togglePlayPause,
    playTrack,
    loadTrack,
    seekTo,
    changeVolume,
    toggleMute,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    changePlaybackRate,
    setPlaylistTracks,
    addToPlaylist,
    removeFromPlaylist,
    
    // Utilities
    formatTime,
    getProgress,
    
    // Audio ref for advanced usage
    audioRef
  };
};

export default useAudioPlayer;