// CollaborativeEditor.js
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import MonacoEditor from './MonacoEditor';
import './CollaborativeEditor.css';
import { useTheme } from '../context/ThemeContext';

const SOCKET_SERVER_URL = 'http://localhost:5000';

function CollaborativeEditor() {
  const { roomId } = useParams();
  const [code, setCode] = useState('// Start coding...');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [notifications, setNotifications] = useState([]); // NEW
  const socketRef = useRef(null);
  const preventEmitRef = useRef(false);
  const debounceTimerRef = useRef(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);
    socketRef.current.emit('join-room', roomId);

    socketRef.current.on('code-update', (newCode) => {
      preventEmitRef.current = true;
      setCode(newCode);
    });

    socketRef.current.on('language-update', (newLang) => {
      setLanguage(newLang);
    });

    // Listen for user join/leave messages
    socketRef.current.on('user-connected', (msg) => {
      setNotifications(prev => [...prev, msg]);
    });

    socketRef.current.on('user-disconnected', (msg) => {
      setNotifications(prev => [...prev, msg]);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [roomId]);

  const onCodeChange = (newCode) => {
    setCode(newCode);

    if (preventEmitRef.current) {
      preventEmitRef.current = false;
      return;
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      socketRef.current.emit('code-change', { roomId, code: newCode });
    }, 300);
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    socketRef.current.emit('language-change', { roomId, language: newLang });
  };

  const runCode = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      setOutput(data.output);
    } catch (err) {
      setOutput('Error executing code');
    }
  };

  return (
    <div className="collab-wrapper">
      <div className="collab-header">
        <h2>NextGen Code Editor – Room ID: {roomId}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={toggleTheme}>
            {theme === 'dark' ? '🌞 Light Mode' : '🌙 Dark Mode'}
          </button>
          <button onClick={() => navigate('/')}>⏪ Leave Room</button>
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="notifications">
          {notifications.slice(-3).map((msg, idx) => (
            <div key={idx} className="notification-msg">{msg}</div>
          ))}
        </div>
      )}

      <div className="collab-controls">
        <select value={language} onChange={handleLanguageChange}>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
        </select>
        <button onClick={runCode}>Run Code</button>
      </div>

      <div className="collab-body">
        <div className="editor-section">
          <MonacoEditor code={code} setCode={onCodeChange} language={language} />
        </div>
        <div className="output-section">
          <h3>Output:</h3>
          <pre>{output}</pre>
        </div>
      </div>
    </div>
  );
}

export default CollaborativeEditor;
