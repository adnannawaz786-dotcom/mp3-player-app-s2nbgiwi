// Audio file storage management for local storage
class AudioStorage {
  constructor() {
    this.STORAGE_KEYS = {
      AUDIO_FILES: 'mp3_player_audio_files',
      PLAYLISTS: 'mp3_player_playlists',
      CURRENT_PLAYLIST: 'mp3_player_current_playlist',
      PLAYBACK_STATE: 'mp3_player_playback_state',
      USER_PREFERENCES: 'mp3_player_preferences',
      RECENTLY_PLAYED: 'mp3_player_recently_played'
    };
  }

  // Audio file management
  saveAudioFile(file, metadata = {}) {
    try {
      const audioFiles = this.getAudioFiles();
      const fileId = this.generateId();
      
      const audioFileData = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        duration: metadata.duration || 0,
        artist: metadata.artist || 'Unknown Artist',
        album: metadata.album || 'Unknown Album',
        title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
        genre: metadata.genre || 'Unknown',
        year: metadata.year || null,
        artwork: metadata.artwork || null,
        dateAdded: new Date().toISOString(),
        playCount: 0,
        lastPlayed: null,
        isFavorite: false
      };

      audioFiles.push(audioFileData);
      localStorage.setItem(this.STORAGE_KEYS.AUDIO_FILES, JSON.stringify(audioFiles));
      
      return fileId;
    } catch (error) {
      console.error('Error saving audio file:', error);
      return null;
    }
  }

  getAudioFiles() {
    try {
      const files = localStorage.getItem(this.STORAGE_KEYS.AUDIO_FILES);
      return files ? JSON.parse(files) : [];
    } catch (error) {
      console.error('Error getting audio files:', error);
      return [];
    }
  }

  getAudioFileById(id) {
    const audioFiles = this.getAudioFiles();
    return audioFiles.find(file => file.id === id) || null;
  }

  updateAudioFile(id, updates) {
    try {
      const audioFiles = this.getAudioFiles();
      const fileIndex = audioFiles.findIndex(file => file.id === id);
      
      if (fileIndex !== -1) {
        audioFiles[fileIndex] = { ...audioFiles[fileIndex], ...updates };
        localStorage.setItem(this.STORAGE_KEYS.AUDIO_FILES, JSON.stringify(audioFiles));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating audio file:', error);
      return false;
    }
  }

  deleteAudioFile(id) {
    try {
      const audioFiles = this.getAudioFiles();
      const filteredFiles = audioFiles.filter(file => file.id !== id);
      localStorage.setItem(this.STORAGE_KEYS.AUDIO_FILES, JSON.stringify(filteredFiles));
      
      // Remove from all playlists
      const playlists = this.getPlaylists();
      playlists.forEach(playlist => {
        playlist.tracks = playlist.tracks.filter(trackId => trackId !== id);
      });
      this.savePlaylists(playlists);
      
      return true;
    } catch (error) {
      console.error('Error deleting audio file:', error);
      return false;
    }
  }

  // Playlist management
  createPlaylist(name, description = '') {
    try {
      const playlists = this.getPlaylists();
      const playlistId = this.generateId();
      
      const playlist = {
        id: playlistId,
        name: name,
        description: description,
        tracks: [],
        dateCreated: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        artwork: null,
        isDefault: false
      };

      playlists.push(playlist);
      localStorage.setItem(this.STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
      
      return playlistId;
    } catch (error) {
      console.error('Error creating playlist:', error);
      return null;
    }
  }

  getPlaylists() {
    try {
      const playlists = localStorage.getItem(this.STORAGE_KEYS.PLAYLISTS);
      return playlists ? JSON.parse(playlists) : [];
    } catch (error) {
      console.error('Error getting playlists:', error);
      return [];
    }
  }

  getPlaylistById(id) {
    const playlists = this.getPlaylists();
    return playlists.find(playlist => playlist.id === id) || null;
  }

  updatePlaylist(id, updates) {
    try {
      const playlists = this.getPlaylists();
      const playlistIndex = playlists.findIndex(playlist => playlist.id === id);
      
      if (playlistIndex !== -1) {
        playlists[playlistIndex] = { 
          ...playlists[playlistIndex], 
          ...updates,
          lastModified: new Date().toISOString()
        };
        localStorage.setItem(this.STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating playlist:', error);
      return false;
    }
  }

  deletePlaylist(id) {
    try {
      const playlists = this.getPlaylists();
      const filteredPlaylists = playlists.filter(playlist => playlist.id !== id);
      localStorage.setItem(this.STORAGE_KEYS.PLAYLISTS, JSON.stringify(filteredPlaylists));
      return true;
    } catch (error) {
      console.error('Error deleting playlist:', error);
      return false;
    }
  }

  addTrackToPlaylist(playlistId, trackId) {
    try {
      const playlists = this.getPlaylists();
      const playlist = playlists.find(p => p.id === playlistId);
      
      if (playlist && !playlist.tracks.includes(trackId)) {
        playlist.tracks.push(trackId);
        playlist.lastModified = new Date().toISOString();
        localStorage.setItem(this.STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding track to playlist:', error);
      return false;
    }
  }

  removeTrackFromPlaylist(playlistId, trackId) {
    try {
      const playlists = this.getPlaylists();
      const playlist = playlists.find(p => p.id === playlistId);
      
      if (playlist) {
        playlist.tracks = playlist.tracks.filter(id => id !== trackId);
        playlist.lastModified = new Date().toISOString();
        localStorage.setItem(this.STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing track from playlist:', error);
      return false;
    }
  }

  reorderPlaylistTracks(playlistId, trackIds) {
    try {
      const playlists = this.getPlaylists();
      const playlist = playlists.find(p => p.id === playlistId);
      
      if (playlist) {
        playlist.tracks = trackIds;
        playlist.lastModified = new Date().toISOString();
        localStorage.setItem(this.STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error reordering playlist tracks:', error);
      return false;
    }
  }

  savePlaylists(playlists) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
      return true;
    } catch (error) {
      console.error('Error saving playlists:', error);
      return false;
    }
  }

  // Current playback state
  savePlaybackState(state) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.PLAYBACK_STATE, JSON.stringify(state));
      return true;
    } catch (error) {
      console.error('Error saving playback state:', error);
      return false;
    }
  }

  getPlaybackState() {
    try {
      const state = localStorage.getItem(this.STORAGE_KEYS.PLAYBACK_STATE);
      return state ? JSON.parse(state) : null;
    } catch (error) {
      console.error('Error getting playback state:', error);
      return null;
    }
  }

  // Current playlist
  setCurrentPlaylist(playlistId) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.CURRENT_PLAYLIST, playlistId);
      return true;
    } catch (error) {
      console.error('Error setting current playlist:', error);
      return false;
    }
  }

  getCurrentPlaylist() {
    try {
      return localStorage.getItem(this.STORAGE_KEYS.CURRENT_PLAYLIST);
    } catch (error) {
      console.error('Error getting current playlist:', error);
      return null;
    }
  }

  // User preferences
  saveUserPreferences(preferences) {
    try {
      const currentPrefs = this.getUserPreferences();
      const updatedPrefs = { ...currentPrefs, ...preferences };
      localStorage.setItem(this.STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updatedPrefs));
      return true;
    } catch (error) {
      console.error('Error saving user preferences:', error);
      return false;
    }
  }

  getUserPreferences() {
    try {
      const prefs = localStorage.getItem(this.STORAGE_KEYS.USER_PREFERENCES);
      return prefs ? JSON.parse(prefs) : {
        volume: 0.7,
        repeat: 'none', // 'none', 'one', 'all'
        shuffle: false,
        visualizerEnabled: true,
        visualizerType: 'bars',
        theme: 'dark',
        autoPlay: false,
        crossfade: false,
        showMiniPlayer: true
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return {};
    }
  }

  // Recently played tracks
  addToRecentlyPlayed(trackId) {
    try {
      const recentlyPlayed = this.getRecentlyPlayed();
      
      // Remove if already exists to avoid duplicates
      const filtered = recentlyPlayed.filter(item => item.trackId !== trackId);
      
      // Add to beginning
      filtered.unshift({
        trackId: trackId,
        playedAt: new Date().toISOString()
      });

      // Keep only last 50 tracks
      const limited = filtered.slice(0, 50);
      
      localStorage.setItem(this.STORAGE_KEYS.RECENTLY_PLAYED, JSON.stringify(limited));
      
      // Update play count
      this.incrementPlayCount(trackId);
      
      return true;
    } catch (error) {
      console.error('Error adding to recently played:', error);
      return false;
    }
  }

  getRecentlyPlayed() {
    try {
      const recent = localStorage.getItem(this.STORAGE_KEYS.RECENTLY_PLAYED);
      return recent ? JSON.parse(recent) : [];
    } catch (error) {
      console.error('Error getting recently played:', error);
      return [];
    }
  }

  // Play count and favorites
  incrementPlayCount(trackId) {
    try {
      const audioFiles = this.getAudioFiles();
      const fileIndex = audioFiles.findIndex(file => file.id === trackId);
      
      if (fileIndex !== -1) {
        audioFiles[fileIndex].playCount = (audioFiles[fileIndex].playCount || 0) + 1;
        audioFiles[fileIndex].lastPlayed = new Date().toISOString();
        localStorage.setItem(this.STORAGE_KEYS.AUDIO_FILES, JSON.stringify(audioFiles));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error incrementing play count:', error);
      return false;
    }
  }

  toggleFavorite(trackId) {
    try {
      const audioFiles = this.getAudioFiles();
      const fileIndex = audioFiles.findIndex(file => file.id === trackId);
      
      if (fileIndex !== -1) {
        audioFiles[fileIndex].isFavorite = !audioFiles[fileIndex].isFavorite;
        localStorage.setItem(this.STORAGE_KEYS.AUDIO_FILES, JSON.stringify(audioFiles));
        return audioFiles[fileIndex].isFavorite;
      }
      return false;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  }

  getFavorites() {
    const audioFiles = this.getAudioFiles();
    return audioFiles.filter(file => file.isFavorite);
  }

  // Search functionality
  searchTracks(query) {
    const audioFiles = this.getAudioFiles();
    const searchTerm = query.toLowerCase();
    
    return audioFiles.filter(file => 
      file.title.toLowerCase().includes(searchTerm) ||
      file.artist.toLowerCase().includes(searchTerm) ||
      file.album.toLowerCase().includes(searchTerm) ||
      file.genre.toLowerCase().includes(searchTerm)
    );
  }

  // Storage management
  getStorageUsage() {
    try {
      let totalSize = 0;
      for (let key in localStorage) {
        if (key.startsWith('mp3_player_')) {
          totalSize += localStorage[key].length;
        }
      }
      return {
        used: totalSize,
        usedMB: (totalSize / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      return { used: 0, usedMB: '0.00' };
    }
  }

  clearAllData() {
    try {
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  }

  exportData() {
    try {
      const data = {};
      Object.entries(this.STORAGE_KEYS).forEach(([name, key]) => {
        const value = localStorage.getItem(key);
        if (value) {
          data[name] = JSON.parse(value);
        }
      });
      return data;
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }

  importData(data) {
    try {
      Object.entries(data).forEach(([name, value]) => {
        const key = this.STORAGE_KEYS[name];
        if (key) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      });
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Utility method for generating unique IDs
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default AudioStorage;