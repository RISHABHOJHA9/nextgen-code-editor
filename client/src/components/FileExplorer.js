import React, { useState, useEffect } from 'react';
import axios from 'axios';


const FileExplorer = ({ onFileSelect, selectedFileId, userToken }) => {
  const [files, setFiles] = useState([]);
  const [fileName, setFileName] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);

  const fetchFiles = () => {
    setLoading(true);
    axios.get('http://localhost:5000/api/files', {
      headers: { Authorization: `Bearer ${userToken}` }
    })
    .then(res => setFiles(res.data))
    .catch(err => console.error('Failed to load files', err))
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFiles();
  }, [selectedFileId]); // you can remove selectedFileId here if you want to fetch once on mount

  const createFile = () => {
    if (!fileName.trim()) {
      alert('Enter file name');
      return;
    }

    // Optional: check for duplicate file name
    if (files.some(f => f.fileName === fileName.trim())) {
      alert('File name already exists');
      return;
    }

    setLoading(true);
    axios.post('http://localhost:5000/api/files', { fileName: fileName.trim(), language }, {
      headers: { Authorization: `Bearer ${userToken}` }
    })
    .then(res => {
  setFiles([res.data, ...files]);
  setFileName('');
  onFileSelect(res.data);  // 👈 Auto-select
})

    .catch(err => {
      console.error('Failed to create file', err);
      alert('Failed to create file');
    })
    .finally(() => setLoading(false));
  };

  const deleteFile = (id) => {
    setLoading(true);
    axios.delete(`http://localhost:5000/api/files/${id}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    })
    .then(() => {
      fetchFiles(); // refresh file list after deleting
      // Optionally: if the deleted file is selected, you can call onFileSelect(null)
    })
    .catch(err => {
      console.error('Failed to delete file', err);
      alert('Failed to delete file');
    })
    .finally(() => setLoading(false));
  };

  return (
    <div className="p-3 bg-gray-100 rounded-lg shadow w-full">
      <h2 className="text-lg font-semibold mb-2">Your Files</h2>

      <div className="flex gap-2 mb-3">
        <input
          className="border p-1 rounded flex-1"
          type="text"
          value={fileName}
          placeholder="New file name"
          onChange={(e) => setFileName(e.target.value)}
          disabled={loading}
        />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="border p-1 rounded"
          disabled={loading}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>
        <button
          onClick={createFile}
          className="bg-blue-500 text-white px-3 py-1 rounded"
          disabled={loading}
        >
          Create
        </button>
      </div>

      {loading ? (
        <p>Loading files...</p>
      ) : files.length === 0 ? (
        <p>No files found.</p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file._id}
              className={`flex justify-between items-center p-2 rounded cursor-pointer ${
                selectedFileId === file._id ? 'bg-blue-100' : 'bg-white'
              }`}
              onClick={() => onFileSelect(file)}
            >
              <span>{file.fileName} ({file.language})</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFile(file._id);
                }}
                className="text-red-500 text-sm"
                disabled={loading}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FileExplorer;
