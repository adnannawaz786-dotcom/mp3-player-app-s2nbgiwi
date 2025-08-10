import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
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
  Minimize2,
  Download,
  Share,
  ListMusic,
  Settings
} from 'lucide-react';

const FullScreenPlayer = ({ 
  currentSong, 
  isPlaying, 
  onPlayPause, 
  onNext, 
  onPrevious, 
  onClose,
  audioRef,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  isShuffled,
  onShuffle,
  repeatMode,
  onRepeat,
  visualizerData = []
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const canvasRef = useRef(null);

  // Audio visualizer
  useEffect(() => {
    if (!canvasRef.current || !visualizerData.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Create gradient
    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, 'rgba(147, 51, 234, 0.8)');
    gradient.addColorStop(0.5, 'rgba(79, 70, 229, 0.6)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.4)');

    // Draw bars
    const barWidth = width / visualizerData.length;
    visualizerData.forEach((value, index) => {
      const barHeight = (value / 255) * height * 0.8;
      ctx.fillStyle = gradient;
      ctx.fillRect(index * barWidth, height - barHeight, barWidth - 1, barHeight);
    });
  }, [visualizerData]);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVolumeToggle = () => {
    if (isMuted) {
      setIsMuted(false);
      onVolumeChange(volume);
    } else {
      setIsMuted(true);
      onVolumeChange(0);
    }
  };

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'one':
        return <Repeat className="w-5 h-5" />;
      case 'all':
        return <Repeat className="w-5 h-5" />;
      default:
        return <Repeat className="w-5 h-5" />;
    }
  };

  if (!currentSong) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 overflow-hidden"
      >
        {/* Background blur effect */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
        
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/10"
          >
            <Minimize2 className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/10 text-white border-0">
              Playing from Library
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <ListMusic className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-8 pb-32">
          {/* Album art and visualizer */}
          <div className="relative mb-8">
            <motion.div
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ duration: 20, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
              className="relative"
            >
              <div className="w-80 h-80 rounded-full overflow-hidden shadow-2xl border-4 border-white/20">
                <img
                  src={currentSong.artwork || '/default-album.jpg'}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
            
            {/* Visualizer overlay */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <canvas
                ref={canvasRef}
                width={320}
                height={320}
                className="w-full h-full opacity-30"
              />
            </div>
          </div>

          {/* Song info */}
          <div className="text-center mb-8 max-w-md">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-white mb-2 truncate"
            >
              {currentSong.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-white/70 truncate"
            >
              {currentSong.artist}
            </motion.p>
            {currentSong.album && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-white/50 truncate mt-1"
              >
                {currentSong.album}
              </motion.p>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-md mb-6">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={([value]) => onSeek(value)}
              className="w-full mb-2"
            />
            <div className="flex justify-between text-sm text-white/60">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLiked(!isLiked)}
              className={`text-white hover:bg-white/10 ${isLiked ? 'text-red-400' : ''}`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <Download className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <Share className="w-5 h-5" />
            </Button>
          </div>

          {/* Main controls */}
          <div className="flex items-center gap-6 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={onShuffle}
              className={`text-white hover:bg-white/10 ${isShuffled ? 'text-purple-400' : ''}`}
            >
              <Shuffle className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={onPrevious}
              className="text-white hover:bg-white/10"
            >
              <SkipBack className="w-6 h-6" />
            </Button>

            <Button
              size="lg"
              onClick={onPlayPause}
              className="w-16 h-16 rounded-full bg-white text-black hover:bg-white/90 shadow-lg"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={onNext}
              className="text-white hover:bg-white/10"
            >
              <SkipForward className="w-6 h-6" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onRepeat}
              className={`text-white hover:bg-white/10 ${repeatMode !== 'off' ? 'text-purple-400' : ''}`}
            >
              {getRepeatIcon()}
            </Button>
          </div>

          {/* Volume control */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVolumeToggle}
              onMouseEnter={() => setShowVolumeSlider(true)}
              className="text-white hover:bg-white/10"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>

            <AnimatePresence>
              {showVolumeSlider && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 120 }}
                  exit={{ opacity: 0, width: 0 }}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                  className="overflow-hidden"
                >
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={100}
                    step={1}
                    onValueChange={([value]) => {
                      setIsMuted(value === 0);
                      onVolumeChange(value);
                    }}
                    className="w-full"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Background animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/10 rounded-full"
              animate={{
                x: [0, Math.random() * 100, 0],
                y: [0, Math.random() * 100, 0],
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FullScreenPlayer;