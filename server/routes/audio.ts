import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const router = express.Router();

// Get current file's directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Directory containing the audio files
const audioFilesDir = path.resolve(__dirname, '../../abundance-audio');

// Ensure audio directory exists
if (!fs.existsSync(audioFilesDir)) {
  console.error('Audio directory not found:', audioFilesDir);
  fs.mkdirSync(audioFilesDir, { recursive: true });
}

// Get all MP3 files with detailed logging
const getAudioFiles = () => {
  try {
    console.log('Reading audio directory:', audioFilesDir);
    const files = fs.readdirSync(audioFilesDir);
    console.log('Found files:', files);
    
    const mp3Files = files.filter(file => file.endsWith('.mp3'));
    console.log('MP3 files:', mp3Files);
    
    const sortedFiles = mp3Files.sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.match(/\d+/)?.[0] || '0');
      return numA - numB;
    });
    
    console.log('Sorted MP3 files:', sortedFiles);
    return sortedFiles;
  } catch (error) {
    const err = error as { message?: string; code?: string };
    console.error('Error reading audio files:', err);
    console.error('Error details:', {
      error: err.message || 'Unknown error',
      code: err.code,
      path: audioFilesDir,
      exists: fs.existsSync(audioFilesDir)
    });
    return [];
  }
};

// Basic file validation
const validateFile = (filePath: string): boolean => {
  try {
    if (!fs.existsSync(filePath)) {
      console.error('File does not exist:', filePath);
      return false;
    }

    const stats = fs.statSync(filePath);
    console.log('File validation check:', {
      path: filePath,
      size: stats.size,
      exists: true,
      isFile: stats.isFile(),
      mode: stats.mode,
      directory: path.dirname(filePath)
    });
    
    if (!stats.isFile()) {
      console.error('Path is not a file:', filePath);
      return false;
    }
    
    if (stats.size === 0) {
      console.error('File is empty:', filePath);
      return false;
    }
    
    // Check if path contains the expected directory
    if (!filePath.includes('abundance-audio')) {
      console.error('File is not in the abundance-audio directory:', filePath);
      return false;
    }
    
    return true;
  } catch (error) {
    const err = error as { message?: string; code?: string };
    console.error('Error validating file:', {
      error: err.message || 'Unknown error',
      code: err.code,
      path: filePath
    });
    return false;
  }
};

router.get('/track', async (req, res) => {
  console.log('Audio request received:', {
    query: req.query,
    headers: req.headers,
    audioDir: {
      path: audioFilesDir,
      exists: fs.existsSync(audioFilesDir),
      contents: fs.existsSync(audioFilesDir) ? fs.readdirSync(audioFilesDir) : []
    }
  });
  
  const index = req.query.index;
  let fileStream: fs.ReadStream | null = null;
  
  try {
    // Check if directory exists
    if (!fs.existsSync(audioFilesDir)) {
      console.error('Audio directory missing:', audioFilesDir);
      return res.status(500).json({ 
        error: 'Audio directory not found',
        details: {
          path: audioFilesDir,
          attempted: true
        }
      });
    }

    const audioFiles = getAudioFiles();
    if (audioFiles.length === 0) {
      console.error('No audio files found in directory:', audioFilesDir);
      return res.status(404).json({ 
        error: 'No audio files available',
        details: {
          directory: audioFilesDir,
          contents: fs.readdirSync(audioFilesDir)
        }
      });
    }

    // Select and validate file
    const selectedFile = audioFiles[Math.floor(Math.random() * audioFiles.length)];
    const filePath = path.join(audioFilesDir, selectedFile);
    
    console.log('Attempting to serve audio file:', {
      selectedFile,
      fullPath: filePath,
      exists: fs.existsSync(filePath)
    });

    if (!validateFile(filePath)) {
      return res.status(404).json({ 
        error: 'Audio file validation failed',
        details: {
          file: selectedFile,
          path: filePath,
          exists: fs.existsSync(filePath)
        }
      });
    }

    const stat = fs.statSync(filePath);
    const range = req.headers.range;

    // Essential headers for MP3 streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      
      if (start >= stat.size) {
        res.status(416).send('Requested range not satisfiable');
        return;
      }

      const contentLength = end - start + 1;
      res.statusCode = 206;
      res.setHeader('Content-Length', contentLength);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);

      fileStream = fs.createReadStream(filePath, { 
        start, 
        end,
        highWaterMark: 1024 * 64 // 64KB chunks
      });
    } else {
      res.setHeader('Content-Length', stat.size);
      fileStream = fs.createReadStream(filePath, {
        highWaterMark: 1024 * 64 // 64KB chunks
      });
    }

    // Error handling for the stream
    fileStream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming audio file' });
      }
      fileStream?.destroy();
    });

    // Pipe the file stream to response
    fileStream.pipe(res);

    // Handle client disconnect
    res.on('close', () => {
      fileStream?.destroy();
    });

  } catch (error) {
    console.error('Error serving audio:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error serving audio file' });
    }
    if (fileStream) {
      fileStream.destroy();
    }
  }
});

export default router;
