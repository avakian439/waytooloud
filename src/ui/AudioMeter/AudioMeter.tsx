import { useEffect, useRef, useState, memo } from "react";
import "./AudioMeter.css";
import { AudioController } from "../AudioController";

interface AudioMeterProps {
    width?: string;
    height?: string;
    showDebugSlider?: boolean;
    showPeakMeter?: boolean; // Show 20-second peak indicator
}

const AudioMeter = memo(function AudioMeter({ width = "200px", height = "20px", showDebugSlider = false, showPeakMeter = true }: AudioMeterProps) {
    const [debugLevel, setDebugLevel] = useState(0);
    const meterRef = useRef<HTMLDivElement>(null);
    const fillRef = useRef<HTMLDivElement>(null);
    const peakRef = useRef<HTMLDivElement>(null);
    const containerWidthRef = useRef<number>(0);
    
    // Peak meter state refs
    const peakLevelRef = useRef<number>(0);
    const peakHistoryRef = useRef<{value: number, timestamp: number}[]>([]);
    const lastPeakUpdateRef = useRef<number>(0);
    
    const animationFrameRef = useRef<number | null>(null);

    // Determine bar color based on current level
    const getBarColor = (level: number) => {
        if (level >= 90) return "#ff0000"; // Red zone
        if (level >= 75) return "#ff9800"; // Orange zone
        if (level >= 50) return "#ffeb3b"; // Yellow zone
        return "#4caf50"; // Green zone
    };

    useEffect(() => {
        if (!showDebugSlider) {
            const updateMeter = () => {
                const now = Date.now();
                const audioController = AudioController.getInstance();
                let level = 0;
                
                if (audioController.isActive()) {
                    level = audioController.getAudioLevel();
                }
                
                // Direct DOM manipulation for main bar
                if (fillRef.current) {
                    fillRef.current.style.width = `${level}%`;
                    fillRef.current.style.backgroundColor = getBarColor(level);
                }
                
                // Peak Meter Logic
                if (showPeakMeter && containerWidthRef.current > 0) {
                    const currentPixelWidth = (level / 100) * containerWidthRef.current;
                    
                    // Add to history if significant
                    if (currentPixelWidth > 0) {
                        peakHistoryRef.current.push({
                            value: currentPixelWidth,
                            timestamp: now
                        });
                    }
                    
                    // Throttle peak updates to every 50ms
                    if (now - lastPeakUpdateRef.current >= 50) {
                        lastPeakUpdateRef.current = now;
                        
                        // Remove old entries (20s window)
                        const cutoffTime = now - 20000;
                        peakHistoryRef.current = peakHistoryRef.current.filter(
                            entry => entry.timestamp >= cutoffTime
                        );
                        
                        // Calculate max peak
                        let maxPeak = 0;
                        if (peakHistoryRef.current.length > 0) {
                            maxPeak = Math.max(...peakHistoryRef.current.map(entry => entry.value));
                        }
                        
                        // Update DOM if changed
                        if (Math.abs(maxPeak - peakLevelRef.current) > 0.5) {
                            peakLevelRef.current = maxPeak;
                            if (peakRef.current) {
                                peakRef.current.style.left = `${maxPeak}px`;
                                peakRef.current.title = `Peak: ${((maxPeak / containerWidthRef.current) * 100).toFixed(1)}% (last 20s)`;
                                // Hide if 0
                                peakRef.current.style.display = maxPeak > 0 ? 'block' : 'none';
                            }
                        }
                    }
                }

                animationFrameRef.current = requestAnimationFrame(updateMeter);
            };

            animationFrameRef.current = requestAnimationFrame(updateMeter);

            return () => {
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
            };
        } else {
             // In debug mode, update manually
             if (fillRef.current) {
                fillRef.current.style.width = `${debugLevel}%`;
                fillRef.current.style.backgroundColor = getBarColor(debugLevel);
            }
        }
    }, [showDebugSlider, debugLevel, showPeakMeter]);

    // Cache container width once on mount and on resize
    useEffect(() => {
        if (meterRef.current) {
            containerWidthRef.current = meterRef.current.offsetWidth;
        }
    }, [width]);

    const handleDebugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newLevel = Number(e.target.value);
        setDebugLevel(newLevel);
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
                    ref={fillRef}
                    className="audio-meter-fill"
                    style={{ 
                        width: '0%',
                        backgroundColor: getBarColor(0)
                    }}
                />
                
                {/* Peak indicator - shows highest level in last 20 seconds */}
                {showPeakMeter && (
                    <div 
                        ref={peakRef}
                        className="audio-meter-peak"
                        style={{ 
                            left: '0px',
                            display: 'none'
                        }}
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
