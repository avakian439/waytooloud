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

  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInput, setSelectedInput] = useState<string | null>(null);
  const [selectedOutput, setSelectedOutput] = useState<string | null>(null);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const controller = AudioController.getInstance();
      const sensitivity = controller.getSensitivity();
      setMinDb(sensitivity.minDb);
      setMaxDb(sensitivity.maxDb);

      const loadDevices = async () => {
        try {
          const devices = await controller.listAudioDevices();
          setInputDevices(devices.filter(d => d.kind === 'audioinput'));
          setOutputDevices(devices.filter(d => d.kind === 'audiooutput'));

          const storedInput = localStorage.getItem('audioInputDeviceId');
          const storedOutput = localStorage.getItem('audioOutputDeviceId');

          const initialInput = storedInput || controller.getInputDevice() || null;
          const initialOutput = storedOutput || controller.getOutputDevice() || null;

          setSelectedInput(initialInput);
          setSelectedOutput(initialOutput);

          controller.setInputDevice(initialInput);
          controller.setOutputDevice(initialOutput);
        } catch (error: any) {
          setDeviceError(
            'Unable to list audio devices. Make sure you have granted microphone access and try again.'
          );
          console.warn('Error listing audio devices:', error);
        }
      };

      loadDevices();
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

  const handleInputDeviceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value || null;
    setSelectedInput(id);
    const controller = AudioController.getInstance();
    controller.setInputDevice(id);
    localStorage.setItem('audioInputDeviceId', id ?? '');

    // Restart monitoring if already running so the new input takes effect
    if (controller.isActive()) {
      controller.stopMonitoring();
      await controller.startMonitoring();
    }
  };

  const handleOutputDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value || null;
    setSelectedOutput(id);
    const controller = AudioController.getInstance();
    controller.setOutputDevice(id);
    localStorage.setItem('audioOutputDeviceId', id ?? '');
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <div className="setting-group">
          <div className="setting-label">
            <span>Audio Input</span>
            <span className="setting-value">{selectedInput ? 'Custom' : 'System Default'}</span>
          </div>
          <select value={selectedInput ?? ''} onChange={handleInputDeviceChange}>
            <option value="">System Default</option>
            {inputDevices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Input (${device.deviceId.slice(0, 8)})`}
              </option>
            ))}
          </select>
          {deviceError ? (
            <div className="settings-description">{deviceError}</div>
          ) : (
            <div className="settings-description">
              Choose which microphone/input device the app uses for monitoring.
            </div>
          )}
        </div>

        <div className="setting-group">
          <div className="setting-label">
            <span>Audio Output</span>
            <span className="setting-value">{selectedOutput ? 'Custom' : 'System Default'}</span>
          </div>
          <select value={selectedOutput ?? ''} onChange={handleOutputDeviceChange}>
            <option value="">System Default</option>
            {outputDevices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Output (${device.deviceId.slice(0, 8)})`}
              </option>
            ))}
          </select>
          <div className="settings-description">
            Select which output device should play alert sounds (if supported by your platform).
          </div>
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
