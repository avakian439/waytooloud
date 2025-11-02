type LimitData = {
  id: string;
  name: string;
  timeframeFrom: string;
  timeframeTo: string;
  weekdays: string[];
  soundFile: string;
  dbThreshold: number; // Volume threshold in dB (0-100)
}

interface Window {
  electron: {
    loadLimits: () => Promise<{ success: boolean; data?: LimitData[]; error?: string }>;
    saveLimits: (limits: LimitData[]) => Promise<void>;
    selectSoundFile: () => Promise<{ success: boolean; fileName?: string; filePath?: string; canceled?: boolean; error?: string }>;
    getSoundPath: (fileName: string) => Promise<string>;
    startAudioCapture: () => Promise<{ success: boolean; error?: string }>;
    stopAudioCapture: () => Promise<{ success: boolean; error?: string }>;
    onStartAudioMonitoring: (callback: () => void) => void;
    onStopAudioMonitoring: (callback: () => void) => void;
    onAudioLevel: (callback: (level: number) => void) => void;
  };
}