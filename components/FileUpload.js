import React, { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Upload, Music, X, FileAudio } from 'lucide-react';

const FileUpload = ({ onFilesUploaded, acceptedFiles = [] }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFiles = async (files) => {
    setIsUploading(true);
    const validFiles = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('audio/') || file.name.toLowerCase().endsWith('.mp3')) {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      const processedFiles = await Promise.all(
        validFiles.map(async (file) => {
          return new Promise((resolve) => {
            const audio = new Audio();
            const url = URL.createObjectURL(file);
            
            audio.onloadedmetadata = () => {
              const fileData = {
                id: Date.now() + Math.random(),
                file: file,
                name: file.name.replace(/\.[^/.]+$/, ''),
                artist: 'Unknown Artist',
                duration: audio.duration,
                size: file.size,
                url: url,
                type: file.type
              };
              resolve(fileData);
            };
            
            audio.onerror = () => {
              resolve({
                id: Date.now() + Math.random(),
                file: file,
                name: file.name.replace(/\.[^/.]+$/, ''),
                artist: 'Unknown Artist',
                duration: 0,
                size: file.size,
                url: url,
                type: file.type
              });
            };
            
            audio.src = url;
          });
        })
      );

      setUploadedFiles(prev => [...prev, ...processedFiles]);
      if (onFilesUploaded) {
        onFilesUploaded(processedFiles);
      }
    }
    
    setIsUploading(false);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full space-y-4">
      <Card className="relative">
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
            ${dragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.mp3"
            onChange={handleChange}
            className="hidden"
          />
          
          <div className="flex flex-col items-center space-y-4">
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center transition-colors
              ${dragActive ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}
            `}>
              {isUploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              ) : (
                <Upload className="w-8 h-8" />
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {isUploading ? 'Processing files...' : 'Upload MP3 Files'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Drag and drop your music files here, or click to browse
              </p>
            </div>
            
            <Button 
              onClick={onButtonClick} 
              disabled={isUploading}
              className="mt-4"
            >
              <FileAudio className="w-4 h-4 mr-2" />
              Choose Files
            </Button>
          </div>
        </div>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Uploaded Files ({uploadedFiles.length})
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <Music className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {formatFileSize(file.size)}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {formatDuration(file.duration)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="text-gray-500 hover:text-red-500 ml-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default FileUpload;