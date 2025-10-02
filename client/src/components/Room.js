import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { AuthContext } from '../context/AuthContext';
import './Room.css';

const Room = () => {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); // 👈 get logged-in user

  const handleCreateRoom = () => {
    const id = uuidv4();
    navigate(`/editor/${id}`);
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      navigate(`/editor/${roomId.trim()}`);
    } else {
      alert('Please enter a valid Room ID');
    }
  };

  return (
    <div className="room-page">
      <div className="room-box animate-fade-in">
        {user && <h3 className="welcome-msg">Welcome, {user.username} 👋</h3>}

        <h1 className="room-title">NextGen Collaboration</h1>
        <p className="room-subtitle">Create a new room or join an existing one</p>

        <div className="room-buttons">
          <button className="create-btn" onClick={handleCreateRoom}>
            🚀 Create Room
          </button>

          <div className="join-section">
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="room-input"
            />
            <button className="join-btn" onClick={handleJoinRoom}>
              🔗 Join Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
