import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, MoreVertical, Clock, Music } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const TrackList = ({
  tracks = [],
  currentTrack = null,
  isPlaying = false,
  onTrackSelect,
  onPlay,
  onPause,
  onRemoveFromPlaylist,
  onAddToPlaylist,
  showDuration = true,
  showIndex = true,
  compact = false
}) => {
  const formatDuration = (duration) => {
    if (!duration) return '--:--';
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleTrackClick = (track, index) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        onPause?.();
      } else {
        onPlay?.();
      }
    } else {
      onTrackSelect?.(track, index);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  if (!tracks || tracks.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Music className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tracks found</h3>
          <p className="text-muted-foreground">
            Add some music to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full space-y-2"
    >
      {tracks.map((track, index) => {
        const isCurrentTrack = currentTrack?.id === track.id;
        const isCurrentlyPlaying = isCurrentTrack && isPlaying;

        return (
          <motion.div
            key={track.id || index}
            variants={itemVariants}
            className={`group ${compact ? 'mb-1' : 'mb-2'}`}
          >
            <Card 
              className={`
                transition-all duration-200 cursor-pointer hover:shadow-md
                ${isCurrentTrack 
                  ? 'bg-primary/5 border-primary/20 shadow-sm' 
                  : 'hover:bg-muted/50'
                }
              `}
              onClick={() => handleTrackClick(track, index)}
            >
              <CardContent className={`${compact ? 'p-3' : 'p-4'}`}>
                <div className="flex items-center space-x-3">
                  {/* Play/Pause Button */}
                  <div className="flex-shrink-0">
                    <Button
                      variant={isCurrentTrack ? "default" : "ghost"}
                      size={compact ? "sm" : "default"}
                      className={`
                        w-10 h-10 rounded-full transition-all duration-200
                        ${isCurrentTrack 
                          ? 'bg-primary hover:bg-primary/90' 
                          : 'opacity-0 group-hover:opacity-100'
                        }
                      `}
                    >
                      {isCurrentlyPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </Button>
                  </div>

                  {/* Track Index */}
                  {showIndex && !isCurrentTrack && (
                    <div className="flex-shrink-0 w-6 text-center">
                      <span className="text-sm text-muted-foreground group-hover:opacity-0 transition-opacity">
                        {index + 1}
                      </span>
                    </div>
                  )}

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className={`
                        font-medium truncate
                        ${isCurrentTrack ? 'text-primary' : 'text-foreground'}
                        ${compact ? 'text-sm' : 'text-base'}
                      `}>
                        {track.title || track.name || 'Unknown Track'}
                      </h4>
                      {isCurrentlyPlaying && (
                        <Badge variant="secondary" className="text-xs">
                          Playing
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className={`
                        text-muted-foreground truncate
                        ${compact ? 'text-xs' : 'text-sm'}
                      `}>
                        {track.artist || 'Unknown Artist'}
                      </p>
                      {track.album && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <p className={`
                            text-muted-foreground truncate
                            ${compact ? 'text-xs' : 'text-sm'}
                          `}>
                            {track.album}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Duration */}
                  {showDuration && (
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className={`
                        text-muted-foreground tabular-nums
                        ${compact ? 'text-xs' : 'text-sm'}
                      `}>
                        {formatDuration(track.duration)}
                      </span>
                    </div>
                  )}

                  {/* More Options */}
                  <div className="flex-shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size={compact ? "sm" : "default"}
                          className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTrackClick(track, index);
                          }}
                        >
                          {isCurrentlyPlaying ? 'Pause' : 'Play'}
                        </DropdownMenuItem>
                        {onAddToPlaylist && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToPlaylist(track);
                            }}
                          >
                            Add to Playlist
                          </DropdownMenuItem>
                        )}
                        {onRemoveFromPlaylist && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveFromPlaylist(track);
                            }}
                            className="text-destructive"
                          >
                            Remove from Playlist
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Progress Bar for Current Track */}
                {isCurrentTrack && track.progress !== undefined && (
                  <div className="mt-3">
                    <div className="w-full bg-muted rounded-full h-1">
                      <motion.div
                        className="bg-primary h-1 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${track.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default TrackList;