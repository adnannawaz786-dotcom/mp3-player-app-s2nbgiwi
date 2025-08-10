import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Play, 
  Pause, 
  Music, 
  Clock, 
  Search, 
  Filter,
  Grid3X3,
  List,
  Upload,
  Trash2,
  Heart,
  MoreVertical,
  Shuffle,
  Repeat
} from 'lucide-react';

const MusicLibrary = ({ 
  tracks = [], 
  currentTrack, 
  isPlaying, 
  onTrackSelect, 
  onTrackPlay, 
  onTrackPause,
  onAddTrack,
  onRemoveTrack,
  onToggleFavorite 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'artist', 'duration', 'dateAdded'
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'favorites', 'recent'
  const [filteredTracks, setFilteredTracks] = useState([]);

  useEffect(() => {
    let filtered = tracks;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(track =>
        track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.album?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    switch (filterBy) {
      case 'favorites':
        filtered = filtered.filter(track => track.isFavorite);
        break;
      case 'recent':
        filtered = filtered.filter(track => {
          const daysSinceAdded = (Date.now() - new Date(track.dateAdded).getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceAdded <= 7;
        });
        break;
      default:
        break;
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'artist':
          return a.artist.localeCompare(b.artist);
        case 'duration':
          return a.duration - b.duration;
        case 'dateAdded':
          return new Date(b.dateAdded) - new Date(a.dateAdded);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredTracks(filtered);
  }, [tracks, searchQuery, sortBy, filterBy]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      if (file.type.startsWith('audio/')) {
        const audio = new Audio();
        const url = URL.createObjectURL(file);
        audio.src = url;
        
        audio.addEventListener('loadedmetadata', () => {
          const newTrack = {
            id: Date.now() + Math.random(),
            name: file.name.replace(/\.[^/.]+$/, ''),
            artist: 'Unknown Artist',
            album: 'Unknown Album',
            duration: audio.duration,
            url: url,
            file: file,
            dateAdded: new Date().toISOString(),
            isFavorite: false
          };
          onAddTrack(newTrack);
        });
      }
    });
    event.target.value = '';
  };

  const TrackGridItem = ({ track, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      className="group"
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/50 hover:border-blue-500/50 transition-all duration-300">
        <CardContent className="p-4">
          <div className="relative mb-4">
            <div className="w-full aspect-square bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center mb-3">
              <Music className="w-12 h-12 text-slate-400" />
            </div>
            
            {/* Play/Pause Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
              <Button
                size="sm"
                variant="ghost"
                className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => {
                  onTrackSelect(track);
                  if (currentTrack?.id === track.id && isPlaying) {
                    onTrackPause();
                  } else {
                    onTrackPlay();
                  }
                }}
              >
                {currentTrack?.id === track.id && isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </Button>
            </div>

            {/* Favorite Button */}
            <Button
              size="sm"
              variant="ghost"
              className={`absolute top-2 right-2 w-8 h-8 rounded-full ${
                track.isFavorite ? 'text-red-500 hover:text-red-600' : 'text-slate-400 hover:text-red-500'
              }`}
              onClick={() => onToggleFavorite(track.id)}
            >
              <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-current' : ''}`} />
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-white text-sm truncate">{track.name}</h3>
            <p className="text-slate-400 text-xs truncate">{track.artist}</p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(track.duration)}
              </span>
              {track.isFavorite && <Heart className="w-3 h-3 text-red-500 fill-current" />}
            </div>
          </div>

          {/* Currently Playing Indicator */}
          {currentTrack?.id === track.id && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs">
                {isPlaying ? 'Playing' : 'Paused'}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  const TrackListItem = ({ track, index }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className={`group flex items-center gap-4 p-3 rounded-lg hover:bg-slate-800/50 transition-all duration-200 ${
        currentTrack?.id === track.id ? 'bg-blue-500/10 border border-blue-500/30' : ''
      }`}
    >
      {/* Play Button */}
      <Button
        size="sm"
        variant="ghost"
        className="w-10 h-10 rounded-full flex-shrink-0"
        onClick={() => {
          onTrackSelect(track);
          if (currentTrack?.id === track.id && isPlaying) {
            onTrackPause();
          } else {
            onTrackPlay();
          }
        }}
      >
        {currentTrack?.id === track.id && isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </Button>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`font-medium truncate ${
            currentTrack?.id === track.id ? 'text-blue-400' : 'text-white'
          }`}>
            {track.name}
          </h3>
          {currentTrack?.id === track.id && (
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs">
              {isPlaying ? 'Playing' : 'Paused'}
            </Badge>
          )}
        </div>
        <p className="text-slate-400 text-sm truncate">{track.artist}</p>
      </div>

      {/* Duration */}
      <div className="text-slate-400 text-sm flex-shrink-0">
        {formatDuration(track.duration)}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="ghost"
          className={`w-8 h-8 ${
            track.isFavorite ? 'text-red-500 hover:text-red-600' : 'text-slate-400 hover:text-red-500'
          }`}
          onClick={() => onToggleFavorite(track.id)}
        >
          <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-current' : ''}`} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="w-8 h-8 text-slate-400 hover:text-red-500"
          onClick={() => onRemoveTrack(track.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Music Library</h2>
          <p className="text-slate-400">
            {filteredTracks.length} of {tracks.length} tracks
          </p>
        </div>

        {/* Upload Button */}
        <div className="relative">
          <input
            type="file"
            multiple
            accept="audio/*"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Upload className="w-4 h-4 mr-2" />
            Add Music
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search tracks, artists, albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Tracks</option>
            <option value="favorites">Favorites</option>
            <option value="recent">Recent</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="name">Name</option>
            <option value="artist">Artist</option>
            <option value="duration">Duration</option>
            <option value="dateAdded">Date Added</option>
          </select>

          {/* View Toggle */}
          <div className="flex border border-slate-700 rounded-lg overflow-hidden">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              className="rounded-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              className="rounded-none"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Track List/Grid */}
      <AnimatePresence mode="wait">
        {filteredTracks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Music className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-400 mb-2">
              {tracks.length === 0 ? 'No music in your library' : 'No tracks found'}
            </h3>
            <p className="text-slate-500 mb-4">
              {tracks.length === 0 
                ? 'Upload some music files to get started' 
                : 'Try adjusting your search or filters'
              }
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={viewMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredTracks.map((track, index) => (
                  <TrackGridItem key={track.id} track={track} index={index} />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredTracks.map((track, index) => (
                  <TrackListItem key={track.id} track={track} index={index} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MusicLibrary;