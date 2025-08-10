import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Separator } from './ui/separator';
import { 
  Plus, 
  Music, 
  Play, 
  Trash2, 
  Edit3, 
  ListMusic, 
  Clock,
  Shuffle,
  MoreVertical,
  X,
  Check
} from 'lucide-react';
import { cn } from '../lib/utils';

const PlaylistManager = ({ 
  playlists = [], 
  currentPlaylist, 
  onCreatePlaylist, 
  onDeletePlaylist, 
  onUpdatePlaylist,
  onPlayPlaylist,
  onAddToPlaylist,
  tracks = [],
  className 
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddTracksDialogOpen, setIsAddTracksDialogOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tracks based on search query
  const filteredTracks = tracks.filter(track =>
    track.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.album?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate playlist duration
  const getPlaylistDuration = (playlist) => {
    if (!playlist.tracks || playlist.tracks.length === 0) return '0:00';
    
    const totalSeconds = playlist.tracks.reduce((acc, track) => {
      return acc + (track.duration || 0);
    }, 0);
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle create playlist
  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    
    const newPlaylist = {
      id: Date.now().toString(),
      name: newPlaylistName.trim(),
      description: newPlaylistDescription.trim(),
      tracks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    onCreatePlaylist(newPlaylist);
    setNewPlaylistName('');
    setNewPlaylistDescription('');
    setIsCreateDialogOpen(false);
  };

  // Handle edit playlist
  const handleEditPlaylist = () => {
    if (!selectedPlaylist || !newPlaylistName.trim()) return;
    
    const updatedPlaylist = {
      ...selectedPlaylist,
      name: newPlaylistName.trim(),
      description: newPlaylistDescription.trim(),
      updatedAt: new Date().toISOString()
    };
    
    onUpdatePlaylist(updatedPlaylist);
    setIsEditDialogOpen(false);
    setSelectedPlaylist(null);
    setNewPlaylistName('');
    setNewPlaylistDescription('');
  };

  // Handle add tracks to playlist
  const handleAddTracksToPlaylist = () => {
    if (!selectedPlaylist || selectedTracks.length === 0) return;
    
    const updatedPlaylist = {
      ...selectedPlaylist,
      tracks: [...selectedPlaylist.tracks, ...selectedTracks],
      updatedAt: new Date().toISOString()
    };
    
    onUpdatePlaylist(updatedPlaylist);
    setSelectedTracks([]);
    setIsAddTracksDialogOpen(false);
    setSelectedPlaylist(null);
  };

  // Handle track selection
  const toggleTrackSelection = (track) => {
    setSelectedTracks(prev => {
      const isSelected = prev.some(t => t.id === track.id);
      if (isSelected) {
        return prev.filter(t => t.id !== track.id);
      } else {
        return [...prev, track];
      }
    });
  };

  // Open edit dialog
  const openEditDialog = (playlist) => {
    setSelectedPlaylist(playlist);
    setNewPlaylistName(playlist.name);
    setNewPlaylistDescription(playlist.description || '');
    setIsEditDialogOpen(true);
  };

  // Open add tracks dialog
  const openAddTracksDialog = (playlist) => {
    setSelectedPlaylist(playlist);
    setSelectedTracks([]);
    setSearchQuery('');
    setIsAddTracksDialogOpen(true);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Playlists</h2>
          <p className="text-gray-400 mt-1">
            {playlists.length} playlist{playlists.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Playlist
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Playlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Playlist Name
                </label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Enter playlist name..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  placeholder="Enter playlist description..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreatePlaylist}
                  disabled={!newPlaylistName.trim()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Playlists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {playlists.map((playlist) => (
            <motion.div
              key={playlist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={cn(
                'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-purple-500/50 transition-all duration-300',
                currentPlaylist?.id === playlist.id && 'border-purple-500 shadow-lg shadow-purple-500/20'
              )}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-white text-lg truncate">
                        {playlist.name}
                      </CardTitle>
                      {playlist.description && (
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                          {playlist.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(playlist)}
                        className="text-gray-400 hover:text-white hover:bg-gray-700"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeletePlaylist(playlist.id)}
                        className="text-gray-400 hover:text-red-400 hover:bg-gray-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center">
                        <Music className="w-4 h-4 mr-1" />
                        {playlist.tracks?.length || 0} tracks
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {getPlaylistDuration(playlist)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => onPlayPlaylist(playlist)}
                        disabled={!playlist.tracks || playlist.tracks.length === 0}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Play
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAddTracksDialog(playlist)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    
                    {currentPlaylist?.id === playlist.id && (
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                        <ListMusic className="w-3 h-3 mr-1" />
                        Playing
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {playlists.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-8 border border-gray-700">
            <ListMusic className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No playlists yet</h3>
            <p className="text-gray-400 mb-6">
              Create your first playlist to organize your music
            </p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Playlist
            </Button>
          </div>
        </motion.div>
      )}

      {/* Edit Playlist Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Playlist Name
              </label>
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEditPlaylist}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Tracks Dialog */}
      <Dialog open={isAddTracksDialogOpen} onOpenChange={setIsAddTracksDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              Add Tracks to {selectedPlaylist?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Search Input */}
            <div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tracks..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Track List */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredTracks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No tracks available</p>
                </div>
              ) : (
                filteredTracks.map((track) => {
                  const isSelected = selectedTracks.some(t => t.id === track.id);
                  const isAlreadyInPlaylist = selectedPlaylist?.tracks?.some(t => t.id === track.id);
                  
                  return (
                    <div
                      key={track.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-md border transition-colors cursor-pointer',
                        isSelected 
                          ? 'bg-purple-500/20 border-purple-500/50' 
                          : 'bg-gray-800 border-gray-700 hover:bg-gray-750',
                        isAlreadyInPlaylist && 'opacity-50 cursor-not-allowed'
                      )}
                      onClick={() => !isAlreadyInPlaylist && toggleTrackSelection(track)}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {isSelected ? (
                            <Check className="w-5 h-5 text-purple-400" />
                          ) : (
                            <Music className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">
                            {track.name}
                          </p>
                          <p className="text-gray-400 text-sm truncate">
                            {track.artist} • {track.album}
                          </p>
                        </div>
                      </div>
                      {isAlreadyInPlaylist && (
                        <Badge variant="secondary" className="text-xs">
                          Already added
                        </Badge>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Count */}
            {selectedTracks.length > 0 && (
              <div className="text-sm text-gray-400">
                {selectedTracks.length} track{selectedTracks.length !== 1 ? 's' : ''} selected
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setIsAddTracksDialogOpen(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddTracksToPlaylist}
                disabled={selectedTracks.length === 0}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Add {selectedTracks.length} Track{selectedTracks.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlaylistManager;