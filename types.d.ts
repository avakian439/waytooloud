type LimitData = {
  id: string;
  name: string;
  timeframeFrom: string;
  timeframeTo: string;
  weekdays: string[];
  soundFile: string;
}

interface Window {
  electron: {
    loadLimits: () => Promise<{ success: boolean; data?: LimitData[]; error?: string }>;
    saveLimits: (limits: LimitData[]) => Promise<void>;
    selectSoundFile: () => Promise<{ success: boolean; fileName?: string; filePath?: string; canceled?: boolean; error?: string }>;
    getSoundPath: (fileName: string) => Promise<string>;
  };
}