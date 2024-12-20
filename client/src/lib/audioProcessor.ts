import { AudioGenerator } from './audioGenerator';

export class AudioProcessor {
  private context: AudioContext;
  private analyser: AnalyserNode;
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  constructor() {
    this.context = new AudioContext();
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;
  }

  getAnalyserNode(): AnalyserNode {
    return this.analyser;
  }

  private voiceHistory: boolean[] = [];
  private readonly HISTORY_SIZE = 30; // Keep track of last 30 seconds
  private readonly VOICE_THRESHOLD = 15; // Lower threshold for voice detection
  private readonly SPEAKING_RATIO_THRESHOLD = 0.3; // Need to speak for 30% of the time

  async getVoiceMetrics(): Promise<{ isSpeaking: boolean; hasSpokenEnough: boolean }> {
    // Calculate the ratio of time spent speaking
    const speakingFrames = this.voiceHistory.filter(Boolean).length;
    const speakingRatio = speakingFrames / this.voiceHistory.length;
    
    console.log('Voice metrics:', {
      historyLength: this.voiceHistory.length,
      speakingFrames,
      speakingRatio,
      threshold: this.SPEAKING_RATIO_THRESHOLD
    });
    
    return {
      isSpeaking: this.isVoiceDetected(),
      hasSpokenEnough: speakingRatio >= this.SPEAKING_RATIO_THRESHOLD
    };
  }

  isVoiceDetected(): boolean {
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    
    // Calculate average frequency magnitude
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const isVoice = average > this.VOICE_THRESHOLD;
    
    // Log voice detection details (every 5th frame to avoid console spam)
    if (this.voiceHistory.length % 5 === 0) {
      console.log('Voice detection:', {
        average,
        threshold: this.VOICE_THRESHOLD,
        isVoice,
        historyLength: this.voiceHistory.length
      });
    }
    
    // Update voice history
    this.voiceHistory.push(isVoice);
    if (this.voiceHistory.length > this.HISTORY_SIZE) {
      this.voiceHistory.shift();
    }
    
    return isVoice;
  }

  async startRecording(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.context.createMediaStreamSource(this.stream);
      source.connect(this.analyser);

      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.start();
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (this.mediaRecorder) {
        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
          this.stream?.getTracks().forEach(track => track.stop());
          resolve(audioBlob);
        };
        this.mediaRecorder.stop();
      }
    });
  }

  async calculateWealthScore(
    isFirstRecording: boolean = false,
    currentDay: number = 0,
    previousScore: number = 0,
    gammaSessionCompleted: boolean = false,
    wealthAffirmationCompleted: boolean = false
  ): Promise<number> {
    console.log('[WealthScore] Starting calculation with:', {
      isFirstRecording,
      currentDay,
      previousScore,
      gammaSessionCompleted,
      wealthAffirmationCompleted
    });

    // For first recording, return random initial score between 10-25
    if (isFirstRecording || !previousScore) {
      const initialScore = Math.floor(Math.random() * 16) + 10;
      console.log('[WealthScore] First recording, returning initial score:', initialScore);
      return initialScore;
    }

    // If gamma session not completed, return previous score
    if (!gammaSessionCompleted) {
      console.log('[WealthScore] No gamma session completed - keeping previous score:', previousScore);
      return previousScore;
    }

    // Calculate expected increase based on DNA prediction
    const expectedIncrease = this.calculateDNAPredictedIncrease(currentDay, previousScore);
    console.log('[WealthScore] DNA predicted increase:', expectedIncrease);

    // Apply wealth affirmation bonus if completed
    let finalIncrease = expectedIncrease;
    if (wealthAffirmationCompleted) {
      const affirmationBonus = expectedIncrease * 0.3; // 30% bonus
      finalIncrease += affirmationBonus;
      console.log('[WealthScore] Applied affirmation bonus:', {
        baseIncrease: expectedIncrease,
        affirmationBonus,
        finalIncrease
      });
    }

    // Calculate new score and apply cap
    const maxScore = 100;
    const newScore = Math.min(Math.round(previousScore + finalIncrease), maxScore);
    
    console.log('[WealthScore] Final calculation:', {
      previousScore,
      expectedIncrease,
      finalIncrease,
      newScore,
      wasLimitedByCap: newScore === maxScore
    });

    return newScore;
  }

  private calculateDNAPredictedIncrease(currentDay: number, currentScore: number): number {
    console.log('[DNAPrediction] Calculating for:', { currentDay, currentScore });
    
    // Define phase parameters
    const phases = [
      { name: 'Quick Win', maxDay: 10, baseIncrease: 4 },
      { name: 'Steady Growth', maxDay: 30, baseIncrease: 3 },
      { name: 'Consistent Growth', maxDay: 120, baseIncrease: 2 },
      { name: 'Sustained Growth', maxDay: Infinity, baseIncrease: 1 }
    ];

    // Find current phase
    const currentPhase = phases.find(phase => currentDay <= phase.maxDay) || phases[phases.length - 1];
    
    // Calculate increase based on phase
    const phaseProgress = currentDay / currentPhase.maxDay;
    const increase = currentPhase.baseIncrease * (1 - (phaseProgress * 0.3)); // Gradual decrease within phase
    
    console.log('[DNAPrediction] Increase calculation:', {
      phase: currentPhase.name,
      phaseProgress,
      baseIncrease: currentPhase.baseIncrease,
      calculatedIncrease: increase
    });

    return increase;
  }
}