// Audio monitoring hook for capturing microphone input
import { useEffect, useRef, useState } from 'react';

export function useAudioMonitoring() {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startMonitoring = async () => {
    try {
      console.log('Starting audio monitoring...');
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      console.log('Microphone access granted');

      // Create audio context
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Connect microphone to analyser
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      microphoneRef.current = microphone;
      
      console.log('Audio context created and connected');

      // Start analyzing audio
      // Using setInterval instead of requestAnimationFrame to ensure it works in background
      const updateAudioLevel = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate RMS (Root Mean Square) for more accurate perceived loudness
        let sumOfSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = dataArray[i] / 255;
          sumOfSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumOfSquares / dataArray.length);

        // Convert RMS to decibels (dB)
        // Reference: 0 dB = maximum level (1.0), silence approaches -infinity dB
        const db = 20 * Math.log10(Math.max(rms, 0.0001)); // Prevent log10(0)
        
        // Apply noise gate - filter out very quiet background noise
        const noiseGateThreshold = -50; // Threshold in dB
        if (db < noiseGateThreshold) {
          setAudioLevel(0);
          return;
        }
        
        // Map dB range to 0-100 scale
        // Typical range: -60 dB (quiet) to 0 dB (max)
        // Adjust these values to fine-tune sensitivity
        const minDb = -60; // Below this is considered silence
        const maxDb = -0;  // Headroom before clipping
        
        // Linear mapping of dB to percentage
        const normalizedDb = (db - minDb) / (maxDb - minDb);
        const level = Math.max(0, Math.min(100, normalizedDb * 100));

        setAudioLevel(level);
      };

      // Use setInterval for background operation (not throttled by browser)
      animationIdRef.current = setInterval(updateAudioLevel, 16) as unknown as number; // ~60fps
      setIsMonitoring(true);
      console.log('Audio monitoring started successfully (background-compatible)');

      return true;
    } catch (error) {
      console.error('Error starting audio monitoring:', error);
      alert('Failed to start audio monitoring. Please check microphone permissions.');
      return false;
    }
  };

  const stopMonitoring = () => {
    if (animationIdRef.current !== null) {
      clearInterval(animationIdRef.current);
      animationIdRef.current = null;
    }

    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    analyserRef.current = null;
    setAudioLevel(0);
    setIsMonitoring(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, []);

  return { audioLevel, isMonitoring, startMonitoring, stopMonitoring };
}
