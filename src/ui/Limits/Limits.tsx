import { useState, useEffect, useCallback } from "react";
import "./Limits.css";

interface LimitsProps {
    limitData: LimitData;
    onUpdate: (updatedLimit: LimitData) => void;
    onDelete: (limitId: string) => void;
}

function Limits({ limitData, onUpdate, onDelete }: LimitsProps) {
    const [limitName, setLimitName] = useState(limitData.name);
    const [limitActive, setLimitActive] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [limitTimeframeFrom, setLimitTimeframeFrom] = useState(limitData.timeframeFrom);
    const [limitTimeframeTo, setLimitTimeframeTo] = useState(limitData.timeframeTo);
    const [limitWeekdays, setLimitWeekdays] = useState<string[]>(limitData.weekdays);
    const [limitSoundFile, setLimitSoundFile] = useState<string>(limitData.soundFile);

    // Check if limit is currently active based on time and weekday
    const checkLimitActive = useCallback(() => {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const currentDay = dayNames[now.getDay()];

        // Parse time strings (HH:MM) to minutes
        const parseTime = (timeStr: string) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const fromTime = parseTime(limitTimeframeFrom);
        const toTime = parseTime(limitTimeframeTo);

        // Check if current day is in selected weekdays
        const isDayActive = limitWeekdays.includes(currentDay);

        // Check if current time is within the timeframe
        let isTimeActive = false;
        if (fromTime <= toTime) {
            // Normal case: e.g., 09:00 to 17:00
            isTimeActive = currentTime >= fromTime && currentTime <= toTime;
        } else {
            // Crosses midnight: e.g., 23:00 to 02:00
            isTimeActive = currentTime >= fromTime || currentTime <= toTime;
        }

        return isDayActive && isTimeActive;
    }, [limitTimeframeFrom, limitTimeframeTo, limitWeekdays]);

    // Update limit active status every minute
    useEffect(() => {
        const updateActiveStatus = () => {
            setLimitActive(checkLimitActive());
        };

        // Check immediately
        updateActiveStatus();

        // Then check every minute
        const interval = setInterval(updateActiveStatus, 60000);

        return () => clearInterval(interval);
    }, [checkLimitActive]);

    //Temporary storage for edits
    const [editName, setEditName] = useState(limitName);
    const [editTimeframeFrom, setEditTimeframeFrom] = useState(limitTimeframeFrom);
    const [editTimeframeTo, setEditTimeframeTo] = useState(limitTimeframeTo);
    const [editWeekdays, setEditWeekdays] = useState<string[]>(limitWeekdays);
    const [editSoundFile, setEditSoundFile] = useState<string>(limitSoundFile);

    const handleEditClick = () => {
        setEditName(limitName);
        setEditTimeframeFrom(limitTimeframeFrom);
        setEditTimeframeTo(limitTimeframeTo);
        setEditWeekdays(limitWeekdays);
        setEditSoundFile(limitSoundFile);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        setLimitName(editName);
        setLimitTimeframeFrom(editTimeframeFrom);
        setLimitTimeframeTo(editTimeframeTo);
        setLimitWeekdays(editWeekdays);
        setLimitSoundFile(editSoundFile);

        // Call parent update callback
        const updatedLimit: LimitData = {
            id: limitData.id,
            name: editName,
            timeframeFrom: editTimeframeFrom,
            timeframeTo: editTimeframeTo,
            weekdays: editWeekdays,
            soundFile: editSoundFile
        };
        console.log('Updating limit:', updatedLimit);
        onUpdate(updatedLimit);

        setIsModalOpen(false);
    };

    const toggleWeekday = (day: string) => {
    setEditWeekdays(prev => 
        prev.includes(day) 
            ? prev.filter(d => d !== day)
            : [...prev, day]
    );};

    const handleFileSelect = async () => {
        if (window.electron) {
            const result = await window.electron.selectSoundFile();
            if (result.success && result.fileName) {
                setEditSoundFile(result.fileName);
            } else if (!result.canceled) {
                console.error('Error selecting sound file:', result.error);
                alert('Failed to select sound file: ' + (result.error || 'Unknown error'));
            }
        } else {
            // Fallback for browser mode
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'audio/*,.mp3,.wav,.ogg,.m4a';
            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    setEditSoundFile(file.name);
                }
            };
            input.click();
        }
    };

    const handlePlaySound = async () => {
        if (!editSoundFile) return;
        
        try {
            let audioPath: string;
            
            if (window.electron) {
                // Use custom protocol to load sound file
                audioPath = 'sounds://' + editSoundFile;
            } else {
                // Fallback for browser mode
                audioPath = editSoundFile;
            }
            
            const audio = new Audio(audioPath);
            audio.play().catch(error => {
                console.error('Error playing sound:', error);
                alert('Failed to play sound file');
            });
        } catch (error) {
            console.error('Error playing sound:', error);
            alert('Failed to play sound file');
        }
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete "${limitName}"?`)) {
            onDelete(limitData.id);
        }
    };

    return (
        <div className="limit-item">
            <div className="limit-content">
                <span className="limit-name">{limitName}</span>
                <span className="limit-time">{limitTimeframeFrom} - {limitTimeframeTo}</span>

                <span className={`limit-status ${limitActive ? "active" : "inactive"}`}>
                    {limitActive ? "Active" : "Inactive"}
                </span>

                <span className="limit-edit" onClick={handleEditClick}>Edit</span>
                <span className="limit-delete" onClick={handleDelete}>Delete</span>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Edit Limit</h2>
                        
                        <div className="form-group">
                            <label htmlFor="limit-name">Limit Name:</label>
                            <input
                                type="text"
                                id="limit-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                            />
                        </div>
                        <hr></hr>
                        <div className="form-group">
                            <label>Weekdays:</label>
                            <div className="weekday-selector">
                                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                                    <button
                                        key={day}
                                        type="button"
                                        className={`weekday-btn ${editWeekdays.includes(day) ? "selected" : ""}`}
                                        onClick={() => toggleWeekday(day)}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <span className="form-group" id="timeframe-group">
                            <label htmlFor="limit-timeframe-from">From:</label>
                            <input
                                type="time"
                                id="limit-timeframe-from"
                                value={editTimeframeFrom}
                                onChange={(e) => setEditTimeframeFrom(e.target.value)}
                            />
                            <label htmlFor="limit-timeframe-to">To:</label>
                            <input
                                type="time"
                                id="limit-timeframe-to"
                                value={editTimeframeTo}
                                onChange={(e) => setEditTimeframeTo(e.target.value)}
                            />
                        </span>
                        <hr></hr>
                        <div className="form-group">
                            <label htmlFor="sound-file">Sound File:</label>
                            <div className="file-browser">
                                <input
                                    type="text"
                                    id="sound-file"
                                    value={editSoundFile}
                                    readOnly
                                    placeholder="No sound file selected"
                                    className="file-input-display"
                                />
                                <button 
                                    type="button"
                                    onClick={handleFileSelect}
                                    className="btn-browse"
                                >
                                    Browse
                                </button>
                                {editSoundFile && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handlePlaySound}
                                            className="btn-play"
                                            title="Play sound"
                                        >
                                            ▶
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditSoundFile("")}
                                            className="btn-clear"
                                            title="Clear selection"
                                        >
                                            ✕
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button onClick={handleSave} className="btn-save">Save</button>
                            <button onClick={handleCancel} className="btn-cancel">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Limits;
