import { useEffect, useRef, useState } from "react";
import "./AudioMeter.css";

interface AudioMeterProps {
    level?: number; // 0-100 percentage
    width?: string;
    height?: string;
    showDebugSlider?: boolean;
}

function AudioMeter({ level = 0, width = "200px", height = "20px", showDebugSlider = false }: AudioMeterProps) {
    const [displayLevel, setDisplayLevel] = useState(level);
    const [debugLevel, setDebugLevel] = useState(level);
    const meterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!showDebugSlider) {
            setDisplayLevel(Math.min(100, Math.max(0, level)));
        }
    }, [level, showDebugSlider]);

    const handleDebugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newLevel = Number(e.target.value);
        setDebugLevel(newLevel);
        setDisplayLevel(newLevel);
    };

    // Determine bar color based on current level
    const getBarColor = () => {
        if (displayLevel >= 90) return "#ff0000"; // Red zone
        if (displayLevel >= 75) return "#ff9800"; // Orange zone
        if (displayLevel >= 50) return "#ffeb3b"; // Yellow zone
        return "#4caf50"; // Green zone
    };

    return (
        <div>
            <div 
                className="audio-meter-container" 
                ref={meterRef}
                style={{ width, height }}
            >
                {/* Background segments with different colors */}
                <div className="audio-meter-segments">
                    {/* Green zone: 0-50% */}
                    <div 
                        className="meter-segment green-zone"
                        style={{ width: '50%' }}
                    />
                    {/* Yellow zone: 50-75% */}
                    <div 
                        className="meter-segment yellow-zone"
                        style={{ width: '25%' }}
                    />
                    {/* Orange zone: 75-90% */}
                    <div 
                        className="meter-segment orange-zone"
                        style={{ width: '15%' }}
                    />
                    {/* Red zone: 90-100% */}
                    <div 
                        className="meter-segment red-zone"
                        style={{ width: '10%' }}
                    />
                </div>
                
                {/* Active fill slider */}
                <div 
                    className="audio-meter-fill"
                    style={{ 
                        width: `${displayLevel}%`,
                        backgroundColor: getBarColor()
                    }}
                />
                
                <div className="audio-meter-graduations">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="graduation-mark" />
                    ))}
                </div>
            </div>
            
            {/* Debug slider */}
            {showDebugSlider && (
                <div className="audio-meter-debug">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={debugLevel}
                        onChange={handleDebugChange}
                        className="debug-slider"
                    />
                    <span className="debug-value">{debugLevel}%</span>
                </div>
            )}
        </div>
    );
}

export default AudioMeter;
