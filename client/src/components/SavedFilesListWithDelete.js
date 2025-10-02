import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const SavedFilesListWithDelete = ({ onFileSelect, selectedFileId }) => {
  const { user } = useContext(AuthContext);
  const token = user?.token || localStorage.getItem('token');

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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

  useEffect(() => {
    fetchFiles();
  }, [token]);

  const handleDelete = async (fileId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this file?');
    if (!confirmDelete) return;

    setDeletingId(fileId);
    try {
      await axios.delete(`http://localhost:5000/api/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Refresh file list after delete
      await fetchFiles();

      // If deleted file was selected, clear selection
      if (selectedFileId === fileId) {
        onFileSelect(null);
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
      alert('Failed to delete file');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #333', borderRadius: '4px', padding: '0.5rem', backgroundColor: '#121212' }}>
      {loading ? (
        <p style={{ color: '#aaa' }}>Loading files...</p>
      ) : files.length === 0 ? (
        <p style={{ color: '#aaa' }}>No files found</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {files.map((file) => (
            <li
              key={file._id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.3rem 0.5rem',
                cursor: 'pointer',
                backgroundColor: selectedFileId === file._id ? '#004d40' : 'transparent',
                color: '#00ff88',
                borderRadius: '4px',
                marginBottom: '0.2rem',
              }}
              onClick={() => onFileSelect(file)}
            >
              <span>{file.fileName || 'Untitled'}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(file._id);
                }}
                disabled={deletingId === file._id}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'red',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                }}
                title="Delete file"
                aria-label={`Delete file ${file.fileName}`}
              >
                &#10006; {/* Unicode Cross Mark */}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SavedFilesListWithDelete;
