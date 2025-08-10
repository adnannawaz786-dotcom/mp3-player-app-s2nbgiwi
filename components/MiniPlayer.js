'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

const MiniPlayer = ({ 
  currentTrack, 
  isPlaying, 
  onPlayPause, 
  onNext, 
  onPrevious, 
  onExpand, 
  onClose,
  progress = 0,
  volume = 1,
  onVolumeChange,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // Handle drag to dismiss
  const handleDragEnd = (event, info) => {
    if (info.offset.y > 100) {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    }
  };

  if (!currentTrack) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 100 }}
          dragElastic={0.2}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          className={`fixed bottom-4 left-4 right-4 z-50 ${className}`}
        >
          <Card className="bg-background/95 backdrop-blur-md border border-border/50 shadow-lg">
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            <div className="flex items-center gap-3 p-3">
              {/* Album artwork */}
              <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                {currentTrack.artwork ? (
                  <img
                    src={currentTrack.artwork}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-primary" />
                  </div>
                )}
                
                {/* Playing indicator */}
                <AnimatePresence>
                  {isPlaying && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/20 flex items-center justify-center"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-2 h-2 bg-white rounded-full"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <motion.h3 
                  className="text-sm font-medium text-foreground truncate"
                  animate={{ opacity: isDragging ? 0.5 : 1 }}
                >
                  {currentTrack.title}
                </motion.h3>
                <motion.p 
                  className="text-xs text-muted-foreground truncate"
                  animate={{ opacity: isDragging ? 0.5 : 1 }}
                >
                  {currentTrack.artist}
                </motion.p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPrevious}
                  className="h-8 w-8 p-0 hover:bg-muted"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPlayPause}
                  className="h-9 w-9 p-0 hover:bg-muted"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )}
                  </motion.div>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onNext}
                  className="h-8 w-8 p-0 hover:bg-muted"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExpand}
                  className="h-8 w-8 p-0 hover:bg-muted ml-1"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsVisible(false);
                    setTimeout(() => onClose?.(), 300);
                  }}
                  className="h-8 w-8 p-0 hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Drag indicator */}
            <AnimatePresence>
              {isDragging && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-full"
                >
                  Swipe down to dismiss
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MiniPlayer;