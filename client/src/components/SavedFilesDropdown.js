import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const SavedFilesDropdown = ({ onFileSelect, selectedFileId }) => {
  const { user } = useContext(AuthContext);
  const token = user?.token || localStorage.getItem('token');

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const dropdownRef = useRef();

  useEffect(() => {
    fetchFiles();

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/files', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles(res.data || []);
    } catch (err) {
      console.error('Failed to fetch files:', err);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (file) => {
    setDropdownOpen(false);
    if (file._id !== selectedFileId) {
      onFileSelect(file);
    }
  };

  const handleDelete = async (fileId, e) => {
    e.stopPropagation();
    const confirm = window.confirm('Delete this file?');
    if (!confirm) return;

    setDeletingId(fileId);
    try {
      await axios.delete(`http://localhost:5000/api/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = files.filter(f => f._id !== fileId);
      setFiles(updated);

      if (selectedFileId === fileId) {
        onFileSelect(null);
      }
    } catch (err) {
      alert('Failed to delete file');
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', marginBottom: '1rem' }}>
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        style={{
          width: '100%',
          padding: '0.5rem',
          backgroundColor: '#222',
          color: '#0f0',
          border: '1px solid #555',
          borderRadius: '4px',
          textAlign: 'left',
        }}
      >
        {selectedFileId
          ? files.find((f) => f._id === selectedFileId)?.fileName || 'Selected File'
          : 'Select a file'}
      </button>

      {dropdownOpen && (
        <div
          style={{
            position: 'absolute',
            width: '100%',
            maxHeight: '100px',
            overflowY: 'auto',
            backgroundColor: '#111',
            border: '1px solid #444',
            borderRadius: '4px',
            marginTop: '0.3rem',
            zIndex: 10,
          }}
        >
          {loading ? (
            <div style={{ padding: '0.5rem', color: '#ccc' }}>Loading...</div>
          ) : files.length === 0 ? (
            <div style={{ padding: '0.5rem', color: '#ccc' }}>No files found</div>
          ) : (
            files.map((file) => (
              <div
                key={file._id}
                onClick={() => handleSelect(file)}
                style={{
                  padding: '0.4rem',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: selectedFileId === file._id ? '#004d40' : 'transparent',
                  color: '#0f0',
                  borderBottom: '1px solid #222',
                }}
              >
                <span>{file.fileName || 'Untitled'}</span>
                <button
                  onClick={(e) => handleDelete(file._id, e)}
                  disabled={deletingId === file._id}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'red',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.5rem',
                  }}
                  title="Delete file"
                >
                  ❌
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SavedFilesDropdown;
