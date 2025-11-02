import { useEffect, useRef, useState, memo } from "react";
import "./AudioMeter.css";
import { usePeakMeter } from "../hooks/usePeakMeter";

interface AudioMeterProps {
    level?: number; // 0-100 percentage
    width?: string;
    height?: string;
    showDebugSlider?: boolean;
    showPeakMeter?: boolean; // Show 20-second peak indicator
}

const AudioMeter = memo(function AudioMeter({ level = 0, width = "200px", height = "20px", showDebugSlider = false, showPeakMeter = true }: AudioMeterProps) {
    const [displayLevel, setDisplayLevel] = useState(level);
    const [debugLevel, setDebugLevel] = useState(level);
    const meterRef = useRef<HTMLDivElement>(null);
    const containerWidthRef = useRef<number>(0);
    const barWidthRef = useRef<number>(0);
    const peakLevel = usePeakMeter(barWidthRef.current, 20000); // Track peak over 20 seconds based on actual bar width
    const lastUpdateRef = useRef<number>(0);

    useEffect(() => {
        if (!showDebugSlider) {
            // Throttle updates to max 60fps
            const now = Date.now();
            if (now - lastUpdateRef.current < 16) {
                return;
            }
            lastUpdateRef.current = now;
            setDisplayLevel(Math.min(100, Math.max(0, level)));
        }
    }, [level, showDebugSlider]);

    // Cache container width once on mount and on resize
    useEffect(() => {
        if (meterRef.current) {
            containerWidthRef.current = meterRef.current.offsetWidth;
        }
    }, [width]);

    // Update bar width ref without triggering re-render
    useEffect(() => {
        if (containerWidthRef.current > 0) {
            barWidthRef.current = (displayLevel / 100) * containerWidthRef.current;
        }
    }, [displayLevel]);

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
                
                {/* Peak indicator - shows highest level in last 20 seconds */}
                {showPeakMeter && peakLevel > 0 && meterRef.current && (
                    <div 
                        className="audio-meter-peak"
                        style={{ 
                            left: `${peakLevel}px`
                        }}
                        title={`Peak: ${((peakLevel / meterRef.current.offsetWidth) * 100).toFixed(1)}% (last 20s)`}
                    />
                )}
                
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
});

export default AudioMeter;
