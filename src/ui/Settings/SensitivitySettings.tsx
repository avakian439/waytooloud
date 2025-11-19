import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AudioController } from '../AudioController';
import './SensitivitySettings.css';

interface SensitivitySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SensitivitySettings({ isOpen, onClose }: SensitivitySettingsProps) {
  const [minDb, setMinDb] = useState(-60);
  const [maxDb, setMaxDb] = useState(-10);

  useEffect(() => {
    if (isOpen) {
      const controller = AudioController.getInstance();
      const sensitivity = controller.getSensitivity();
      setMinDb(sensitivity.minDb);
      setMaxDb(sensitivity.maxDb);
    }
  }, [isOpen]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    // Ensure min doesn't cross max
    if (val < maxDb) {
      setMinDb(val);
      AudioController.getInstance().setSensitivity(val, maxDb);
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    // Ensure max doesn't cross min
    if (val > minDb) {
      setMaxDb(val);
      AudioController.getInstance().setSensitivity(minDb, val);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Sensitivity</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <div className="setting-group">
          <div className="setting-label">
            <span>Minimum Level (Silence)</span>
            <span className="setting-value">{minDb} dB</span>
          </div>
          <input
            type="range"
            min="-100"
            max="-30"
            value={minDb}
            onChange={handleMinChange}
            className="setting-slider"
          />
          <div className="settings-description">
            Sounds below this level will show as 0%. Lower this if the meter is too jumpy in a quiet room. (Default: -60 dB)
          </div>
        </div>

        <div className="setting-group">
          <div className="setting-label">
            <span>Maximum Level (100%)</span>
            <span className="setting-value">{maxDb} dB</span>
          </div>
          <input
            type="range"
            min="-40"
            max="0"
            value={maxDb}
            onChange={handleMaxChange}
            className="setting-slider"
          />
          <div className="settings-description">
            Sounds above this level will show as 100%. Lower this to make the meter more sensitive to quieter sounds. (Default: 0 dB)
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
