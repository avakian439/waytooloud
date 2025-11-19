import { useEffect, useRef } from 'react';
import { AudioController } from '../AudioController';

interface UseLimitMonitorProps {
  limits: LimitData[];
}

export function useLimitMonitor({ limits }: UseLimitMonitorProps) {
  const lastTriggeredRef = useRef<Map<string, number>>(new Map());
  const isPlayingRef = useRef<Map<string, boolean>>(new Map());
  const cooldownMs = 2000; // 2 second cooldown between plays for same limit
  const limitsRef = useRef(limits);
  
  // Update refs without causing re-render
  useEffect(() => {
    limitsRef.current = limits;
  }, [limits]);

  // Check limits on an interval
  useEffect(() => {
    const checkLimits = () => {
      const audioController = AudioController.getInstance();
      if (!audioController.isActive()) return;

      const currentAudioLevel = audioController.getAudioLevel();
      const now = Date.now();
      
      const currentTime = new Date().getHours() * 60 + new Date().getMinutes();
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const currentDay = dayNames[new Date().getDay()];

      for (const limit of limitsRef.current) {
        // Check if limit is active
        const isDayActive = limit.weekdays.includes(currentDay);
        
        const parseTime = (timeStr: string) => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours * 60 + minutes;
        };

        const fromTime = parseTime(limit.timeframeFrom);
        const toTime = parseTime(limit.timeframeTo);

        let isTimeActive = false;
        if (fromTime <= toTime) {
          isTimeActive = currentTime >= fromTime && currentTime <= toTime;
        } else {
          isTimeActive = currentTime >= fromTime || currentTime <= toTime;
        }

        const isLimitActive = isDayActive && isTimeActive;

        // Check if limit is active, has a sound file, and threshold is exceeded
        if (isLimitActive && limit.soundFile && currentAudioLevel >= limit.dbThreshold) {
          const lastTriggered = lastTriggeredRef.current.get(limit.id) || 0;
          const isCurrentlyPlaying = isPlayingRef.current.get(limit.id) || false;
          
          // Check cooldown and ensure not already playing
          if (!isCurrentlyPlaying && now - lastTriggered >= cooldownMs) {
            console.log(`Limit "${limit.name}" triggered: ${currentAudioLevel}dB >= ${limit.dbThreshold}dB`);
            
            // Mark as playing to prevent concurrent triggers
            isPlayingRef.current.set(limit.id, true);
            lastTriggeredRef.current.set(limit.id, now);
            
            // Play the sound
            try {
              let audioPath: string;
              
              if (window.electron) {
                // Use custom protocol to load sound file
                audioPath = 'sounds://' + limit.soundFile;
              } else {
                // Fallback for browser mode
                audioPath = limit.soundFile;
              }
              
              const audio = new Audio(audioPath);
              
              // Clear playing flag when sound ends or errors
              audio.addEventListener('ended', () => {
                isPlayingRef.current.set(limit.id, false);
              });
              
              audio.addEventListener('error', () => {
                isPlayingRef.current.set(limit.id, false);
              });
              
              audio.play().catch(error => {
                console.error(`Error playing sound for limit "${limit.name}":`, error);
                isPlayingRef.current.set(limit.id, false);
              });
              
            } catch (error) {
              console.error(`Error playing sound for limit "${limit.name}":`, error);
              isPlayingRef.current.set(limit.id, false);
            }
          }
        }
      }
    };

    // Run check every 250ms
    const interval = setInterval(checkLimits, 250);
    
    return () => clearInterval(interval);
  }, []); // No dependencies - run once on mount
}
