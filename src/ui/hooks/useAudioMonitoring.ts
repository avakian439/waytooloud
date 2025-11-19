// Audio monitoring hook for capturing microphone input
import { useEffect, useState, useCallback } from 'react';
import { AudioController } from '../AudioController';

export function useAudioMonitoring() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const audioController = AudioController.getInstance();

  const startMonitoring = useCallback(async () => {
    const success = await audioController.startMonitoring();
    setIsMonitoring(success);
    return success;
  }, []);

  const stopMonitoring = useCallback(() => {
    audioController.stopMonitoring();
    setIsMonitoring(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return { isMonitoring, startMonitoring, stopMonitoring };
}
