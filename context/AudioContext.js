'use client';

import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';

// Initial state for the audio player
const initialState = {
  // Current track info
  currentTrack: null,
  currentIndex: -1,
  
  // Playback state
  isPlaying: false,
  isPaused: false,
  isLoading: false,
  
  // Time and progress
  currentTime: 0,
  duration: 0,
  progress: 0,
  
  // Volume and settings
  volume: 1,
  isMuted: false,
  
  // Playback modes
  isRepeat: false,
  isShuffle: false,
  
  // Queue and library
  queue: [],
  library: [],
  currentPlaylist: null,
  
  // UI state
  isMinimized: false,
  isFullscreen: false,
  showVisualizer: true,
  
  // Visualizer data
  frequencyData: new Uint8Array(256),
  analyserNode: null,
  
  // Error handling
  error: null,
};

// Action types
const ACTIONS = {
  SET_CURRENT_TRACK: 'SET_CURRENT_TRACK',
  SET_PLAYING: 'SET_PLAYING',
  SET_PAUSED: 'SET_PAUSED',
  SET_LOADING: 'SET_LOADING',
  SET_CURRENT_TIME: 'SET_CURRENT_TIME',
  SET_DURATION: 'SET_DURATION',
  SET_PROGRESS: 'SET_PROGRESS',
  SET_VOLUME: 'SET_VOLUME',
  SET_MUTED: 'SET_MUTED',
  SET_REPEAT: 'SET_REPEAT',
  SET_SHUFFLE: 'SET_SHUFFLE',
  SET_QUEUE: 'SET_QUEUE',
  SET_LIBRARY: 'SET_LIBRARY',
  SET_CURRENT_PLAYLIST: 'SET_CURRENT_PLAYLIST',
  SET_MINIMIZED: 'SET_MINIMIZED',
  SET_FULLSCREEN: 'SET_FULLSCREEN',
  SET_SHOW_VISUALIZER: 'SET_SHOW_VISUALIZER',
  SET_FREQUENCY_DATA: 'SET_FREQUENCY_DATA',
  SET_ANALYSER_NODE: 'SET_ANALYSER_NODE',
  SET_ERROR: 'SET_ERROR',
  ADD_TO_QUEUE: 'ADD_TO_QUEUE',
  REMOVE_FROM_QUEUE: 'REMOVE_FROM_QUEUE',
  CLEAR_QUEUE: 'CLEAR_QUEUE',
  NEXT_TRACK: 'NEXT_TRACK',
  PREVIOUS_TRACK: 'PREVIOUS_TRACK',
  ADD_TO_LIBRARY: 'ADD_TO_LIBRARY',
  REMOVE_FROM_LIBRARY: 'REMOVE_FROM_LIBRARY',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer function
function audioReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_CURRENT_TRACK:
      return {
        ...state,
        currentTrack: action.payload.track,
        currentIndex: action.payload.index !== undefined ? action.payload.index : state.currentIndex,
      };

    case ACTIONS.SET_PLAYING:
      return {
        ...state,
        isPlaying: action.payload,
        isPaused: !action.payload,
        error: null,
      };

    case ACTIONS.SET_PAUSED:
      return {
        ...state,
        isPaused: action.payload,
        isPlaying: !action.payload,
      };

    case ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case ACTIONS.SET_CURRENT_TIME:
      return {
        ...state,
        currentTime: action.payload,
        progress: state.duration > 0 ? (action.payload / state.duration) * 100 : 0,
      };

    case ACTIONS.SET_DURATION:
      return {
        ...state,
        duration: action.payload,
        progress: action.payload > 0 ? (state.currentTime / action.payload) * 100 : 0,
      };

    case ACTIONS.SET_PROGRESS:
      return {
        ...state,
        progress: action.payload,
        currentTime: state.duration > 0 ? (action.payload / 100) * state.duration : 0,
      };

    case ACTIONS.SET_VOLUME:
      return {
        ...state,
        volume: Math.max(0, Math.min(1, action.payload)),
        isMuted: action.payload === 0,
      };

    case ACTIONS.SET_MUTED:
      return {
        ...state,
        isMuted: action.payload,
      };

    case ACTIONS.SET_REPEAT:
      return {
        ...state,
        isRepeat: action.payload,
      };

    case ACTIONS.SET_SHUFFLE:
      return {
        ...state,
        isShuffle: action.payload,
      };

    case ACTIONS.SET_QUEUE:
      return {
        ...state,
        queue: action.payload,
      };

    case ACTIONS.SET_LIBRARY:
      return {
        ...state,
        library: action.payload,
      };

    case ACTIONS.SET_CURRENT_PLAYLIST:
      return {
        ...state,
        currentPlaylist: action.payload,
      };

    case ACTIONS.SET_MINIMIZED:
      return {
        ...state,
        isMinimized: action.payload,
        isFullscreen: action.payload ? false : state.isFullscreen,
      };

    case ACTIONS.SET_FULLSCREEN:
      return {
        ...state,
        isFullscreen: action.payload,
        isMinimized: action.payload ? false : state.isMinimized,
      };

    case ACTIONS.SET_SHOW_VISUALIZER:
      return {
        ...state,
        showVisualizer: action.payload,
      };

    case ACTIONS.SET_FREQUENCY_DATA:
      return {
        ...state,
        frequencyData: action.payload,
      };

    case ACTIONS.SET_ANALYSER_NODE:
      return {
        ...state,
        analyserNode: action.payload,
      };

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case ACTIONS.ADD_TO_QUEUE:
      return {
        ...state,
        queue: [...state.queue, ...action.payload],
      };

    case ACTIONS.REMOVE_FROM_QUEUE:
      return {
        ...state,
        queue: state.queue.filter((_, index) => index !== action.payload),
      };

    case ACTIONS.CLEAR_QUEUE:
      return {
        ...state,
        queue: [],
      };

    case ACTIONS.NEXT_TRACK:
      const nextIndex = state.isShuffle 
        ? Math.floor(Math.random() * state.queue.length)
        : (state.currentIndex + 1) % state.queue.length;
      
      return {
        ...state,
        currentIndex: nextIndex,
        currentTrack: state.queue[nextIndex] || null,
      };

    case ACTIONS.PREVIOUS_TRACK:
      const prevIndex = state.isShuffle
        ? Math.floor(Math.random() * state.queue.length)
        : state.currentIndex > 0 ? state.currentIndex - 1 : state.queue.length - 1;
      
      return {
        ...state,
        currentIndex: prevIndex,
        currentTrack: state.queue[prevIndex] || null,
      };

    case ACTIONS.ADD_TO_LIBRARY:
      const existingTrack = state.library.find(track => track.id === action.payload.id);
      if (existingTrack) return state;
      
      return {
        ...state,
        library: [...state.library, action.payload],
      };

    case ACTIONS.REMOVE_FROM_LIBRARY:
      return {
        ...state,
        library: state.library.filter(track => track.id !== action.payload),
      };

    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// Create context
const AudioContext = createContext();

// Audio provider component
export function AudioProvider({ children }) {
  const [state, dispatch] = useReducer(audioReducer, initialState);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);

  // Initialize Web Audio API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 512;
        
        dispatch({
          type: ACTIONS.SET_ANALYSER_NODE,
          payload: analyserRef.current,
        });
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
      }
    }
  }, []);

  // Connect audio element to Web Audio API
  const connectAudioSource = (audioElement) => {
    if (audioContextRef.current && analyserRef.current && audioElement && !sourceRef.current) {
      try {
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch (error) {
        console.warn('Failed to connect audio source:', error);
      }
    }
  };

  // Update frequency data for visualizer
  const updateFrequencyData = () => {
    if (analyserRef.current && state.showVisualizer) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      dispatch({
        type: ACTIONS.SET_FREQUENCY_DATA,
        payload: dataArray,
      });
    }
    
    if (state.isPlaying) {
      animationRef.current = requestAnimationFrame(updateFrequencyData);
    }
  };

  // Start/stop frequency data updates
  useEffect(() => {
    if (state.isPlaying && state.showVisualizer) {
      updateFrequencyData();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state.isPlaying, state.showVisualizer]);

  // Action creators
  const actions = {
    // Track control
    setCurrentTrack: (track, index) => {
      dispatch({
        type: ACTIONS.SET_CURRENT_TRACK,
        payload: { track, index },
      });
    },

    play: () => {
      dispatch({ type: ACTIONS.SET_PLAYING, payload: true });
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    },

    pause: () => {
      dispatch({ type: ACTIONS.SET_PLAYING, payload: false });
    },

    togglePlay: () => {
      dispatch({ type: ACTIONS.SET_PLAYING, payload: !state.isPlaying });
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    },

    stop: () => {
      dispatch({ type: ACTIONS.SET_PLAYING, payload: false });
      dispatch({ type: ACTIONS.SET_CURRENT_TIME, payload: 0 });
    },

    nextTrack: () => {
      dispatch({ type: ACTIONS.NEXT_TRACK });
    },

    previousTrack: () => {
      dispatch({ type: ACTIONS.PREVIOUS_TRACK });
    },

    // Time control
    setCurrentTime: (time) => {
      dispatch({ type: ACTIONS.SET_CURRENT_TIME, payload: time });
    },

    setDuration: (duration) => {
      dispatch({ type: ACTIONS.SET_DURATION, payload: duration });
    },

    setProgress: (progress) => {
      dispatch({ type: ACTIONS.SET_PROGRESS, payload: progress });
    },

    seekTo: (time) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
      }
      dispatch({ type: ACTIONS.SET_CURRENT_TIME, payload: time });
    },

    // Volume control
    setVolume: (volume) => {
      dispatch({ type: ACTIONS.SET_VOLUME, payload: volume });
      if (audioRef.current) {
        audioRef.current.volume = volume;
      }
    },

    toggleMute: () => {
      const newMutedState = !state.isMuted;
      dispatch({ type: ACTIONS.SET_MUTED, payload: newMutedState });
      if (audioRef.current) {
        audioRef.current.muted = newMutedState;
      }
    },

    // Playback modes
    toggleRepeat: () => {
      dispatch({ type: ACTIONS.SET_REPEAT, payload: !state.isRepeat });
    },

    toggleShuffle: () => {
      dispatch({ type: ACTIONS.SET_SHUFFLE, payload: !state.isShuffle });
    },

    // Queue management
    setQueue: (tracks) => {
      dispatch({ type: ACTIONS.SET_QUEUE, payload: tracks });
    },

    addToQueue: (tracks) => {
      const tracksArray = Array.isArray(tracks) ? tracks : [tracks];
      dispatch({ type: ACTIONS.ADD_TO_QUEUE, payload: tracksArray });
    },

    removeFromQueue: (index) => {
      dispatch({ type: ACTIONS.REMOVE_FROM_QUEUE, payload: index });
    },

    clearQueue: () => {
      dispatch({ type: ACTIONS.CLEAR_QUEUE });
    },

    // Library management
    addToLibrary: (track) => {
      dispatch({ type: ACTIONS.ADD_TO_LIBRARY, payload: track });
    },

    removeFromLibrary: (trackId) => {
      dispatch({ type: ACTIONS.REMOVE_FROM_LIBRARY, payload: trackId });
    },

    setLibrary: (tracks) => {
      dispatch({ type: ACTIONS.SET_LIBRARY, payload: tracks });
    },

    // Playlist management
    setCurrentPlaylist: (playlist) => {
      dispatch({ type: ACTIONS.SET_CURRENT_PLAYLIST, payload: playlist });
    },

    playPlaylist: (playlist, startIndex = 0) => {
      dispatch({ type: ACTIONS.SET_QUEUE, payload: playlist.tracks });
      dispatch({ type: ACTIONS.SET_CURRENT_PLAYLIST, payload: playlist });
      dispatch({
        type: ACTIONS.SET_CURRENT_TRACK,
        payload: { track: playlist.tracks[startIndex], index: startIndex },
      });
    },

    // UI state
    toggleMinimized: () => {
      dispatch({ type: ACTIONS.SET_MINIMIZED, payload: !state.isMinimized });
    },

    toggleFullscreen: () => {
      dispatch({ type: ACTIONS.SET_FULLSCREEN, payload: !state.isFullscreen });
    },

    toggleVisualizer: () => {
      dispatch({ type: ACTIONS.SET_SHOW_VISUALIZER, payload: !state.showVisualizer });
    },

    // Error handling
    setError: (error) => {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error });
    },

    clearError: () => {
      dispatch({ type: ACTIONS.CLEAR_ERROR });
    },

    // Audio element management
    setAudioRef: (ref) => {
      audioRef.current = ref;
      if (ref) {
        connectAudioSource(ref);
      }
    },

    // Loading state
    setLoading: (loading) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: loading });
    },
  };

  // Context value
  const contextValue = {
    ...state,
    ...actions,
    audioRef,
    connectAudioSource,
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
}

// Custom hook to use audio context
export function useAudioContext() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioContext must be used within an AudioProvider');
  }
  return context;
}

export { AudioContext };