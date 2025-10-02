import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import MonacoEditor from './MonacoEditor';
import SavedFilesDropdown from './SavedFilesDropdown';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './CodeEditor.css';

const defaultCodeByLanguage = {
  javascript: `console.log('Hello, World!');`,
  python: `print("Hello, World!")`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello, World!";\n  return 0;\n}`,
  java: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}`,
};

const CodeEditor = () => {
  const { user, logout } = useContext(AuthContext);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(defaultCodeByLanguage['javascript']);
  const [output, setOutput] = useState('');
  const [userInput, setUserInput] = useState(''); // NEW — stdin
  const [isRunning, setIsRunning] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileLanguage, setNewFileLanguage] = useState('javascript');
  const [creatingFile, setCreatingFile] = useState(false);
  const navigate = useNavigate();

  const token = user?.token || localStorage.getItem('token');

  useEffect(() => {
    if (!selectedFile) {
      setCode(defaultCodeByLanguage[language]);
    }
  }, [language, selectedFile]);

  const saveFileContent = async (fileId, newCode) => {
    if (!fileId) return;
    try {
      await axios.put(
        `http://localhost:5000/api/files/${fileId}`,
        { content: newCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Auto-save failed', err);
    }
  };

  const handleFileSelect = async (file) => {
    if (selectedFile && selectedFile._id !== file._id) {
      await saveFileContent(selectedFile._id, code);
    }
    setLoadingFile(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/files/${file._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCode(res.data.content || '');
      setLanguage(res.data.language || file.language);
      setSelectedFile(file);
    } catch (err) {
      console.error('Failed to load file content', err);
      setSelectedFile(null);
    } finally {
      setLoadingFile(false);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) {
      alert('No file selected');
      return;
    }
    try {
      await axios.put(
        `http://localhost:5000/api/files/${selectedFile._id}`,
        { content: code },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert('File saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save file');
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('Running...');
    try {
      const res = await axios.post(
        'http://localhost:5000/api/execute',
        { code, language, input: userInput }, // send stdin
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOutput(res.data.output || 'No output');
    } catch (err) {
      setOutput('Execution error');
    } finally {
      setIsRunning(false);
    }
  };

  const createFile = async () => {
    if (!newFileName.trim()) {
      alert('Enter file name');
      return;
    }
    setCreatingFile(true);
    try {
      const res = await axios.post(
        'http://localhost:5000/api/files',
        { fileName: newFileName.trim(), language: newFileLanguage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewFileName('');
      handleFileSelect(res.data);
    } catch (err) {
      alert('Failed to create file');
      console.error(err);
    } finally {
      setCreatingFile(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0e0e0e' }}>
      {/* Top Header */}
      <div style={{
        backgroundColor: '#1e1e1e',
        padding: '1rem 2rem',
        color: '#00ff88',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #444'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ margin: 0 }}>NextGen Code Editor</h2>
          <span style={{ fontSize: '0.9rem' }}>Welcome, {user?.username}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/room')} style={btnStyle}>
            Create / Join Room
          </button>
          <button onClick={logout} style={btnStyle}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Section */}
      <div style={{ display: 'flex', flexGrow: 1 }}>
        <div style={{ width: '25%', minWidth: '250px', backgroundColor: '#121212', padding: '1rem', color: '#00ff88' }}>
          <SavedFilesDropdown onFileSelect={handleFileSelect} selectedFileId={selectedFile?._id} />

          {/* New file creation */}
          <div style={{ marginTop: '1rem' }}>
            <input
              type="text"
              placeholder="New file name"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              disabled={creatingFile}
              style={{ width: '60%', marginRight: '0.5rem' }}
            />
            <select
              value={newFileLanguage}
              onChange={(e) => setNewFileLanguage(e.target.value)}
              disabled={creatingFile}
              style={{ marginRight: '0.5rem' }}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
            <button onClick={createFile} disabled={creatingFile}>
              {creatingFile ? 'Creating...' : 'Create File'}
            </button>
          </div>

          {/* Language selection */}
          <label style={{ marginTop: '1rem', display: 'block' }}>Choose Language:</label>
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              setSelectedFile(null);
            }}
            style={{ marginBottom: '1rem', width: '100%' }}
            disabled={loadingFile || !!selectedFile}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>

          <button onClick={handleRun} disabled={isRunning} style={{ marginBottom: '0.5rem', width: '100%' }}>
            {isRunning ? 'Running...' : 'Run'}
          </button>
          <button onClick={handleSave} disabled={!selectedFile} style={{ marginBottom: '1rem', width: '100%' }}>
            Save File
          </button>

          {/* User input for stdin */}
          <h3>User Input:</h3>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Enter input for your program..."
            style={{
              width: '100%',
              height: '80px',
              backgroundColor: '#1e1e1e',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '5px',
              padding: '0.5rem',
              marginBottom: '1rem',
              resize: 'none'
            }}
          ></textarea>

          {/* Output */}
          <h3>Output:</h3>
          <pre
            style={{
              backgroundColor: '#1e1e1e',
              padding: '1rem',
              borderRadius: '8px',
              whiteSpace: 'pre-wrap',
              maxHeight: '200px',
              overflowY: 'auto',
              color: '#fff',
            }}
          >
            {output}
          </pre>
        </div>

        <div style={{ flexGrow: 1 }}>
          <MonacoEditor code={code} setCode={setCode} language={language} />
        </div>
      </div>
    </div>
  );
};

const btnStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#00ff88',
  border: 'none',
  borderRadius: '5px',
  color: '#000',
  fontWeight: 'bold',
  cursor: 'pointer'
};

export default CodeEditor;
