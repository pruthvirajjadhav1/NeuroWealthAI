import { v4 as uuidv4 } from 'uuid';

interface AudioParameters {
  carrierFrequency: number;    // Base frequency (200-500 Hz)
  binauralDelta: number;       // Frequency difference between ears (0.5-40 Hz)
  modulation: {
    rate: number;              // Rate of amplitude modulation (0.1-2 Hz)
    depth: number;             // Depth of modulation (0-1)
  };
  harmonics: {
    frequencies: number[];     // Additional harmonic frequencies
    amplitudes: number[];      // Corresponding amplitudes
  };
  envelope: {
    attack: number;           // Attack time in seconds
    decay: number;            // Decay time in seconds
    sustain: number;          // Sustain level (0-1)
    release: number;          // Release time in seconds
  };
}

interface SessionMetadata {
  id: string;
  timestamp: number;
  wealthScore: number;
  sessionType: 'Confidence' | 'Opportunity' | 'Abundance' | 'Action';
  parameters: AudioParameters;
  checksum: string;
}

export class AudioGenerator {
  private sampleRate: number = 44100;
  private duration: number = 420; // 7 minutes
  private contexts: AudioContext[] = [];

  public cleanup(): void {
    // Clean up all AudioContext instances
    this.contexts.forEach(ctx => {
      if (ctx.state !== 'closed') {
        ctx.close();
      }
    });
    this.contexts = [];
  }

  private createContext(): AudioContext {
    const context = new AudioContext({ sampleRate: this.sampleRate });
    this.contexts.push(context);
    return new AudioContext({ sampleRate: this.sampleRate });
  }

  private generateUniqueParameters(
    wealthScore: number,
    sessionType: string,
    timestamp: number,
    entropy: number
  ): AudioParameters {
    // Create multiple sources of entropy
    const entropyArray = new Uint32Array(8);
    crypto.getRandomValues(entropyArray);
    
    // Combine entropy sources with dynamic factors
    const uniqueSeed = timestamp * wealthScore * entropyArray[0];
    
    // Custom random function with seed
    const seededRandom = () => {
      let seed = uniqueSeed;
      return () => {
        seed = (seed * 16807 + entropyArray[Math.floor(seed % 8)]) % 2147483647;
        return (seed - 1) / 2147483646;
      };
    };

    const random = seededRandom();

    // Define frequency ranges based on brainwave states
    const frequencyRanges = {
      Confidence: { 
        carrier: [200, 280],   // Lower theta waves for deep relaxation
        delta: [4, 7]          // Theta waves for enhanced intuition
      },
      Opportunity: { 
        carrier: [280, 360],   // Upper theta to lower alpha
        delta: [7, 10]         // Alpha waves for creative insight
      },
      Abundance: { 
        carrier: [360, 440],   // Alpha to low beta
        delta: [10, 15]        // Beta waves for focused awareness
      },
      Action: { 
        carrier: [440, 520],   // Beta waves
        delta: [15, 40]        // High beta for enhanced cognition
      }
    };

    const range = frequencyRanges[sessionType as keyof typeof frequencyRanges];
    
    // Generate carrier frequency with slight variations
    const baseCarrier = range.carrier[0] + 
      (range.carrier[1] - range.carrier[0]) * random();
    const carrierFrequency = baseCarrier * (0.98 + random() * 0.04);

    // Generate binaural delta with micro-variations
    const baseDelta = range.delta[0] + 
      (range.delta[1] - range.delta[0]) * random();
    const binauralDelta = baseDelta * (0.95 + random() * 0.1);

    // Generate harmonics with unique relationships
    const numHarmonics = 3 + Math.floor(random() * 4); // 3-6 harmonics
    const harmonics = {
      frequencies: Array(numHarmonics).fill(0).map((_, i) => {
        const harmonic = carrierFrequency * (i + 2);
        return harmonic * (0.98 + random() * 0.04);
      }),
      amplitudes: Array(numHarmonics).fill(0).map((_, i) => {
        const baseAmplitude = 0.15 / (i + 1);
        return baseAmplitude * (0.8 + random() * 0.4);
      })
    };

    // Generate unique modulation parameters
    const modulation = {
      rate: 0.1 + random() * 1.9,    // 0.1-2 Hz modulation
      depth: 0.2 + random() * 0.3     // 0.2-0.5 depth
    };

    // Generate unique envelope
    const envelope = {
      attack: 2 + random() * 3,       // 2-5s attack
      decay: 3 + random() * 4,        // 3-7s decay
      sustain: 0.8 + random() * 0.15, // 0.8-0.95 sustain
      release: 4 + random() * 4       // 4-8s release
    };

    return {
      carrierFrequency,
      binauralDelta,
      modulation,
      harmonics,
      envelope
    };
  }

