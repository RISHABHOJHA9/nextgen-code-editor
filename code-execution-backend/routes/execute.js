const express = require('express');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Promisified exec for compilation
const execPromise = (cmd, options) =>
  new Promise((resolve, reject) => {
    exec(cmd, options, (error, stdout, stderr) => {
      if (error) reject(stderr || error.message);
      else resolve(stdout);
    });
  });

// Run program with optional stdin input
const runWithInput = (command, args, cwd, inputData = '') =>
  new Promise((resolve, reject) => {
    const proc = spawn(command, args, { cwd, shell: true });

    let output = '';
    let error = '';

    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject('Error: Execution timed out.');
    }, 7000);

    if (inputData) {
      proc.stdin.write(inputData);
      proc.stdin.end();
    }

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      error += data.toString();
    });

    proc.on('close', (code, signal) => {
      clearTimeout(timer);
      if (signal === 'SIGKILL') return reject('Process killed due to timeout');
      if (code !== 0) return reject(error || `Exited with code ${code}`);
      resolve(output + (error ? '\n' + error : ''));
    });
  });

// POST /api/execute
router.post('/', async (req, res) => {
  const { code, language, input } = req.body; // now includes user input
  const userId = req.user?.id || 'tempuser';

  const userDir = path.join(__dirname, `../temp/${userId}`);
  if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

  let fileName;
  if (language === 'cpp') fileName = 'main.cpp';
  else if (language === 'java') fileName = 'Main.java';
  else if (language === 'python') fileName = 'main.py';
  else if (language === 'javascript') fileName = 'main.js';
  else return res.status(400).json({ error: 'Unsupported language' });

  const fullPath = path.join(userDir, fileName);
  fs.writeFileSync(fullPath, code);

  try {
    if (language === 'cpp') {
      await execPromise(`g++ "${fileName}" -o main.exe`, { cwd: userDir });
      const output = await runWithInput('cmd', ['/c', 'main.exe'], userDir, input);
      return res.json({ output });

    } else if (language === 'java') {
      await execPromise(`javac "${fileName}"`, { cwd: userDir });
      const output = await runWithInput('cmd', ['/c', 'java', '-cp', '.', 'Main'], userDir, input);
      return res.json({ output });

    } else if (language === 'python') {
      const output = await runWithInput('python', [fileName], userDir, input);
      return res.json({ output });

    } else if (language === 'javascript') {
      const output = await runWithInput('node', [fileName], userDir, input);
      return res.json({ output });
    }
  } catch (error) {
    return res.json({ output: error.toString() });
  }
});

module.exports = router;
