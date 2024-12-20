import { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  analyserNode?: AnalyserNode;
  isRecording: boolean;
}

export function WaveformVisualizer({ analyserNode, isRecording }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!analyserNode || !canvasRef.current || !isRecording) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);

    // Create gradient for the waveform
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, 'hsla(210, 100%, 60%, 0.8)');
    gradient.addColorStop(1, 'hsla(210, 100%, 40%, 0.8)');

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      analyserNode.getByteTimeDomainData(dataArray);
      
      // Clear canvas with dark background
      ctx.fillStyle = 'hsla(230, 25%, 10%, 0.95)';
      ctx.fillRect(0, 0, width, height);
      
      // Draw subtle grid
      ctx.beginPath();
      ctx.strokeStyle = 'hsla(230, 25%, 15%, 0.5)';
      ctx.lineWidth = 1;
      
      // Vertical grid lines
      for (let x = 0; x <= width; x += 50) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      
      // Horizontal grid lines
      for (let y = 0; y <= height; y += 25) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Draw main waveform
      ctx.lineWidth = 3;
      ctx.strokeStyle = gradient;
      ctx.beginPath();
      
      const sliceWidth = width / dataArray.length;
      let x = 0;
      
      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * height / 2;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      ctx.lineTo(width, height / 2);
      
      // Add glow effect
      ctx.shadowColor = 'hsla(210, 100%, 50%, 0.5)';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw reflection
      ctx.strokeStyle = 'hsla(210, 100%, 50%, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      x = 0;
      
      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = height - (v * height / 2);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      ctx.stroke();
      
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyserNode, isRecording]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-32 rounded-lg border border-border bg-background"
      width={800}
      height={128}
    />
  );
}