  private generateBinauralBeat(
    context: AudioContext,
    params: AudioParameters,
    duration: number
  ): AudioBuffer {
    const samples = duration * this.sampleRate;
    const buffer = context.createBuffer(2, samples, this.sampleRate);
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    // Phase accumulators for smooth transitions
    let leftPhase = 0;
    let rightPhase = Math.PI / 4; // Initial phase offset
    let modPhase = 0;

    const twoPI = 2 * Math.PI;
    const sampleTime = 1 / this.sampleRate;

    for (let i = 0; i < samples; i++) {
      const t = i * sampleTime;
      
      // Calculate envelope
      let envelope = 1;
      if (t < params.envelope.attack) {
        envelope = t / params.envelope.attack;
      } else if (t < params.envelope.attack + params.envelope.decay) {
        const decayTime = t - params.envelope.attack;
        envelope = 1.0 - (1.0 - params.envelope.sustain) * 
          (decayTime / params.envelope.decay);
      } else if (t > duration - params.envelope.release) {
        envelope = (duration - t) / params.envelope.release;
      } else {
        envelope = params.envelope.sustain;
      }

      // Calculate amplitude modulation with phase
      const modulation = 1 + params.modulation.depth * 
        Math.sin(twoPI * params.modulation.rate * t + modPhase);

      // Generate base frequencies with phase accumulation
      const leftFreq = params.carrierFrequency;
      const rightFreq = params.carrierFrequency + params.binauralDelta;

      // Update phases
      leftPhase = (leftPhase + leftFreq * twoPI * sampleTime) % twoPI;
      rightPhase = (rightPhase + rightFreq * twoPI * sampleTime) % twoPI;
      modPhase = (modPhase + params.modulation.rate * twoPI * sampleTime) % twoPI;

      // Generate base signals
      let leftSignal = Math.sin(leftPhase);
      let rightSignal = Math.sin(rightPhase);

      // Add harmonics with phase-locked oscillators
      for (let h = 0; h < params.harmonics.frequencies.length; h++) {
        const harmonicFreq = params.harmonics.frequencies[h];
        const harmonicPhase = leftPhase * (harmonicFreq / params.carrierFrequency);
        const harmonicAmplitude = params.harmonics.amplitudes[h];
        
        leftSignal += Math.sin(harmonicPhase) * harmonicAmplitude;
        rightSignal += Math.sin(harmonicPhase * (1 + params.binauralDelta/params.carrierFrequency)) * 
          harmonicAmplitude;
      }

      // Normalize and apply envelope and modulation
      const normalizedLeft = leftSignal * 0.5;
      const normalizedRight = rightSignal * 0.5;
      
      leftChannel[i] = normalizedLeft * envelope * modulation;
      rightChannel[i] = normalizedRight * envelope * modulation;
    }

    return buffer;
  }

  public async generateNeuralTrack(
    wealthScore: number,
    sessionType: string,
    userEngagementLevel: number = 1,
    entropy: number = Date.now()
  ): Promise<{ buffer: AudioBuffer; metadata: SessionMetadata }> {
    const timestamp = Date.now();
    console.log('Generating neural track:', {
      wealthScore,
      sessionType,
      timestamp
    });

    const parameters = this.generateUniqueParameters(
      wealthScore,
      sessionType,
      timestamp,
      entropy
    );
    
    try {
      const context = this.createContext();
      const buffer = this.generateBinauralBeat(context, parameters, this.duration);
      
      // Clean up context
      setTimeout(() => context.close(), 0);

      const metadata: SessionMetadata = {
        id: uuidv4(),
        timestamp,
        wealthScore,
        sessionType: sessionType as SessionMetadata['sessionType'],
        parameters,
        checksum: this.calculateChecksum(buffer)
      };

      return { buffer, metadata };
    } catch (error) {
      console.error('Error generating neural track:', error);
      throw new Error('Failed to generate neural track');
    }
  }

  private calculateChecksum(buffer: AudioBuffer): string {
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    let checksum = 0;
    for (let i = 0; i < buffer.length; i += 1000) {
      checksum = (checksum * 31 + 
        (leftChannel[i] * 1000000 + rightChannel[i] * 1000000)) >>> 0;
    }
    
    return checksum.toString(16);
  }

  public async exportToBase64(buffer: AudioBuffer): Promise<string> {
    const offlineCtx = new OfflineAudioContext(
      2,
      this.sampleRate * this.duration,
      this.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;

    const masterGain = offlineCtx.createGain();
    masterGain.gain.value = 0.707; // -3dB normalization
    
    source.connect(masterGain);
    masterGain.connect(offlineCtx.destination);
    source.start();

    try {
      const renderedBuffer = await offlineCtx.startRendering();
      const wav = this.bufferToWav(renderedBuffer);
      const base64 = btoa(String.fromCharCode(...new Uint8Array(wav)));
      
      return `data:audio/wav;base64,${base64}`;
    } catch (error) {
      console.error('Error exporting audio:', error);
      throw new Error('Failed to export neural track');
    }
  }

  private bufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const length = buffer.length * buffer.numberOfChannels * 2;
    const wav = new ArrayBuffer(44 + length);
    const view = new DataView(wav);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // Write WAV header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, buffer.numberOfChannels, true);
    view.setUint32(24, this.sampleRate, true);
    view.setUint32(28, this.sampleRate * buffer.numberOfChannels * 2, true);
    view.setUint16(32, buffer.numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);

    // Write audio data
    const offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset + (i * buffer.numberOfChannels + channel) * 2, 
          sample * 0x7FFF, true);
      }
    }

    return wav;
  }
}
