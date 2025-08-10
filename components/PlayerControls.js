import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

const PlayerControls = ({
  isPlaying,
  onPlayPause,
  onPrevious,
  onNext,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  isMuted,
  onMute,
  isShuffled,
  onShuffle,
  repeatMode,
  onRepeat,
  isLoading,
  disabled = false,
  className = '',
  size = 'default' // 'mini' | 'default' | 'large'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const progressRef = useRef(null);
  const volumeRef = useRef(null);

  // Format time helper
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle progress bar drag
  const handleProgressMouseDown = (e) => {
    if (!duration || disabled) return;
    setIsDragging(true);
    handleProgressMove(e);
  };

  const handleProgressMove = (e) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percent * duration;
    setDragValue(newTime);
  };

  const handleProgressMouseUp = () => {
    if (isDragging && onSeek) {
      onSeek(dragValue);
    }
    setIsDragging(false);
  };

  // Handle volume slider
  const handleVolumeMouseDown = (e) => {
    if (disabled) return;
    handleVolumeMove(e);
  };

  const handleVolumeMove = (e) => {
    if (!volumeRef.current) return;
    const rect = volumeRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onVolumeChange && onVolumeChange(percent);
  };

  // Mouse event listeners
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        handleProgressMove(e);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        handleProgressMouseUp();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragValue]);

  // Get current progress
  const currentProgress = isDragging ? dragValue : currentTime;
  const progressPercent = duration ? (currentProgress / duration) * 100 : 0;

  // Size variants
  const sizeClasses = {
    mini: {
      container: 'p-2',
      button: 'h-6 w-6',
      mainButton: 'h-8 w-8',
      icon: 'h-3 w-3',
      mainIcon: 'h-4 w-4',
      progress: 'h-1',
      text: 'text-xs'
    },
    default: {
      container: 'p-4',
      button: 'h-8 w-8',
      mainButton: 'h-10 w-10',
      icon: 'h-4 w-4',
      mainIcon: 'h-5 w-5',
      progress: 'h-2',
      text: 'text-sm'
    },
    large: {
      container: 'p-6',
      button: 'h-10 w-10',
      mainButton: 'h-12 w-12',
      icon: 'h-5 w-5',
      mainIcon: 'h-6 w-6',
      progress: 'h-3',
      text: 'text-base'
    }
  };

  const styles = sizeClasses[size];

  return (
    <Card className={`bg-white/10 backdrop-blur-md border-white/20 ${styles.container} ${className}`}>
      {/* Progress Bar */}
      {size !== 'mini' && (
        <div className="mb-4">
          <div 
            ref={progressRef}
            className={`relative bg-white/20 rounded-full cursor-pointer ${styles.progress}`}
            onMouseDown={handleProgressMouseDown}
          >
            <motion.div 
              className={`bg-gradient-to-r from-purple-400 to-pink-400 rounded-full ${styles.progress}`}
              style={{ width: `${progressPercent}%` }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: isDragging ? 0 : 0.1 }}
            />
            <motion.div 
              className="absolute top-1/2 w-3 h-3 bg-white rounded-full shadow-lg transform -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${progressPercent}%` }}
              animate={{ left: `${progressPercent}%` }}
              transition={{ duration: isDragging ? 0 : 0.1 }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          </div>
          
          {/* Time Display */}
          <div className={`flex justify-between mt-2 text-white/70 ${styles.text}`}>
            <span>{formatTime(currentProgress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex items-center justify-center space-x-2">
        {/* Shuffle Button */}
        {size !== 'mini' && (
          <Button
            variant="ghost"
            size="sm"
            className={`text-white hover:bg-white/20 ${styles.button} ${isShuffled ? 'text-purple-400' : ''}`}
            onClick={onShuffle}
            disabled={disabled}
          >
            <Shuffle className={styles.icon} />
          </Button>
        )}

        {/* Previous Button */}
        <Button
          variant="ghost"
          size="sm"
          className={`text-white hover:bg-white/20 ${styles.button}`}
          onClick={onPrevious}
          disabled={disabled}
        >
          <SkipBack className={styles.icon} />
        </Button>

        {/* Play/Pause Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="ghost"
            size="sm"
            className={`text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 ${styles.mainButton}`}
            onClick={onPlayPause}
            disabled={disabled || isLoading}
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, rotate: 0 }}
                  animate={{ opacity: 1, rotate: 360 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, repeat: Infinity, ease: "linear" }}
                  className={`border-2 border-white border-t-transparent rounded-full ${styles.mainIcon}`}
                />
              ) : isPlaying ? (
                <motion.div
                  key="pause"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <Pause className={styles.mainIcon} />
                </motion.div>
              ) : (
                <motion.div
                  key="play"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <Play className={styles.mainIcon} />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>

        {/* Next Button */}
        <Button
          variant="ghost"
          size="sm"
          className={`text-white hover:bg-white/20 ${styles.button}`}
          onClick={onNext}
          disabled={disabled}
        >
          <SkipForward className={styles.icon} />
        </Button>

        {/* Repeat Button */}
        {size !== 'mini' && (
          <Button
            variant="ghost"
            size="sm"
            className={`text-white hover:bg-white/20 ${styles.button} ${repeatMode !== 'off' ? 'text-purple-400' : ''}`}
            onClick={onRepeat}
            disabled={disabled}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className={styles.icon} />
            ) : (
              <Repeat className={styles.icon} />
            )}
          </Button>
        )}

        {/* Volume Control */}
        {size === 'large' && (
          <div 
            className="relative flex items-center space-x-2"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <Button
              variant="ghost"
              size="sm"
              className={`text-white hover:bg-white/20 ${styles.button}`}
              onClick={onMute}
              disabled={disabled}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className={styles.icon} />
              ) : (
                <Volume2 className={styles.icon} />
              )}
            </Button>

            <AnimatePresence>
              {showVolumeSlider && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 80 }}
                  exit={{ opacity: 0, width: 0 }}
                  className="relative"
                >
                  <div 
                    ref={volumeRef}
                    className="h-2 bg-white/20 rounded-full cursor-pointer"
                    onMouseDown={handleVolumeMouseDown}
                  >
                    <div 
                      className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                      style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Mini Progress Bar */}
      {size === 'mini' && (
        <div className="mt-2">
          <div 
            ref={progressRef}
            className="relative h-1 bg-white/20 rounded-full cursor-pointer"
            onMouseDown={handleProgressMouseDown}
          >
            <motion.div 
              className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
              style={{ width: `${progressPercent}%` }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: isDragging ? 0 : 0.1 }}
            />
          </div>
        </div>
      )}
    </Card>
  );
};

export default PlayerControls;