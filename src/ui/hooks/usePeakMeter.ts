import { useEffect, useRef, useState } from 'react';

interface PeakEntry {
  value: number;
  timestamp: number;
}

export function usePeakMeter(currentLevel: number, windowMs: number = 20000) {
  const [peakLevel, setPeakLevel] = useState(0);
  const peakHistoryRef = useRef<PeakEntry[]>([]);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    
    // Throttle updates to every 50ms to reduce lag
    if (now - lastUpdateRef.current < 50) {
      return;
    }
    lastUpdateRef.current = now;
    
    // Add current level to history if it's significant
    if (currentLevel > 0) {
      peakHistoryRef.current.push({
        value: currentLevel,
        timestamp: now
      });
    }

    // Remove entries older than the window
    const cutoffTime = now - windowMs;
    peakHistoryRef.current = peakHistoryRef.current.filter(
      entry => entry.timestamp >= cutoffTime
    );

    // Calculate the peak from the remaining entries
    if (peakHistoryRef.current.length > 0) {
      const maxPeak = Math.max(...peakHistoryRef.current.map(entry => entry.value));
      // Only update state if peak changed significantly (reduce unnecessary renders)
      setPeakLevel(prevPeak => {
        if (Math.abs(maxPeak - prevPeak) > 0.5) {
          return maxPeak;
        }
        return prevPeak;
      });
    } else {
      setPeakLevel(0);
    }
  }, [currentLevel, windowMs]);

  return peakLevel;
}
