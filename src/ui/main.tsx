import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Limits from './Limits/Limits.tsx'
import AudioMeter from './AudioMeter/AudioMeter.tsx'

export function App() {
  const [limits, setLimits] = useState<LimitData[]>([]);
  const [loading, setLoading] = useState(true);

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
      soundFile: ''
    };
    
    const updatedLimits = [...limits, newLimit];
    setLimits(updatedLimits);
    
    // Save to file
    if (window.electron) {
      await window.electron.saveLimits(updatedLimits);
    }
  };

  if (loading) {
    return <div>Loading limits...</div>;
  }

  return (
    <div className="app-container">
      {/* Audio Meter Demo */}
      <div className="demo-section">
        <AudioMeter level={60} width="100%" height="20px" showDebugSlider={true} />
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
            />
          ))
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
