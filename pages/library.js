import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Separator } from '../components/ui/separator';
import { 
  Music, 
  Upload, 
  Play, 
  Pause, 
  Search, 
  Filter, 
  Grid, 
  List, 
  MoreVertical,
  Trash2,
  Edit,
  Heart,
  Clock,
  Shuffle,
  Plus,
  FolderPlus
} from 'lucide-react';
import { audioStorage } from '../lib/audioStorage';

export default function Library() {
  const [tracks, setTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    try {
      const storedTracks = await audioStorage.getTracks();
      const storedPlaylists = await audioStorage.getPlaylists();
      setTracks(storedTracks || []);
      setPlaylists(storedPlaylists || []);
    } catch (error) {
      console.error('Error loading library:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    for (const file of files) {
      if (file.type.startsWith('audio/')) {
        try {
          const trackData = {
            id: Date.now() + Math.random(),
            name: file.name.replace(/\.[^/.]+$/, ''),
            artist: 'Unknown Artist',
            album: 'Unknown Album',
            genre: 'Unknown',
            duration: 0,
            file: file,
            url: URL.createObjectURL(file),
            dateAdded: new Date().toISOString(),
            playCount: 0,
            isFavorite: false
          };

          // Get audio duration
          const audio = new Audio(trackData.url);
          audio.addEventListener('loadedmetadata', async () => {
            trackData.duration = audio.duration;
            await audioStorage.addTrack(trackData);
            loadLibrary();
          });
        } catch (error) {
          console.error('Error processing file:', file.name, error);
        }
      }
    }
    
    setShowUploadDialog(false);
  };

  const handlePlayTrack = (track) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const handleDeleteTrack = async (trackId) => {
    try {
      await audioStorage.removeTrack(trackId);
      loadLibrary();
    } catch (error) {
      console.error('Error deleting track:', error);
    }
  };

  const handleToggleFavorite = async (trackId) => {
    try {
      const track = tracks.find(t => t.id === trackId);
      if (track) {
        const updatedTrack = { ...track, isFavorite: !track.isFavorite };
        await audioStorage.updateTrack(updatedTrack);
        loadLibrary();
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const handleCreatePlaylist = async () => {
    if (newPlaylistName.trim()) {
      try {
        const playlist = {
          id: Date.now(),
          name: newPlaylistName,
          tracks: [],
          dateCreated: new Date().toISOString(),
          description: ''
        };
        await audioStorage.createPlaylist(playlist);
        setNewPlaylistName('');
        setShowCreatePlaylist(false);
        loadLibrary();
      } catch (error) {
        console.error('Error creating playlist:', error);
      }
    }
  };

  const filteredTracks = tracks.filter(track => {
    const matchesSearch = track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         track.album.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || track.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const genres = ['all', ...new Set(tracks.map(track => track.genre))];

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Music Library</h1>
          <p className="text-gray-300">
            {tracks.length} tracks • {playlists.length} playlists
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-wrap gap-4 items-center justify-between"
        >
          <div className="flex flex-wrap gap-4 items-center">
            {/* Upload Button */}
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Music
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Upload Music Files</DialogTitle>
                </DialogHeader>
                <div className="p-6">
                  <input
                    type="file"
                    multiple
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg bg-gray-800 text-white"
                  />
                  <p className="text-gray-400 text-sm mt-2">
                    Select MP3, WAV, or other audio files
                  </p>
                </div>
              </DialogContent>
            </Dialog>

            {/* Create Playlist */}
            <Dialog open={showCreatePlaylist} onOpenChange={setShowCreatePlaylist}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Create Playlist
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Create New Playlist</DialogTitle>
                </DialogHeader>
                <div className="p-6">
                  <input
                    type="text"
                    placeholder="Playlist name"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  />
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleCreatePlaylist} className="bg-purple-600 hover:bg-purple-700">
                      Create
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreatePlaylist(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tracks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Genre Filter */}
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {genres.map(genre => (
                <option key={genre} value={genre}>
                  {genre === 'all' ? 'All Genres' : genre}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-purple-600' : 'border-gray-600 text-white hover:bg-gray-800'}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-purple-600' : 'border-gray-600 text-white hover:bg-gray-800'}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Playlists Section */}
        {playlists.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Playlists</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {playlists.map(playlist => (
                <Card key={playlist.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg mb-3 flex items-center justify-center">
                      <Music className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-white font-semibold truncate">{playlist.name}</h3>
                    <p className="text-gray-400 text-sm">{playlist.tracks.length} tracks</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        <Separator className="bg-gray-700 mb-8" />

        {/* Tracks Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Tracks</h2>
          
          {filteredTracks.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-12 text-center">
                <Music className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No tracks found</h3>
                <p className="text-gray-400 mb-4">
                  {tracks.length === 0 
                    ? 'Upload some music to get started' 
                    : 'Try adjusting your search or filter'
                  }
                </p>
                {tracks.length === 0 && (
                  <Button onClick={() => setShowUploadDialog(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Music
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredTracks.map((track, index) => (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all group">
                        <CardContent className="p-4">
                          <div className="aspect-square bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg mb-3 flex items-center justify-center relative group-hover:scale-105 transition-transform">
                            <Music className="w-8 h-8 text-white" />
                            <Button
                              onClick={() => handlePlayTrack(track)}
                              size="sm"
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                            >
                              {currentTrack?.id === track.id && isPlaying ? (
                                <Pause className="w-6 h-6 text-white" />
                              ) : (
                                <Play className="w-6 h-6 text-white" />
                              )}
                            </Button>
                          </div>
                          <h3 className="text-white font-semibold truncate mb-1">{track.name}</h3>
                          <p className="text-gray-400 text-sm truncate mb-2">{track.artist}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-xs">{formatDuration(track.duration)}</span>
                            <div className="flex gap-1">
                              <Button
                                onClick={() => handleToggleFavorite(track.id)}
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 hover:bg-gray-700"
                              >
                                <Heart className={`w-3 h-3 ${track.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                              </Button>
                              <Button
                                onClick={() => handleDeleteTrack(track.id)}
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 hover:bg-gray-700 text-gray-400 hover:text-red-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTracks.map((track, index) => (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Music className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-semibold truncate">{track.name}</h3>
                              <p className="text-gray-400 text-sm truncate">{track.artist} • {track.album}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="outline" className="border-gray-600 text-gray-300">
                                {track.genre}
                              </Badge>
                              <span className="text-gray-400 text-sm">{formatDuration(track.duration)}</span>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handlePlayTrack(track)}
                                  size="sm"
                                  className="bg-purple-600 hover:bg-purple-700"
                                >
                                  {currentTrack?.id === track.id && isPlaying ? (
                                    <Pause className="w-4 h-4" />
                                  ) : (
                                    <Play className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  onClick={() => handleToggleFavorite(track.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="hover:bg-gray-700"
                                >
                                  <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                                </Button>
                                <Button
                                  onClick={() => handleDeleteTrack(track.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="hover:bg-gray-700 text-gray-400 hover:text-red-400"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </div>
  );
}