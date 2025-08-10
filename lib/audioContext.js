class AudioContextManager {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.dataArray = null;
    this.bufferLength = 0;
    this.isInitialized = false;
    this.gainNode = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Create AudioContext
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create analyser node for visualization
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(this.bufferLength);

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      
      // Connect nodes
      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      throw error;
    }
  }

  async resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  connectAudioElement(audioElement) {
    if (!this.isInitialized) {
      throw new Error('AudioContext not initialized');
    }

    try {
      // Disconnect previous source if exists
      if (this.source) {
        this.source.disconnect();
      }

      // Create new source from audio element
      this.source = this.audioContext.createMediaElementSource(audioElement);
      this.source.connect(this.gainNode);

      return this.source;
    } catch (error) {
      console.error('Failed to connect audio element:', error);
      throw error;
    }
  }

  getFrequencyData() {
    if (!this.analyser) return null;
    
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  getTimeDomainData() {
    if (!this.analyser) return null;
    
    this.analyser.getByteTimeDomainData(this.dataArray);
    return this.dataArray;
  }

  setVolume(volume) {
    if (this.gainNode) {
      // Convert linear volume (0-1) to exponential for better perception
      const exponentialVolume = volume * volume;
      this.gainNode.gain.setValueAtTime(exponentialVolume, this.audioContext.currentTime);
    }
  }

  getVolume() {
    if (this.gainNode) {
      // Convert back from exponential to linear
      return Math.sqrt(this.gainNode.gain.value);
    }
    return 1;
  }

  createBandpassFilter(frequency, Q = 1) {
    if (!this.audioContext) return null;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    filter.Q.setValueAtTime(Q, this.audioContext.currentTime);
    
    return filter;
  }

  createLowpassFilter(frequency) {
    if (!this.audioContext) return null;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    
    return filter;
  }

  createHighpassFilter(frequency) {
    if (!this.audioContext) return null;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    
    return filter;
  }

  // Get current time for synchronization
  getCurrentTime() {
    return this.audioContext ? this.audioContext.currentTime : 0;
  }

  // Get sample rate
  getSampleRate() {
    return this.audioContext ? this.audioContext.sampleRate : 44100;
  }

  // Cleanup resources
  disconnect() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
  }

  async close() {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.disconnect();
      await this.audioContext.close();
      this.audioContext = null;
      this.analyser = null;
      this.gainNode = null;
      this.isInitialized = false;
    }
  }
}

// Create singleton instance
const audioContextManager = new AudioContextManager();

// Utility functions for audio analysis
export const getAverageFrequency = (dataArray) => {
  if (!dataArray) return 0;
  
  const sum = dataArray.reduce((acc, val) => acc + val, 0);
  return sum / dataArray.length;
};

export const getBassLevel = (dataArray) => {
  if (!dataArray) return 0;
  
  // Bass frequencies are typically in the first 1/4 of the frequency spectrum
  const bassEnd = Math.floor(dataArray.length / 4);
  const bassData = dataArray.slice(0, bassEnd);
  return getAverageFrequency(bassData);
};

export const getTrebleLevel = (dataArray) => {
  if (!dataArray) return 0;
  
  // Treble frequencies are typically in the last 1/4 of the frequency spectrum
  const trebleStart = Math.floor(dataArray.length * 3 / 4);
  const trebleData = dataArray.slice(trebleStart);
  return getAverageFrequency(trebleData);
};

export const getMidLevel = (dataArray) => {
  if (!dataArray) return 0;
  
  // Mid frequencies are in the middle 1/2 of the frequency spectrum
  const midStart = Math.floor(dataArray.length / 4);
  const midEnd = Math.floor(dataArray.length * 3 / 4);
  const midData = dataArray.slice(midStart, midEnd);
  return getAverageFrequency(midData);
};

export const getPeakFrequency = (dataArray) => {
  if (!dataArray) return 0;
  
  let maxIndex = 0;
  let maxValue = 0;
  
  for (let i = 0; i < dataArray.length; i++) {
    if (dataArray[i] > maxValue) {
      maxValue = dataArray[i];
      maxIndex = i;
    }
  }
  
  return maxIndex;
};

// Normalize frequency data to 0-1 range
export const normalizeFrequencyData = (dataArray) => {
  if (!dataArray) return [];
  
  return Array.from(dataArray).map(value => value / 255);
};

// Create frequency bands for equalizer visualization
export const createFrequencyBands = (dataArray, numBands = 10) => {
  if (!dataArray) return [];
  
  const bands = [];
  const bandSize = Math.floor(dataArray.length / numBands);
  
  for (let i = 0; i < numBands; i++) {
    const start = i * bandSize;
    const end = Math.min(start + bandSize, dataArray.length);
    const bandData = dataArray.slice(start, end);
    const average = getAverageFrequency(bandData);
    bands.push(average / 255); // Normalize to 0-1
  }
  
  return bands;
};

export default audioContextManager;