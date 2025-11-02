import { useEffect, useRef, useState } from "react";
import "./RadialSlider.css";

interface RadialSliderProps {
    value: number; // 0-100
    onChange: (value: number) => void;
    size?: number;
    label?: string;
}

function RadialSlider({ value, onChange, size = 100, label = "dB" }: RadialSliderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Convert value (0-100) to angle (0-270 degrees, starting from bottom)
    const valueToAngle = (val: number) => {
        return (val / 100) * 270 - 135; // -135 to 135 degrees
    };

    // Convert angle to value
    const angleToValue = (angle: number) => {
        // atan2 gives us angle where 0° is right (east)
        // We want our range to be from -135° (bottom-left) to 135° (bottom-right)
        // This creates a 270° arc with a 90° gap at the bottom
        
        // Normalize angle to -180 to 180 range
        let normalized = angle;
        
        // Check if angle is in the "dead zone" at the bottom (135° to 225° or -225° to -135°)
        if (normalized > 135 && normalized <= 180) {
            // Right side of dead zone - clamp to max
            return 100;
        } else if (normalized >= -180 && normalized < -135) {
            // Left side of dead zone - clamp to min
            return 0;
        }
        
        // Clamp to valid range
        normalized = Math.max(-135, Math.min(135, normalized));
        
        // Convert to 0-100
        return ((normalized + 135) / 270) * 100;
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        // Don't update value immediately to prevent jumping
    };

    const updateValue = (clientX: number, clientY: number) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate angle from center
        const deltaX = clientX - centerX;
        const deltaY = clientY - centerY;
        // atan2 returns angle in radians, convert to degrees
        // Note: atan2(y, x) gives us angle where 0° is right, increasing counter-clockwise
        let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        
        // Since SVG is rotated -90deg in CSS, we need to adjust
        // Add 90 to compensate for the CSS rotation
        angle = angle + 90;
        
        // Normalize to -180 to 180 range
        if (angle > 180) angle -= 360;
        if (angle < -180) angle += 360;

        const newValue = angleToValue(angle);
        onChange(Math.round(newValue));
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                updateValue(e.clientX, e.clientY);
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };
        
        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
            return () => {
                window.removeEventListener("mousemove", handleMouseMove);
                window.removeEventListener("mouseup", handleMouseUp);
            };
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDragging]);

    // Add wheel event listener with passive: false to allow preventDefault
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -5 : 5;
            const newValue = Math.max(0, Math.min(100, value + delta));
            onChange(newValue);
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        
        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [value, onChange]);

    const angle = valueToAngle(value);
    const radius = (size - 10) / 2;
    const strokeWidth = 8;
    const center = size / 2;

    // Calculate arc path
    const startAngle = -135;
    const endAngle = 135;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const currentRad = (angle * Math.PI) / 180;

    const arcPath = (start: number, end: number) => {
        const x1 = center + radius * Math.cos(start);
        const y1 = center + radius * Math.sin(start);
        const x2 = center + radius * Math.cos(end);
        const y2 = center + radius * Math.sin(end);
        const largeArc = end - start > Math.PI ? 1 : 0;
        return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
    };

    // Handle position for the draggable knob
    const handleX = center + radius * Math.cos(currentRad);
    const handleY = center + radius * Math.sin(currentRad);

    // Calculate segment angles (matching audio meter: 50% green, 25% yellow, 15% orange, 10% red)
    const greenEnd = startRad + (endRad - startRad) * 0.5;  // 0-50%
    const yellowEnd = greenEnd + (endRad - startRad) * 0.25; // 50-75%
    const orangeEnd = yellowEnd + (endRad - startRad) * 0.15; // 75-90%
    // redEnd = endRad (90-100%)

    // Determine active color based on current value
    const getActiveColor = () => {
        if (value >= 90) return "#ff0000"; // Red
        if (value >= 75) return "#ff9800"; // Orange
        if (value >= 50) return "#ffeb3b"; // Yellow
        return "#4caf50"; // Green
    };

    return (
        <div className="radial-slider-container" ref={containerRef}>
            <svg width={size} height={size} className="radial-slider-svg">
                {/* Background segments with colors matching audio meter */}
                {/* Green zone: 0-50% */}
                <path
                    d={arcPath(startRad, greenEnd)}
                    fill="none"
                    stroke="rgba(76, 175, 80, 0.15)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="butt"
                />
                {/* Yellow zone: 50-75% */}
                <path
                    d={arcPath(greenEnd, yellowEnd)}
                    fill="none"
                    stroke="rgba(255, 235, 59, 0.15)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="butt"
                />
                {/* Orange zone: 75-90% */}
                <path
                    d={arcPath(yellowEnd, orangeEnd)}
                    fill="none"
                    stroke="rgba(255, 152, 0, 0.15)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="butt"
                />
                {/* Red zone: 90-100% */}
                <path
                    d={arcPath(orangeEnd, endRad)}
                    fill="none"
                    stroke="rgba(255, 0, 0, 0.15)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="butt"
                />
                
                {/* Active track */}
                <path
                    d={arcPath(startRad, currentRad)}
                    fill="none"
                    stroke={getActiveColor()}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />
                
                {/* Draggable handle */}
                <circle
                    cx={handleX}
                    cy={handleY}
                    r={8}
                    fill={getActiveColor()}
                    stroke="#fff"
                    strokeWidth={1}
                    className="radial-slider-handle"
                    onMouseDown={handleMouseDown}
                    style={{ cursor: isDragging ? "grabbing" : "grab" }}
                />
            </svg>
            
            {/* Value display */}
            <div className="radial-slider-value">
                <div className="value-display">
                    <span className="value-number">{value}</span>
                    <span className="value-label">{label}</span>
                </div>
                
                {/* Increment/Decrement buttons inside the ring */}
                <div className="radial-slider-controls">
                    <button
                        className="radial-slider-btn radial-slider-btn-minus"
                        onClick={() => onChange(Math.max(0, value - 1))}
                        title="Decrease by 1"
                    >
                        −
                    </button>
                    <button
                        className="radial-slider-btn radial-slider-btn-plus"
                        onClick={() => onChange(Math.min(100, value + 1))}
                        title="Increase by 1"
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RadialSlider;
