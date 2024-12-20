const { AudioContext, OscillatorNode } = require('web-audio-api');
const fs = require('fs');
const path = require('path');
const wav = require('wav');

// Create test audio file
function generateTestAudio() {
  const context = new AudioContext();
  const oscillator = new OscillatorNode(context);
  
  // Configure oscillator
  oscillator.type = 'sine';
  oscillator.frequency.value = 440; // A4 note
  
  // Create WAV file
  const writer = new wav.FileWriter(
    path.join(__dirname, '../abundance-audio/test.wav'),
    {
      channels: 1,
      sampleRate: 44100,
      bitDepth: 16
    }
  );
  
  // Connect nodes
  oscillator.connect(context.destination);
  
  // Start recording
  oscillator.start();
  setTimeout(() => {
    oscillator.stop();
    writer.end();
    console.log('Generated test audio file');
  }, 2000);
}

generateTestAudio();
