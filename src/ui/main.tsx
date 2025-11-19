import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Limits from './Limits/Limits.tsx'
import AudioMeter from './AudioMeter/AudioMeter.tsx'
import { useAudioMonitoring } from './Hooks/useAudioMonitoring.ts'
import { useLimitMonitor } from './Hooks/useLimitMonitor.ts'
import { SensitivitySettings } from './Settings/SensitivitySettings.tsx'

export function App() {
  const [limits, setLimits] = useState<LimitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const { startMonitoring } = useAudioMonitoring();

  // Monitor limits and trigger sounds when thresholds are exceeded
  useLimitMonitor({ limits });

  useEffect(() => {
    const loadLimits = async () => {
      if (window.electron) {
        console.log('Loading limits from file...');
        const result = await window.electron.loadLimits();
        if (result.success && result.data) {
          console.log('Limits loaded:', result.data);
          setLimits(result.data);
        } else {
          console.log('No limits found or error:', result.error);
          setLimits([]);
        }
      } else {
        console.warn('electron not available - running in browser mode');
      }
      setLoading(false);
    };
    loadLimits();
  }, []);

  // Auto-start audio monitoring when app loads
  useEffect(() => {
    startMonitoring();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateLimit = async (updatedLimit: LimitData) => {
    const updatedLimits = limits.map(limit => 
      limit.id === updatedLimit.id ? updatedLimit : limit
    );
    setLimits(updatedLimits);
    
    // Save to file
    if (window.electron) {
      await window.electron.saveLimits(updatedLimits);
    }
  };

  const deleteLimit = async (limitId: string) => {
    const updatedLimits = limits.filter(limit => limit.id !== limitId);
    setLimits(updatedLimits);
    
    // Save to file
    if (window.electron) {
      await window.electron.saveLimits(updatedLimits);
    }
  };

  const addNewLimit = async () => {
    const newLimit: LimitData = {
      id: `limit-${Date.now()}`,
      name: `New Limit ${limits.length + 1}`,
      timeframeFrom: '09:00',
      timeframeTo: '17:00',
      weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      soundFile: '',
      dbThreshold: 70
    };
    
    const updatedLimits = [...limits, newLimit];
    setLimits(updatedLimits);
    
    // Save to file
    if (window.electron) {
      await window.electron.saveLimits(updatedLimits);
    }
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleDragOver = (id: string) => {
    if (draggedId && draggedId !== id) {
      
      // Reorder the array
      const draggedIndex = limits.findIndex(l => l.id === draggedId);
      const targetIndex = limits.findIndex(l => l.id === id);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newLimits = [...limits];
        const [removed] = newLimits.splice(draggedIndex, 1);
        newLimits.splice(targetIndex, 0, removed);
        setLimits(newLimits);
        
        // Save to file
        if (window.electron) {
          window.electron.saveLimits(newLimits);
        }
      }
    }
  };

  if (loading) {
    return <div>Loading limits...</div>;
  }

  return (
    <div className="app-container">
      <div className="app-header" style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px', width: '100%' }}>
        <button 
          onClick={() => setShowSettings(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
          title="Sensitivity Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </div>

      {/* Audio Meter with Microphone Input */}
      <div className="demo-section">
        <AudioMeter width="100%" height="20px" />
      </div>
      
      <div className="button-container">
        <button onClick={addNewLimit}>
          Add New Limit
        </button>
      </div>

      <div className="limits-container">
        {limits.length === 0 ? (
          <div className="no-limits-message">No limits configured. Click "Add New Limit" to create one.</div>
        ) : (
          limits.map(limit => (
            <Limits 
              key={limit.id}
              limitData={limit}
              onUpdate={updateLimit}
              onDelete={deleteLimit}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              isDragging={draggedId === limit.id}
            />
          ))
        )}
      </div>

      <SensitivitySettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
