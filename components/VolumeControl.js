'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

const VolumeControl = ({ 
  volume = 50, 
  onVolumeChange, 
  isMuted = false, 
  onMuteToggle,
  className = '',
  size = 'default' // 'small', 'default', 'large'
}) => {
  const [previousVolume, setPreviousVolume] = useState(volume);
  const [isHovered, setIsHovered] = useState(false);
  const [showSlider, setShowSlider] = useState(false);

  useEffect(() => {
    if (!isMuted && volume > 0) {
      setPreviousVolume(volume);
    }
  }, [volume, isMuted]);

  const handleVolumeChange = (newVolume) => {
    const volumeValue = Array.isArray(newVolume) ? newVolume[0] : newVolume;
    onVolumeChange?.(volumeValue);
    
    if (volumeValue > 0 && isMuted) {
      onMuteToggle?.(false);
    }
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      // Unmute and restore previous volume
      onMuteToggle?.(false);
      if (previousVolume > 0) {
        onVolumeChange?.(previousVolume);
      } else {
        onVolumeChange?.(50);
      }
    } else {
      // Mute
      onMuteToggle?.(true);
      onVolumeChange?.(0);
    }
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return VolumeX;
    } else if (volume < 50) {
      return Volume1;
    } else {
      return Volume2;
    }
  };

  const VolumeIcon = getVolumeIcon();

  const sizeClasses = {
    small: {
      button: 'h-6 w-6',
      icon: 'h-3 w-3',
      slider: 'w-16'
    },
    default: {
      button: 'h-8 w-8',
      icon: 'h-4 w-4',
      slider: 'w-20'
    },
    large: {
      button: 'h-10 w-10',
      icon: 'h-5 w-5',
      slider: 'w-24'
    }
  };

  return (
    <div 
      className={`flex items-center space-x-2 ${className}`}
      onMouseEnter={() => {
        setIsHovered(true);
        setShowSlider(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setTimeout(() => setShowSlider(false), 150);
      }}
    >
      {/* Volume Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleMuteToggle}
        className={`${sizeClasses[size].button} p-0 hover:bg-white/10 transition-colors duration-200`}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        <motion.div
          animate={{ 
            scale: isHovered ? 1.1 : 1,
            rotate: isMuted ? -10 : 0
          }}
          transition={{ duration: 0.2 }}
        >
          <VolumeIcon 
            className={`${sizeClasses[size].icon} ${
              isMuted ? 'text-red-400' : 'text-white'
            }`}
          />
        </motion.div>
      </Button>

      {/* Volume Slider */}
      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={{ 
          opacity: showSlider ? 1 : 0,
          width: showSlider ? 'auto' : 0
        }}
        transition={{ 
          duration: 0.2,
          ease: 'easeOut'
        }}
        className="overflow-hidden"
      >
        <div className={`${sizeClasses[size].slider} px-2`}>
          <Slider
            value={[isMuted ? 0 : volume]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="volume-slider"
            aria-label="Volume"
          />
        </div>
      </motion.div>

      {/* Volume Percentage (for larger sizes) */}
      {size === 'large' && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: showSlider ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-xs text-white/60 min-w-[2rem] text-center"
        >
          {isMuted ? '0%' : `${Math.round(volume)}%`}
        </motion.span>
      )}
    </div>
  );
};

export default VolumeControl;