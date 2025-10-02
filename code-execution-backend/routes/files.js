const express = require('express');
const router = express.Router();
const File = require('../models/File');
const authMiddleware = require('../middleware/authMiddleware');

// Get all files for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const files = await File.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get file content and language by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    // Send both content and language to frontend
    res.json({ content: file.content, language: file.language });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

// Create a new file
router.post('/', authMiddleware, async (req, res) => {
  const { fileName, language } = req.body;
  try {
    const newFile = new File({
      userId: req.user.id,
      fileName,
      language,
      content: ''
    });
    await newFile.save();
    res.status(201).json(newFile);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create file' });
  }
});

// Update file content
router.put('/:id', authMiddleware, async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'No content provided' });
  }

  try {
    const updatedFile = await File.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id }, // ensure ownership
      { content, updatedAt: Date.now() },
      { new: true }
    );

    if (!updatedFile) {
      return res.status(404).json({ error: 'File not found or not authorized' });
    }

    res.json(updatedFile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update file' });
  }
});


// Delete a file
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await File.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.json({ msg: 'File deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;
