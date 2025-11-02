import { useState } from "react";
import "./Limits.css";

function Limits() {
    const [limitName, setLimitName] = useState("Example Limit");
    const [limitActive, setLimitActive] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [limitTimeframeFrom, setLimitTimeframeFrom] = useState("12:00");
    const [limitTimeframeTo, setLimitTimeframeTo] = useState("13:00");

    //Temporary storage for edits
    const [editName, setEditName] = useState(limitName);
    const [editActive, setEditActive] = useState(limitActive);
    const [editTimeframeFrom, setEditTimeframeFrom] = useState(limitTimeframeFrom);
    const [editTimeframeTo, setEditTimeframeTo] = useState(limitTimeframeTo);

    const handleEditClick = () => {
        setEditName(limitName);
        setEditActive(limitActive);
        setEditTimeframeFrom(limitTimeframeFrom);
        setEditTimeframeTo(limitTimeframeTo);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        setLimitName(editName);
        setLimitActive(editActive);
        setLimitTimeframeFrom(editTimeframeFrom);
        setLimitTimeframeTo(editTimeframeTo);
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    return (
        <div>
            <p>
                <span className="limit-name">{limitName}</span>
                <span className="limit-time">{limitTimeframeFrom} - {limitTimeframeTo}</span>

                <span className={`limit-status ${limitActive ? "active" : "inactive"}`}>
                    {limitActive ? "Active" : "Inactive"}
                </span>

                <span className="limit-edit" onClick={handleEditClick}>Edit</span>
                <span className="limit-delete">Delete</span>
            </p>

            {isModalOpen && (
                <div className="modal-overlay" onClick={handleCancel}>
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
                        <span className="form-group">
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
