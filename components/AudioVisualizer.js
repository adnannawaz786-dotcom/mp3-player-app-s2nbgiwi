'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

const AudioVisualizer = ({ 
  audioElement, 
  isPlaying, 
  className = '',
  type = 'bars', // 'bars', 'circular', 'waveform'
  color = '#3b82f6',
  height = 200,
  sensitivity = 1
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyzerRef = useRef(null);
  const sourceRef = useRef(null);
  const dataArrayRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize audio context and analyzer
  const initializeAudioContext = useCallback(() => {
    if (!audioElement || isInitialized) return;

    try {
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      
      // Create analyzer
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 256;
      analyzerRef.current.smoothingTimeConstant = 0.8;
      
      // Create source from audio element
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
      
      // Connect nodes
      sourceRef.current.connect(analyzerRef.current);
      analyzerRef.current.connect(audioContextRef.current.destination);
      
      // Create data array
      const bufferLength = analyzerRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing audio context:', error);
    }
  }, [audioElement, isInitialized]);

  // Resume audio context if needed
  const resumeAudioContext = useCallback(async () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
      } catch (error) {
        console.error('Error resuming audio context:', error);
      }
    }
  }, []);

  // Draw bars visualization
  const drawBars = useCallback((canvas, ctx, dataArray) => {
    const width = canvas.width;
    const height = canvas.height;
    const barCount = 64;
    const barWidth = width / barCount;
    
    ctx.clearRect(0, 0, width, height);
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(0.5, color + '80');
    gradient.addColorStop(1, color);
    
    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * dataArray.length);
      const barHeight = (dataArray[dataIndex] / 255) * height * sensitivity;
      
      ctx.fillStyle = gradient;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
      
      // Add glow effect
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
      ctx.shadowBlur = 0;
    }
  }, [color, sensitivity]);

  // Draw circular visualization
  const drawCircular = useCallback((canvas, ctx, dataArray) => {
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;
    const barCount = 128;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.3, 0, 2 * Math.PI);
    ctx.fillStyle = color + '20';
    ctx.fill();
    
    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * dataArray.length);
      const barHeight = (dataArray[dataIndex] / 255) * radius * sensitivity;
      const angle = (i / barCount) * 2 * Math.PI;
      
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barHeight);
      const y2 = centerY + Math.sin(angle) * (radius + barHeight);
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Add glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 5;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }, [color, sensitivity]);

  // Draw waveform visualization
  const drawWaveform = useCallback((canvas, ctx, dataArray) => {
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    const sliceWidth = width / dataArray.length;
    let x = 0;
    
    for (let i = 0; i < dataArray.length; i++) {
      const v = (dataArray[i] / 255) * sensitivity;
      const y = (v * height) / 2 + height / 2;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.stroke();
    
    // Add glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [color, sensitivity]);

  // Animation loop
  const animate = useCallback(() => {
    if (!analyzerRef.current || !dataArrayRef.current || !canvasRef.current) {
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Get frequency data
    analyzerRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // Draw visualization based on type
    switch (type) {
      case 'circular':
        drawCircular(canvas, ctx, dataArrayRef.current);
        break;
      case 'waveform':
        drawWaveform(canvas, ctx, dataArrayRef.current);
        break;
      default:
        drawBars(canvas, ctx, dataArrayRef.current);
    }
    
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [isPlaying, type, drawBars, drawCircular, drawWaveform]);

  // Handle canvas resize
  const handleResize = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (audioElement && !isInitialized) {
      initializeAudioContext();
    }
  }, [audioElement, initializeAudioContext, isInitialized]);

  // Handle resize
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Start/stop animation based on playing state
  useEffect(() => {
    if (isPlaying && isInitialized) {
      resumeAudioContext();
      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isInitialized, animate, resumeAudioContext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <motion.div
      className={`relative overflow-hidden rounded-lg bg-black/20 backdrop-blur-sm ${className}`}
      style={{ height }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ 
          width: '100%', 
          height: '100%',
          filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.3))'
        }}
      />
      
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/60 text-sm">
            Initializing visualizer...
          </div>
        </div>
      )}
      
      {!isPlaying && isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-12 h-12 rounded-full border-2 border-white/20"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      )}
    </motion.div>
  );
};

export default AudioVisualizer;