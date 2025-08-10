import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Upload, Music, Search, Shuffle, Repeat, Heart, MoreHorizontal, Maximize2, Minimize2, List, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState('none');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(true);
  const [audioData, setAudioData] = useState(new Array(64).fill(0));

  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Initialize audio context and analyzer
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 128;
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
      }
    }
  }, []);

  // Load tracks from localStorage
  useEffect(() => {
    const savedTracks = localStorage.getItem('mp3-player-tracks');
    if (savedTracks) {
      try {
        setTracks(JSON.parse(savedTracks));
      } catch (error) {
        console.error('Error loading saved tracks:', error);
      }
    }
  }, []);

  // Save tracks to localStorage
  useEffect(() => {
    localStorage.setItem('mp3-player-tracks', JSON.stringify(tracks));
  }, [tracks]);

  // Audio visualizer
  useEffect(() => {
    if (!showVisualizer || !analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(1, '#06b6d4');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        
        x += barWidth;
      }

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    if (isPlaying) {
      draw();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, showVisualizer]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach((file) => {
      if (file.type.startsWith('audio/')) {
        const url = URL.createObjectURL(file);
        const newTrack = {
          id: Date.now() + Math.random(),
          name: file.name.replace(/\.[^/.]+\$/, ''),
          artist: 'Unknown Artist',
          url: url,
          duration: 0,
          liked: false
        };
        
        setTracks(prev => [...prev, newTrack]);
      }
    });
    
    // Reset the input
    event.target.value = '';
  };

  const playTrack = async (track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      setIsPlaying(false);
      audioRef.current?.pause();
    } else {
      setCurrentTrack(track);
      
      if (audioRef.current) {
        audioRef.current.src = track.url;
        
        try {
          await audioRef.current.play();
          setIsPlaying(true);
          
          // Connect to audio context for visualization
          if (audioContextRef.current && analyserRef.current && !sourceRef.current) {
            try {
              if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
              }
              
              sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
              sourceRef.current.connect(analyserRef.current);
              analyserRef.current.connect(audioContextRef.current.destination);
            } catch (error) {
              console.warn('Error connecting audio context:', error);
            }
          }
        } catch (error) {
          console.error('Error playing track:', error);
          setIsPlaying(false);
        }
      }
    }
  };

  const togglePlayPause = async () => {
    if (!currentTrack) return;
    
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current?.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  };

  const nextTrack = () => {
    if (!tracks.length || !currentTrack) return;
    
    const currentIndex = tracks.findIndex(track => track.id === currentTrack.id);
    let nextIndex;
    
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * tracks.length);
    } else {
      nextIndex = (currentIndex + 1) % tracks.length;
    }
    
    playTrack(tracks[nextIndex]);
  };

  const previousTrack = () => {
    if (!tracks.length || !currentTrack) return;
    
    const currentIndex = tracks.findIndex(track => track.id === currentTrack.id);
    let prevIndex;
    
    if (isShuffled) {
      prevIndex = Math.floor(Math.random() * tracks.length);
    } else {
      prevIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1;
    }
    
    playTrack(tracks[prevIndex]);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleEnded = () => {
    if (repeatMode === 'track') {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else if (repeatMode === 'all' || tracks.length > 1) {
      nextTrack();
    } else {
      setIsPlaying(false);
    }
  };

  const handleSeek = (e) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / progressBar.offsetWidth;
    const newTime = percentage * duration;
    
    if (audioRef.current && !isNaN(newTime)) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `\${minutes}:\${seconds.toString().padStart(2, '0')}`;
  };

  const filteredTracks = tracks.filter(track =>
    track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleLike = (trackId, e) => {
    e?.stopPropagation();
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, liked: !track.liked } : track
    ));
  };

  const removeTrack = (trackId, e) => {
    e?.stopPropagation();
    setTracks(prev => prev.filter(track => track.id !== trackId));
    if (currentTrack?.id === trackId) {
      setCurrentTrack(null);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={handleTimeUpdate}
        volume={volume}
        muted={isMuted}
      />

      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Music className="h-8 w-8 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">MP3 Player</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search tracks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Music Library */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-black/30 border-white/10 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <List className="h-5 w-5 mr-2" />
                  Music Library ({filteredTracks.length})
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Your uploaded music collection
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredTracks.length === 0 ? (
                  <div className="text-center py-12">
                    <Music className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg mb-2">
                      {tracks.length === 0 ? 'No music tracks found' : 'No tracks match your search'}
                    </p>
                    <p className="text-gray-500">
                      {tracks.length === 0 ? 'Upload some MP3 files to get started' : 'Try a different search term'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    <AnimatePresence>
                      {filteredTracks.map((track, index) => (
                        <motion.div
                          key={track.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex items-center space-x-4 p-3 rounded-lg cursor-pointer transition-all duration-200 \${
                            currentTrack?.id === track.id
                              ? 'bg-purple-600/30 border border-purple-500/50 shadow-lg'
                              : 'hover:bg-white/5 border border-transparent'
                          }`}
                          onClick={() => playTrack(track)}
                        >
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex-shrink-0"
                          >
                            {currentTrack?.id === track.id && isPlaying ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{track.name}</p>
                            <p className="text-gray-400 text-sm">{track.artist}</p>
                          </div>
                          
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => toggleLike(track.id, e)}
                              className="h-8 w-8 rounded-full hover:bg-white/10"
                            >
                              <Heart
                                className={`h-4 w-4 transition-colors \${
                                  track.liked ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'
                                }`}
                              />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => removeTrack(track.id, e)}
                              className="h-8 w-8 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Audio Visualizer */}
            {showVisualizer && (
              <Card className="bg-black/30 border-white/10 backdrop-blur-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Audio Visualizer</CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="h-8 w-8 rounded-full text-gray-400 hover:text-white"
                    >
                      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`relative rounded-lg overflow-hidden \${isFullscreen ? 'h-96' : 'h-48'}`}>
                    <canvas
                      ref={canvasRef}
                      width={800}
                      height={isFullscreen ? 384 : 192}
                      className="w-full h-full bg-gradient-to-br from-slate-900/50 to-purple-900/50 cursor-pointer"
                    />
                    {!isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <Music className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                          <p className="text-gray-400">Play music to see visualizer</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Now Playing */}
            <AnimatePresence>
              {currentTrack && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="bg-black/30 border-white/10 backdrop-blur-lg">
                    <CardHeader>
                      <CardTitle className="text-white text-center">Now Playing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Album Art Placeholder */}
                      <div className="w-full aspect-square bg-gradient-to-br from-purple-600 to-cyan-600 rounded-lg flex items-center justify-center relative overflow-hidden">
                        <Music className="h-16 w-16 text-white/80" />
                        {isPlaying && (
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/50 to-cyan-600/50 animate-pulse" />
                        )}
                      </div>

                      {/* Track Info */}
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-white mb-1 truncate">{currentTrack.name}</h3>
                        <p className="text-gray-400">{currentTrack.artist}</p>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div
                          className="w-full h-2 bg-white/20 rounded-full cursor-pointer overflow-hidden"
                          onClick={handleSeek}
                        >
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-100"
                            style={{ width: `\${duration ? (currentTime / duration) * 100 : 0}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-sm text-gray-400">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center justify-center space-x-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsShuffled(!isShuffled)}
                          className={`h-10 w-10 rounded-full transition-colors \${
                            isShuffled ? 'text-purple-400 bg-purple-400/20' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          <Shuffle className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={previousTrack}
                          className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
                        >
                          <SkipBack className="h-5 w-5" />
                        </Button>

                        <Button
                          size="lg"
                          onClick={togglePlayPause}
                          className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 transition-all duration-200 hover:scale-105"
                        >
                          {isPlaying ? (
                            <Pause className="h-6 w-6" />
                          ) : (
                            <Play className="h-6 w-6 ml-1" />
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={nextTrack}
                          className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
                        >
                          <SkipForward className="h-5 w-5" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const modes = ['none', 'track', 'all'];
                            const currentIndex = modes.indexOf(repeatMode);
                            const nextMode = modes[(currentIndex + 1) % modes.length];
                            setRepeatMode(nextMode);
                          }}
                          className={`h-10 w-10 rounded-full transition-colors \${
                            repeatMode !== 'none' ? 'text-purple-400 bg-purple-400/20' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          <Repeat className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Volume Control */}
                      <div className="flex items-center space-x-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={toggleMute}
                          className="h-8 w-8 rounded-full text-gray-400 hover:text-white flex-shrink-0"
                        >
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                        <div className="flex-1 relative">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, #8b5cf6 0%, #06b6d4 \${volume * 100}%, rgba(255,255,255,0.2) \${volume * 100}%, rgba(255,255,255,0.2) 100%)`
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Stats */}
            <Card className="bg-black/30 border-white/10 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-white">Library Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <motion.div 
                    className="text-center p-3 rounded-lg bg-purple-600/20"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="text-2xl font-bold text-purple-400">{tracks.length}</div>
                    <div className="text-sm text-gray-400">Total Tracks</div>
                  </motion.div>
                  <motion.div 
                    className="text-center p-3 rounded-lg bg-cyan-600/20"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="text-2xl font-bold text-cyan-400">
                      {tracks.filter(track => track.liked).length}
                    </div>
                    <div className="text-sm text-gray-400">Liked Songs</div>
                  </motion.div>
                </div>

                <Separator className="my-4 bg-white/10" />

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Currently Playing</span>
                    <Badge variant="secondary" className="bg-purple-600/20 text-purple-300">
                      {currentTrack ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Shuffle Mode</span>
                    <Badge 
                      variant={isShuffled ? "default" : "secondary"} 
                      className={isShuffled ? "bg-purple-600" : "bg-gray-600"}
                    >
                      {isShuffled ? 'On' : 'Off'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Repeat Mode</span>
                    <Badge 
                      variant={repeatMode !== 'none' ? "default" : "secondary"} 
                      className={repeatMode !== 'none' ? "bg-purple-600" : "bg-gray-600"}
                    >
                      {repeatMode === 'none' ? 'Off' : repeatMode === 'track' ? 'Track' : 'All'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Custom Styles */}
      <style jsx>{`
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #06b6d4);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        input[type="range"]::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #06b6d4);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
