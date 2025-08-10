'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music, 
  Library, 
  Home, 
  Search, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2,
  Maximize2,
  Minimize2,
  Heart,
  Shuffle,
  Repeat
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';

const Layout = ({ children, currentTrack, isPlaying, onPlayPause, onNext, onPrevious, onToggleFullscreen, isFullscreen }) => {
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(75);
  const [isLiked, setIsLiked] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off', 'all', 'one'

  // Navigation items
  const navigationItems = [
    { name: 'Home', icon: Home, href: '/', active: true },
    { name: 'Search', icon: Search, href: '/search', active: false },
    { name: 'Library', icon: Library, href: '/library', active: false },
  ];

  // Show mini player when there's a current track and not in fullscreen
  useEffect(() => {
    setShowMiniPlayer(currentTrack && !isFullscreen);
  }, [currentTrack, isFullscreen]);

  // Format time helper
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle progress bar click
  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    setCurrentTime(newTime);
    // Here you would typically update the actual audio currentTime
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newVolume = Math.max(0, Math.min(100, percent * 100));
    setVolume(newVolume);
    // Here you would typically update the actual audio volume
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Sidebar Navigation */}
      <motion.aside 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="fixed left-0 top-0 z-40 h-screen w-64 bg-black/20 backdrop-blur-xl border-r border-white/10"
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-2 p-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
              <Music className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SoundWave</span>
          </div>

          <Separator className="mx-6 bg-white/10" />

          {/* Navigation */}
          <nav className="flex-1 space-y-2 p-6">
            {navigationItems.map((item) => (
              <Button
                key={item.name}
                variant={item.active ? "default" : "ghost"}
                className={`w-full justify-start gap-3 ${
                  item.active 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Button>
            ))}
          </nav>

          {/* Recently Played */}
          <div className="p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Recently Played
            </h3>
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                  <div className="h-10 w-10 rounded bg-gradient-to-r from-blue-500 to-purple-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">Song Title {item}</p>
                    <p className="text-xs text-gray-400 truncate">Artist Name</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${showMiniPlayer ? 'ml-64 pb-24' : 'ml-64'}`}>
        <div className="p-6">
          {children}
        </div>
      </main>

      {/* Mini Player */}
      <AnimatePresence>
        {showMiniPlayer && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-64 right-0 z-50"
          >
            <Card className="m-4 bg-black/40 backdrop-blur-xl border-white/10">
              <div className="p-4">
                {/* Progress Bar */}
                <div 
                  className="w-full h-1 bg-white/20 rounded-full cursor-pointer mb-4"
                  onClick={handleProgressClick}
                >
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-100"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  {/* Track Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <Music className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {currentTrack?.title || 'No track selected'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {currentTrack?.artist || 'Unknown artist'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsLiked(!isLiked)}
                      className={`${isLiked ? 'text-red-500' : 'text-gray-400'} hover:text-red-500`}
                    >
                      <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                    </Button>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2 mx-8">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsShuffled(!isShuffled)}
                      className={`${isShuffled ? 'text-purple-400' : 'text-gray-400'} hover:text-white`}
                    >
                      <Shuffle className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onPrevious}
                      className="text-gray-400 hover:text-white"
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>

                    <Button
                      onClick={onPlayPause}
                      className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5 ml-0.5" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onNext}
                      className="text-gray-400 hover:text-white"
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off')}
                      className={`${repeatMode !== 'off' ? 'text-purple-400' : 'text-gray-400'} hover:text-white relative`}
                    >
                      <Repeat className="h-4 w-4" />
                      {repeatMode === 'one' && (
                        <Badge className="absolute -top-1 -right-1 h-3 w-3 p-0 text-xs bg-purple-500">
                          1
                        </Badge>
                      )}
                    </Button>
                  </div>

                  {/* Volume & Time */}
                  <div className="flex items-center gap-4 flex-1 justify-end">
                    <span className="text-xs text-gray-400 min-w-0">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-gray-400" />
                      <div 
                        className="w-20 h-1 bg-white/20 rounded-full cursor-pointer"
                        onClick={handleVolumeChange}
                      >
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          style={{ width: `${volume}%` }}
                        />
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onToggleFullscreen}
                      className="text-gray-400 hover:text-white"
                    >
                      {isFullscreen ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;