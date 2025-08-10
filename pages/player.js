import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Repeat,
  Shuffle,
  Heart,
  MoreHorizontal,
  ChevronDown,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Slider } from '../components/ui/slider';
import { Badge } from '../components/ui/badge';

export default function PlayerPage() {
  const router = useRouter();
  const { trackId } = router.query;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [visualizerData, setVisualizerData] = useState(new Array(64).fill(0));
  
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationRef = useRef(null);

  // Mock track data - replace with actual data from props/context
  const currentTrack = {
    id: trackId || 1,
    title: "Sample Song",
    artist: "Sample Artist",
    album: "Sample Album",
    duration: 240,
    artwork: "/api/placeholder/400/400",
    src: "/api/placeholder/audio.mp3"
  };

  // Initialize Web Audio API for visualizer
  useEffect(() => {
    if (typeof window !== 'undefined' && audioRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        
        const source = audioContextRef.current.createMediaElementSource(audioRef.current);
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
        
        analyserRef.current.fftSize = 128;
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
        
        startVisualization();
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const startVisualization = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    const animate = () => {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      
      // Update visualizer data
      const newData = Array.from(dataArrayRef.current).map(value => value / 255);
      setVisualizerData(newData);
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
        if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume();
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value) => {
    if (audioRef.current) {
      const newTime = (value[0] / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (value) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack.src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-white hover:bg-white/10"
        >
          <ChevronDown className="h-6 w-6" />
        </Button>
        
        <div className="text-center">
          <h1 className="text-sm font-medium opacity-70">PLAYING FROM LIBRARY</h1>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="text-white hover:bg-white/10"
        >
          {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </Button>
      </div>

      <div className="px-6 pb-6">
        {/* Visualizer */}
        <Card className="mb-8 bg-black/20 border-white/10 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-end justify-center space-x-1 h-32">
              {visualizerData.map((value, index) => (
                <motion.div
                  key={index}
                  className="bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-full"
                  style={{
                    width: '4px',
                    minHeight: '4px',
                  }}
                  animate={{
                    height: `${Math.max(4, value * 120)}px`,
                    opacity: isPlaying ? 0.8 + value * 0.2 : 0.3
                  }}
                  transition={{
                    duration: 0.1,
                    ease: "easeOut"
                  }}
                />
              ))}
            </div>
          </div>
        </Card>

        {/* Track Info */}
        <div className="text-center mb-8">
          <div className="relative w-80 h-80 mx-auto mb-6">
            <motion.div
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ duration: 20, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
              className="w-full h-full rounded-full overflow-hidden shadow-2xl"
            >
              <img
                src={currentTrack.artwork}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            </motion.div>
            
            {/* Vinyl effect */}
            <div className="absolute inset-0 rounded-full border-8 border-black/20 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-black rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <motion.h1 
            className="text-3xl font-bold mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {currentTrack.title}
          </motion.h1>
          
          <motion.p 
            className="text-xl text-white/70 mb-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {currentTrack.artist}
          </motion.p>
          
          <motion.p 
            className="text-lg text-white/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {currentTrack.album}
          </motion.p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="w-full mb-2"
          />
          <div className="flex justify-between text-sm text-white/70">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-6 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsShuffle(!isShuffle)}
            className={`text-white hover:bg-white/10 ${isShuffle ? 'text-green-400' : ''}`}
          >
            <Shuffle className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <SkipBack className="h-6 w-6" />
          </Button>

          <Button
            onClick={togglePlay}
            size="icon"
            className="w-16 h-16 bg-white text-black hover:bg-white/90"
          >
            {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <SkipForward className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsRepeat(!isRepeat)}
            className={`text-white hover:bg-white/10 ${isRepeat ? 'text-green-400' : ''}`}
          >
            <Repeat className="h-5 w-5" />
          </Button>
        </div>

        {/* Secondary Controls */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsLiked(!isLiked)}
            className={`text-white hover:bg-white/10 ${isLiked ? 'text-red-400' : ''}`}
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
          </Button>

          <div className="flex items-center space-x-2 flex-1 max-w-32 mx-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="text-white hover:bg-white/10"
            >
              {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="flex-1"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}