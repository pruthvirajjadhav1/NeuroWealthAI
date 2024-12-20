import { useState, useRef, useEffect } from 'react';
import { AudioProcessor } from '@/lib/audioProcessor';

export function useAudio() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasSpokenEnough, setHasSpokenEnough] = useState(false);
  const audioProcessor = useRef<AudioProcessor>();
  const timerRef = useRef<number>();
  const speakingTimeRef = useRef(0);

  useEffect(() => {
    audioProcessor.current = new AudioProcessor();
    return () => {
      window.clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async (onComplete?: () => void) => {
    try {
      await audioProcessor.current?.startRecording();
      setIsRecording(true);
      setRecordingTime(0);
      setIsSpeaking(false);
      setHasSpokenEnough(false);
      speakingTimeRef.current = 0;
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          // Check voice activity
          const isCurrentlySpeaking = audioProcessor.current?.isVoiceDetected() || false;
          setIsSpeaking(isCurrentlySpeaking);
          
          const nextTime = prev + 1;
          
          // At exactly 30 seconds, stop and process the recording
          if (nextTime >= 30) {
            window.clearInterval(timerRef.current);
            if (onComplete) {
              onComplete(); // Trigger the same processing as manual button press
            }
            return 30;
          }
          
          return nextTime;
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error; // Propagate error to component
    }
  };

  const stopRecording = async (
    isFirstRecording: boolean = false,
    currentDay: number = 0,
    previousScore: number = 0,
    gammaSessionCompleted: boolean = false
  ) => {
    if (!audioProcessor.current) return;
    
    window.clearInterval(timerRef.current);
    setIsRecording(false);
    
    const voiceMetrics = await audioProcessor.current.getVoiceMetrics();
    const audioBlob = await audioProcessor.current.stopRecording();
    const score = await audioProcessor.current.calculateWealthScore(
      isFirstRecording,
      currentDay,
      previousScore,
      gammaSessionCompleted
    );
    return { audioBlob, score, voiceMetrics };
  };

  return {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    analyserNode: audioProcessor.current?.getAnalyserNode(),
  };
}
