import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import '../styles/globals.css';

// Audio Context for managing global audio state
const AudioContext = createContext();

// Audio Context Provider
export const AudioProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [playerMode, setPlayerMode] = useState('mini'); // 'mini', 'full', 'hidden'
  const [visualizerData, setVisualizerData] = useState(new Array(128).fill(0));
  
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);

  // Initialize Web Audio API for visualizer
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
      }
    }
  }, []);

  // Connect audio element to analyser when track changes
  useEffect(() => {
    if (audioRef.current && audioContextRef.current && analyserRef.current && !sourceRef.current) {
      try {
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch (error) {
        console.warn('Could not connect audio source:', error);
      }
    }
  }, [currentTrack]);

  // Update visualizer data
  const updateVisualizerData = () => {
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      setVisualizerData([...dataArrayRef.current]);
    }
    if (isPlaying) {
      requestAnimationFrame(updateVisualizerData);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      updateVisualizerData();
    }
  }, [isPlaying]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play();
      } else {
        playNext();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isRepeat, currentIndex, playlist]);

  // Play/Pause functions
  const play = async () => {
    if (audioRef.current && currentTrack) {
      try {
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  // Track navigation
  const playNext = () => {
    if (playlist.length === 0) return;
    
    let nextIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (currentIndex + 1) % playlist.length;
    }
    
    setCurrentIndex(nextIndex);
    setCurrentTrack(playlist[nextIndex]);
  };

  const playPrevious = () => {
    if (playlist.length === 0) return;
    
    let prevIndex;
    if (isShuffle) {
      prevIndex = Math.floor(Math.random() * playlist.length);
    } else {
      prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    }
    
    setCurrentIndex(prevIndex);
    setCurrentTrack(playlist[prevIndex]);
  };

  const playTrack = (track, index = 0) => {
    setCurrentTrack(track);
    setCurrentIndex(index);
    setCurrentTime(0);
  };

  // Volume control
  const changeVolume = (newVolume) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Seek control
  const seekTo = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Playlist management
  const addToPlaylist = (track) => {
    setPlaylist(prev => [...prev, track]);
  };

  const removeFromPlaylist = (index) => {
    setPlaylist(prev => prev.filter((_, i) => i !== index));
    if (index === currentIndex && playlist.length > 1) {
      playNext();
    } else if (index < currentIndex) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const clearPlaylist = () => {
    setPlaylist([]);
    setCurrentTrack(null);
    setCurrentIndex(0);
    pause();
  };

  const value = {
    // State
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    playlist,
    currentIndex,
    isRepeat,
    isShuffle,
    playerMode,
    visualizerData,
    audioRef,
    
    // Actions
    play,
    pause,
    togglePlayPause,
    playNext,
    playPrevious,
    playTrack,
    changeVolume,
    seekTo,
    setIsRepeat,
    setIsShuffle,
    setPlayerMode,
    addToPlaylist,
    removeFromPlaylist,
    clearPlaylist,
    setPlaylist,
    setCurrentTrack,
    setCurrentIndex
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={currentTrack?.url}
        volume={volume}
        preload="metadata"
        style={{ display: 'none' }}
      />
    </AudioContext.Provider>
  );
};

// Custom hook to use audio context
export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

// Main App component
export default function App({ Component, pageProps }) {
  return (
    <AudioProvider>
      <AnimatePresence mode="wait" initial={false}>
        <Component {...pageProps} />
      </AnimatePresence>
    </AudioProvider>
  );
}