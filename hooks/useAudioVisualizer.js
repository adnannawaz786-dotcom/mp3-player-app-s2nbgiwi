import { useState, useEffect, useRef, useCallback } from 'react';

export const useAudioVisualizer = (audioElement, isPlaying = false) => {
  const [frequencyData, setFrequencyData] = useState(new Uint8Array(0));
  const [waveformData, setWaveformData] = useState(new Uint8Array(0));
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [averageFrequency, setAverageFrequency] = useState(0);
  const [bassLevel, setBassLevel] = useState(0);
  const [midLevel, setMidLevel] = useState(0);
  const [trebleLevel, setTrebleLevel] = useState(0);

  const audioContextRef = useRef(null);
  const analyzerRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize Web Audio API
  const initializeAudioContext = useCallback(async () => {
    if (!audioElement || audioContextRef.current) return;

    try {
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Create analyzer node
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 512;
      analyzer.smoothingTimeConstant = 0.8;
      analyzerRef.current = analyzer;

      // Create source from audio element
      const source = audioContext.createMediaElementSource(audioElement);
      sourceRef.current = source;

      // Connect nodes
      source.connect(analyzer);
      analyzer.connect(audioContext.destination);

      setIsAnalyzing(true);
    } catch (error) {
      console.error('Error initializing audio context:', error);
    }
  }, [audioElement]);

  // Analyze audio data
  const analyzeAudio = useCallback(() => {
    if (!analyzerRef.current || !isPlaying) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      return;
    }

    const analyzer = analyzerRef.current;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const waveformArray = new Uint8Array(bufferLength);

    // Get frequency data
    analyzer.getByteFrequencyData(dataArray);
    analyzer.getByteTimeDomainData(waveformArray);

    setFrequencyData(new Uint8Array(dataArray));
    setWaveformData(new Uint8Array(waveformArray));

    // Calculate average frequency
    const sum = dataArray.reduce((acc, value) => acc + value, 0);
    const average = sum / bufferLength;
    setAverageFrequency(average);

    // Calculate frequency ranges
    const bassEnd = Math.floor(bufferLength * 0.1);
    const midEnd = Math.floor(bufferLength * 0.5);

    const bassSum = dataArray.slice(0, bassEnd).reduce((acc, val) => acc + val, 0);
    const midSum = dataArray.slice(bassEnd, midEnd).reduce((acc, val) => acc + val, 0);
    const trebleSum = dataArray.slice(midEnd).reduce((acc, val) => acc + val, 0);

    setBassLevel(bassSum / bassEnd);
    setMidLevel(midSum / (midEnd - bassEnd));
    setTrebleLevel(trebleSum / (bufferLength - midEnd));

    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, [isPlaying]);

  // Resume audio context if suspended
  const resumeAudioContext = useCallback(async () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
      } catch (error) {
        console.error('Error resuming audio context:', error);
      }
    }
  }, []);

  // Start visualization
  const startVisualization = useCallback(() => {
    if (isAnalyzing && !animationFrameRef.current) {
      resumeAudioContext();
      analyzeAudio();
    }
  }, [isAnalyzing, analyzeAudio, resumeAudioContext]);

  // Stop visualization
  const stopVisualization = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Get visualization bars data
  const getVisualizationBars = useCallback((barCount = 32) => {
    if (frequencyData.length === 0) return new Array(barCount).fill(0);

    const bars = [];
    const dataPerBar = Math.floor(frequencyData.length / barCount);

    for (let i = 0; i < barCount; i++) {
      const start = i * dataPerBar;
      const end = start + dataPerBar;
      const slice = frequencyData.slice(start, end);
      const average = slice.reduce((sum, value) => sum + value, 0) / slice.length;
      bars.push(average);
    }

    return bars;
  }, [frequencyData]);

  // Get circular visualization data
  const getCircularVisualization = useCallback((segments = 64) => {
    if (frequencyData.length === 0) return new Array(segments).fill(0);

    const data = [];
    const dataPerSegment = Math.floor(frequencyData.length / segments);

    for (let i = 0; i < segments; i++) {
      const start = i * dataPerSegment;
      const end = start + dataPerSegment;
      const slice = frequencyData.slice(start, end);
      const average = slice.reduce((sum, value) => sum + value, 0) / slice.length;
      data.push(average / 255); // Normalize to 0-1
    }

    return data;
  }, [frequencyData]);

  // Get waveform visualization data
  const getWaveformVisualization = useCallback((points = 128) => {
    if (waveformData.length === 0) return new Array(points).fill(128);

    const data = [];
    const dataPerPoint = Math.floor(waveformData.length / points);

    for (let i = 0; i < points; i++) {
      const start = i * dataPerPoint;
      data.push(waveformData[start] || 128);
    }

    return data;
  }, [waveformData]);

  // Initialize on audio element change
  useEffect(() => {
    if (audioElement) {
      initializeAudioContext();
    }

    return () => {
      stopVisualization();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [audioElement, initializeAudioContext, stopVisualization]);

  // Start/stop visualization based on playing state
  useEffect(() => {
    if (isPlaying && isAnalyzing) {
      startVisualization();
    } else {
      stopVisualization();
    }

    return () => {
      stopVisualization();
    };
  }, [isPlaying, isAnalyzing, startVisualization, stopVisualization]);

  return {
    frequencyData,
    waveformData,
    isAnalyzing,
    averageFrequency,
    bassLevel,
    midLevel,
    trebleLevel,
    getVisualizationBars,
    getCircularVisualization,
    getWaveformVisualization,
    startVisualization,
    stopVisualization,
    resumeAudioContext
  };
};

export default useAudioVisualizer;